# The Architectural Journey: From a Naive Express App to a High-Performance Redis Queue

This document is a technical walkthrough designed for developers with basic Node.js and Express.js experience. It explains the step-by-step engineering decisions, failures, and first-principles deductions that led to the creation of Salex's WhatsApp queue and lock architecture.

---

## Phase 1: The Starting Point (The Naive Express App)

Imagine we are building a simple WhatsApp appointment booking bot. The customer texts a number, Meta forwards that message to our Express.js API via a webhook, and we handle the database and response in a standard HTTP request-response cycle.

Here is the code a beginner would write:

```javascript
// ❌ NAIVE APPROACH: Handling everything inside the HTTP route
app.post('/v1/webhooks/whatsapp', async (req, res) => {
  const { customerPhone, messageText } = parseMetaPayload(req.body);

  // 1. Fetch the customer's current conversation state from Database
  const session = await prisma.whatsAppConversation.findUnique({
    where: { customerPhone }
  });

  // 2. Perform business logic (e.g. check slot availability)
  const availableSlots = await availabilityService.checkSlots(session.businessId);

  // 3. Update the conversation context in the Database
  await prisma.whatsAppConversation.update({
    where: { customerPhone },
    data: { contextData: { ...session.contextData, selectedSlot: messageText } }
  });

  // 4. Send the outbound reply message back to the customer via Meta's HTTPS API
  // ⚠️ Slow network call: takes 500ms - 2000ms depending on Meta's server load
  await axios.post('https://graph.facebook.com/v19.0/messages', {
    to: customerPhone,
    text: { body: "Slot selected! Tapping 'Confirm' to finalize." }
  }, { headers: { Authorization: `Bearer ${META_TOKEN}` } });

  // 5. Send HTTP 200 OK back to Meta to confirm we received the webhook
  res.sendStatus(200);
});
```

---

## Phase 2: The Crash in Production (The First Wall)

When we deploy this simple Express app, it works perfectly for a single tester. However, once real customers start using the app, the system begins crashing. Why?

### Problem A: The Race Condition (Out-of-Order Execution)
If a customer double-taps a button, or sends two messages in quick succession, Meta fires two HTTP requests ($R_1$ and $R_2$) at the exact same time.

```
Time (ms)   Thread A (Processing R1)                Thread B (Processing R2)
────────────────────────────────────────────────────────────────────────────────────
0 ms        Reads DB: User is on "Slot Selection"   Reads DB: User is on "Slot Selection"
10 ms       Saves "Slot A" to memory context        Saves "Slot B" to memory context
50 ms       Writes "Slot A" to Database             │
100 ms      │                                       Writes "Slot B" to Database (Overwrites Slot A!)
```

Because both threads read the old state before the other could write, **Thread B overwrote Thread A's data**. The user's selection was corrupted, and the booking engine broke.

### Problem B: Meta's "Retry Storm"
To prevent users from waiting indefinitely, Meta's API has a strict timeout policy: **if our server doesn't respond with `200 OK` within 3 seconds, Meta terminates the request, assumes our server is offline, and retries sending the same message.**

Look at Step 4 in our naive code: `await axios.post(...)` makes an outbound HTTP request to Meta. 
* If Meta's servers are slow, or our server's network has a brief latency spike, this call can take **4 seconds**.
* Because we haven't sent `res.sendStatus(200)` yet, Meta times out and immediately triggers a **retry request**.
* Now, our server has two threads running for the *exact same message*, querying and updating the database simultaneously. This is a **Retry Storm** that quickly saturates our database connection pools, causing CPU usage to spike to 100% and crashing the app.

---

## Phase 3: The Logical Evolution (The SQL Queue Step)

We step back and apply **first-principles thinking**. We realize we have two conflicting constraints:
1. **We must process messages sequentially** per customer to prevent state corruption (no parallel processing for the same phone number).
2. **We must respond immediately** to Meta (within milliseconds) to prevent retry storms.

To achieve this, we must **decouple ingestion from execution**. We introduce a database-backed queue and worker system.

```
[Inbound Webhook] ──> Save raw event to DB (Status: PENDING) ──> Respond 200 OK instantly to Meta
                                                                           │
                                                                   (Processed Offline)
                                                                           ▼
                                                                [Background Worker Loop]
```

### The SQL Queue Code
We modify our webhook controller to just save the payload and exit:

```javascript
// Webhook Controller: Ingests payload in under 20ms
app.post('/v1/webhooks/whatsapp', async (req, res) => {
  await prisma.whatsAppInboundEvent.create({
    data: {
      customerPhone: req.body.phone,
      payload: req.body,
      status: 'PENDING'
    }
  });

  // Respond instantly
  res.sendStatus(200); 
});
```

Then, a background worker runs a continuous loop claiming events:

```javascript
// Background Worker Loop (claiming events atomically)
async function claimNextJob() {
  // Use "SKIP LOCKED" so multiple worker instances don't grab the same job
  const jobs = await prisma.$queryRaw`
    UPDATE "WhatsAppInboundEvent"
    SET "status" = 'PROCESSING'
    WHERE "id" = (
      SELECT "id" FROM "WhatsAppInboundEvent"
      WHERE "status" = 'PENDING'
      ORDER BY "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING *;
  `;
  return jobs[0];
}
```

### The New Bottleneck: SQL Disk I/O
While this solved the retry storms and race conditions, we quickly hit a **new bottleneck**:
* Relational databases (like PostgreSQL) are **disk-backed**. To guarantee that data is not lost, PostgreSQL must write transaction logs (Write-Ahead Logging) to the physical disk.
* For every single message, the database has to execute multiple updates, inserts, and deletes:
  1. Insert into `WhatsAppInboundEvent` (Write to Disk)
  2. Update status to `PROCESSING` (Write to Disk)
  3. Insert into `WhatsAppProcessingLock` (Write to Disk)
  4. Update `WhatsAppConversation` context (Write to Disk)
  5. Delete from `WhatsAppProcessingLock` (Write to Disk)
  6. Update `WhatsAppInboundEvent` to `DONE` (Write to Disk)
* These disk-bound writes take between **10ms to 50ms** each. Under high concurrency, the disk heads become saturated, transactions block each other, and response latency increases.

---

## Phase 4: The Final Masterpiece (Redis + BullMQ)

To solve the disk latency bottleneck, we introduce **Redis**. 

### What is Redis?
Unlike PostgreSQL, which stores data on disk, **Redis stores everything in RAM (Memory)**. 
* Reading or writing to RAM takes **microseconds** (less than 1 millisecond), making it thousands of times faster than writing to disk.
* Redis is single-threaded and executes commands atomically, which is perfect for building high-speed queues and locks without database row conflicts.

We use **BullMQ** (a Redis-backed queue manager) to handle the queueing, and use Redis key-value expiration for locks.

```
                           [ Inbound Webhook ]
                                    │
                         (Enqueue Job in Redis)
                                    ▼
                          [ Redis Memory Queue ]
                                    │
                           (Claim Job in RAM)
                                    ▼
            [ Lock customer key: lock:whatsapp:phone in RAM ]
                                    │
                        [ Run Business Logic ]
                                    │
                         [ Release Lock in RAM ]
```

### The Redis/BullMQ Code

#### 1. Ingesting via Redis Queue
When the webhook arrives, we push the job to the Redis queue. This takes less than 1 millisecond:

```typescript
import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redisConn = new Redis(process.env.REDIS_URL);
const inboundQueue = new Queue('whatsapp-inbound', { connection: redisConn });

app.post('/v1/webhooks/whatsapp', async (req, res) => {
  const parsed = parseMetaPayload(req.body);

  // Push the message directly into Redis memory
  await inboundQueue.add('inbound-message', {
    customerPhone: parsed.customerPhone,
    messageText: parsed.messageText
  }, {
    jobId: parsed.messageId // ⚡ Idempotency: Redis ignores duplicate job IDs!
  });

  // Respond instantly
  res.sendStatus(200);
});
```

#### 2. Non-blocking In-Memory Locking
Instead of writing a lock row to a SQL disk table, we set a temporary key in Redis memory:

```typescript
async function acquireLock(phone: string, workerId: string): Promise<boolean> {
  const lockKey = `lock:whatsapp:${phone}`;
  // NX = Only set key if it doesn't exist (Atomic lock check)
  // PX 120000 = Auto-delete the key after 2 minutes (Self-cleaning safety)
  const result = await redisConn.set(lockKey, workerId, 'NX', 'PX', 120000);
  return result === 'OK';
}
```

#### 3. The Redis Worker
The worker processes events sequentially per customer, managing retries and rate limits automatically:

```typescript
import { Worker } from 'bullmq';

const worker = new Worker('whatsapp-inbound', async (job) => {
  const { customerPhone, messageText } = job.data;
  const workerId = `worker-${process.pid}`;

  // 1. Try to lock this user's phone number in Redis memory
  const isLocked = await acquireLock(customerPhone, workerId);
  if (!isLocked) {
    // If locked, throw error. BullMQ catches this and retries the job later.
    throw new Error(`User ${customerPhone} is currently active. Postponing message.`);
  }

  try {
    // 2. Fetch state & run booking logic (Only reads/writes to DB for final changes)
    const reply = await executeBookingLogic(customerPhone, messageText);
    
    // 3. Send message back to user
    await whatsappService.sendMessage(customerPhone, reply);

  } finally {
    // 4. Always release the lock
    await releaseLock(customerPhone, workerId);
  }
}, {
  connection: redisConn,
  concurrency: 10 // Protect database from overload (limit parallel workers)
});
```

---

## 5. Visualizing the Data Flow

Here is the path a WhatsApp message takes through this architecture:

```
[Customer Phone]
      │ (Texts: "I want to book at 10 AM")
      ▼
[Meta Gateway]
      │ (Sends HTTPS POST Webhook)
      ▼
[Salex API Server]
      │
      ├── 1. Parse payload metadata
      ├── 2. Push message payload into [ Redis In-Memory Queue ] (Takes < 1ms)
      └── 3. Send "200 OK" immediately back to Meta (Takes < 20ms)
               (Meta connection terminates successfully — NO RETRY STORMS)

                         ~ Offline Background Processing ~

[Redis In-Memory Queue]
      │ (Worker pops message off queue)
      ▼
[Inbound Worker]
      │
      ├── 4. Request Lock: lock:whatsapp:customerPhone in [ Redis RAM ]
      │      ├── Lock Active ──> Fail job and postpone (Preserves message sequence)
      │      └── Lock Acquired ──> Proceed
      │
      ├── 5. Read active Conversation variables from [ SQL DB ]
      ├── 6. Perform availability checks (In-Memory CPU calculations)
      ├── 7. Write new Conversation state & context variables to [ SQL DB ]
      ├── 8. Push response payload to [ Redis Outbound Queue ]
      ├── 9. Release lock in [ Redis RAM ]
      ▼
[Outbound Worker]
      │ (Pops message off Outbound Queue)
      ├── 10. Check version and age safety guards
      ├── 11. Send payload to Meta Cloud API (Takes 500ms - 2000ms)
      └── 12. Record message audit trails in [ SQL DB ]
              │
              ▼
      [Customer Phone] (Receives: "Your booking is confirmed!")
```
