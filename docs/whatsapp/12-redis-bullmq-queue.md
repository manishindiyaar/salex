# Redis + BullMQ Queue Architecture

## Overview

The WhatsApp message pipeline can run on two backends:
1. **PostgreSQL polling** (legacy, default) — `WHATSAPP_QUEUE_BACKEND=db`
2. **Redis + BullMQ** (recommended for production) — `WHATSAPP_QUEUE_BACKEND=redis`

When Redis is active, the DB polling worker does NOT run. No duplicate processing.

## Why Redis/BullMQ?

| Concern | DB Polling | Redis/BullMQ |
|---------|-----------|--------------|
| Latency | 0-1000ms poll interval + kick | Near-instant job dispatch |
| Concurrency | Single-threaded polling | Configurable (10+ workers) |
| Locking | DB FOR UPDATE SKIP LOCKED | Redis SET NX (atomic, faster) |
| Retry backoff | Manual logic | Built-in exponential backoff |
| Job deduplication | DB unique constraint | BullMQ job ID dedup |
| Multi-instance | Contention on DB locks | Clean distributed processing |
| Observability | Custom logging | BullMQ dashboard (Bull Board) |

## Architecture

```
Webhook Controller
  │
  ├── WHATSAPP_QUEUE_BACKEND=redis
  │     │
  │     └── whatsappQueueService.enqueueInbound(normalizedPayload)
  │           │
  │           └── BullMQ Queue: "whatsapp-inbound"
  │                 │
  │                 └── Inbound Worker (BullMQ)
  │                       │
  │                       ├── Acquire Redis lock (per customer)
  │                       ├── engineRouter.route(...)
  │                       ├── Write audit to Postgres
  │                       ├── whatsappQueueService.enqueueOutbound(response)
  │                       │     │
  │                       │     └── BullMQ Queue: "whatsapp-outbound"
  │                       │           │
  │                       │           └── Outbound Worker (BullMQ)
  │                       │                 │
  │                       │                 ├── Stale version check
  │                       │                 ├── Age expiry check
  │                       │                 ├── whatsappService.sendMessage()
  │                       │                 └── Write audit to Postgres
  │                       │
  │                       └── Release Redis lock
  │
  └── WHATSAPP_QUEUE_BACKEND=db (legacy)
        │
        └── whatsappInboundEventService.store() + kickInbound()
              │
              └── DB Worker (polling every 1s) ...
```

## Required Environment Variables

```env
# Redis connection
# Local development:
REDIS_URL=redis://localhost:6379

# Railway staging/production:
REDIS_URL=redis://default:password@host:port

# Switch to Redis backend
WHATSAPP_QUEUE_BACKEND=redis

# Worker configuration
WHATSAPP_WORKERS_ENABLED=true
WHATSAPP_DB_WORKERS_ENABLED=false
WHATSAPP_INBOUND_CONCURRENCY=10
WHATSAPP_OUTBOUND_CONCURRENCY=10
```

## Local Redis Setup

Use local Redis for development so local jobs do not mix with staging jobs.

### 1. Start Redis locally

```bash
docker run -d --name salex-redis -p 6379:6379 redis:7-alpine
```

If the container already exists:

```bash
docker start salex-redis
```

Verify Redis is responding:

```bash
docker exec salex-redis redis-cli ping
```

Expected output:

```text
PONG
```

### 2. Configure `apps/api/.env`

```env
REDIS_URL=redis://localhost:6379
WHATSAPP_QUEUE_BACKEND=redis
WHATSAPP_WORKERS_ENABLED=true
WHATSAPP_DB_WORKERS_ENABLED=false
WHATSAPP_INBOUND_CONCURRENCY=5
WHATSAPP_OUTBOUND_CONCURRENCY=5
```

Local concurrency is intentionally lower than staging/production. It is enough to test the worker pipeline without putting unnecessary load on a laptop.

### 3. Start the API

```bash
pnpm --filter api dev
```

Expected startup logs:

```text
WhatsApp BullMQ workers started (inbound + outbound)
Queue backend: Redis (BullMQ)
Server running on port 3001
```

Verify health:

```bash
curl -s http://localhost:3001/health
```

Expected response contains:

```json
{ "success": true }
```

### 4. Verify BullMQ touched Redis

```bash
docker exec salex-redis redis-cli keys 'bull:*'
```

Expected keys include:

```text
bull:whatsapp-inbound:meta
bull:whatsapp-outbound:meta
```

### 5. Stop local Redis when done

```bash
docker stop salex-redis
```

## Railway Redis Setup

1. In the Railway project, click `New Service` -> `Database` -> `Redis`.
2. Wait until Redis is online.
3. Open the API service variables, not the Redis service variables.
4. Set `REDIS_URL` using a Railway variable reference:

```env
REDIS_URL=${{Redis.REDIS_URL}}
```

If the Redis service has a different name, use that service name:

```env
REDIS_URL=${{YOUR_REDIS_SERVICE_NAME.REDIS_URL}}
```

5. Set the queue variables on the API service:

```env
WHATSAPP_QUEUE_BACKEND=redis
WHATSAPP_WORKERS_ENABLED=true
WHATSAPP_DB_WORKERS_ENABLED=false
WHATSAPP_INBOUND_CONCURRENCY=10
WHATSAPP_OUTBOUND_CONCURRENCY=10
```

6. Redeploy the API service.
7. Confirm API logs show:

```text
WhatsApp BullMQ workers started (inbound + outbound)
Queue backend: Redis (BullMQ)
```

Do not use `REDIS_PUBLIC_URL` for normal Railway-to-Railway communication. `REDIS_PUBLIC_URL` is only useful when a local machine needs to connect to Railway Redis for a one-off test. Prefer local Docker Redis for local development.

## Queue Names

BullMQ reserves `:` for internal key formatting, so queue names must not contain colons.

Current queue names:

```text
whatsapp-inbound
whatsapp-outbound
```

Redis keys generated by BullMQ still contain colons internally, for example:

```text
bull:whatsapp-inbound:meta
bull:whatsapp-outbound:meta
```

Do not rename the queues without checking both queue producers and workers:

- `apps/api/src/queues/whatsapp-queues.ts`
- `apps/api/src/workers/whatsapp-inbound.worker.ts`
- `apps/api/src/workers/whatsapp-outbound.worker.ts`

## Job Payloads

### Inbound Job (`whatsapp-inbound`)

```typescript
{
  waMessageId: string;      // Meta's unique message ID (idempotency key)
  phoneNumberId?: string;   // Which WA number received this
  customerPhone: string;    // Sender's phone
  businessId?: string;      // Resolved business (null for shared number)
  messageType: string;      // text, interactive, etc.
  messageText?: string;     // Text body
  interactiveReply?: {      // Button/list tap
    type: string;
    id: string;
    title: string;
    description?: string;
  };
  receivedAt: string;       // ISO timestamp of webhook receipt
}
```

### Outbound Job (`whatsapp-outbound`)

```typescript
{
  waMessageId: string;           // Links back to inbound
  conversationId: string;        // For stale check
  toPhone: string;               // Recipient
  phoneNumberId?: string;        // Send from this number
  businessId?: string;           // For dedicated channel credentials
  messageType: string;           // text, list, button
  payload: InteractiveMessage;   // The actual message content
  conversationVersion: number;   // Stale guard stamp
  engine: string;                // 'flow' or 'legacy'
  createdAt: string;             // For age-based expiry
}
```

## Idempotency

- Inbound job ID: `inbound:${waMessageId}` — Meta may retry webhooks; same message won't be processed twice
- Outbound job ID: `outbound:${waMessageId}:response` — each inbound produces exactly one outbound

BullMQ silently ignores `queue.add()` if a job with that ID already exists.

## Locking (Per-Customer Serialization)

Redis lock key: `lock:whatsapp:${businessId || phoneNumberId || "shared"}:${customerPhone}`

- Uses `SET key token PX 120000 NX` (atomic acquire with 2min TTL)
- Release uses Lua script to only delete if token matches (prevents releasing someone else's lock)
- If lock is busy, the BullMQ job throws → retried with exponential backoff

## Stale Message Protection

Same logic as the DB worker:
1. Outbound job carries `conversationVersion` from when it was generated
2. Before sending, worker reads current `conversation.version`
3. If current > stored → message is stale → dropped (logged as failed audit)
4. If message is older than 90s → expired → dropped

## Files

```
apps/api/src/
├── queues/
│   ├── redis-connection.ts         ← IORedis connection factory
│   └── whatsapp-queues.ts          ← BullMQ queue definitions + types
├── workers/
│   ├── whatsapp-inbound.worker.ts  ← Process inbound messages
│   ├── whatsapp-outbound.worker.ts ← Send outbound messages
│   └── whatsapp-workers.ts         ← Start/stop orchestrator
├── services/
│   └── whatsapp-queue.service.ts   ← Enqueue helpers (used by webhook controller)
└── server.ts                       ← Starts workers based on config
```

## Monitoring

BullMQ jobs have built-in lifecycle states:
- `waiting` -> `active` -> `completed` / `failed`

Failed jobs are retained (up to 5000) for debugging. Completed jobs are auto-cleaned (keep 1000).

You can add [Bull Board](https://github.com/felixmosh/bull-board) for a web UI to monitor queues.

## Fallback / Migration

To switch back to DB polling temporarily:
```env
WHATSAPP_QUEUE_BACKEND=db
WHATSAPP_DB_WORKERS_ENABLED=true
```

Both backends use the same `engineRouter.route()` and `whatsappService.sendMessage()`. Business logic is identical. Only the queueing/dispatching layer changes.
