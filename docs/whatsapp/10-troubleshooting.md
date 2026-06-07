# Troubleshooting

## Common Issues

### 1. Messages Not Being Received (No Webhook Hits)

**Symptoms:** No `POST /v1/webhooks/whatsapp` in logs.

**Check:**
- Is ngrok running? Check `http://127.0.0.1:4040` for tunnel status
- Is the webhook URL correct in Meta Dashboard? Should be `https://YOUR_NGROK.ngrok-free.app/v1/webhooks/whatsapp`
- Is the Meta App subscribed to `messages` webhook field?
- Free ngrok URLs change on restart — update Meta Dashboard after each ngrok restart

### 2. Messages Received But No Response Sent

**Symptoms:** Webhook returns 200, inbound event stored, but customer gets no reply.

**Likely causes:**

**A. Token expired**
```
ERROR: WhatsApp send failed [400]: ...expired...
```
Fix: Generate new token in Meta Dashboard, update `.env`, restart server.

**B. Worker not running**
Check if `WHATSAPP_DB_WORKERS_ENABLED=true` in .env and server log shows:
```
INFO: WhatsApp DB workers started
```

**C. Stale messages dropped**
```
INFO: Dropped stale outbound message
```
This is intentional. The conversation moved on — the old message was correctly dropped.

**D. Processing lock stuck**
If a previous crash left a lock:
```sql
DELETE FROM "WhatsAppProcessingLock" WHERE "lockKey" = 'whatsapp:919801441675';
```

### 3. Duplicate/Wrong Screen Sent

**Symptoms:** Customer receives an outdated screen (e.g., confirmation after already booking).

**Root cause:** An old outbound message from a failed retry was finally sent after the conversation advanced.

**Fixed by:** The stale message guard (conversationVersion check). If you still see this, the message was created before the fix was deployed. Clear stuck messages:

```sql
UPDATE "WhatsAppOutboundMessage"
SET status = 'FAILED', error = 'manually_cleared'
WHERE "toPhone" = '919801441675' AND status = 'PENDING';
```

### 4. "Blocked by Integrity" Error (Code 139000)

```
ERROR: WhatsApp Flow CTA send failed [400]: (#139000) Blocked by Integrity
```

**Cause:** Meta test numbers cannot send Flow CTA messages. Only verified business numbers can.

**Fix:** Disable Flows: `WHATSAPP_FLOW_ENDPOINT_ENABLED=false`. The system falls back to chat-based search.

### 5. Conversation Stuck in Wrong State

**Symptoms:** Customer keeps getting the same screen regardless of input.

**Fix:** Reset the conversation:
```javascript
await prisma.whatsAppConversation.updateMany({
  where: { customerPhone: { contains: 'PHONE_NUMBER' } },
  data: { 
    state: 'GREETING', 
    contextData: {}, 
    businessId: null, 
    flowId: null, 
    flowVersion: null,
    lastMessageAt: new Date(0)
  },
});
```

### 6. Flow Engine Dead-End

```
ERROR: Flow engine: dead-end, no outgoing edge matched
```

**Cause:** The flow definition doesn't have an edge from the current node for the given context conditions.

**Fix:** Check the business's flow definition edges. Ensure all conditions have a matching path.

## Manual Database Operations

### Check conversation state
```sql
SELECT id, state, "businessId", "contextData", version, "lastMessageAt"
FROM "WhatsAppConversation"
WHERE "customerPhone" LIKE '%919801441675%'
ORDER BY "lastMessageAt" DESC LIMIT 1;
```

### Check pending outbound messages
```sql
SELECT id, status, error, attempts, "conversationVersion", "createdAt"
FROM "WhatsAppOutboundMessage"
WHERE "toPhone" = '919801441675' AND status IN ('PENDING', 'PROCESSING')
ORDER BY "createdAt" DESC;
```

### Check inbound event processing
```sql
SELECT id, status, error, attempts, "messageType", "createdAt"
FROM "WhatsAppInboundEvent"
WHERE "customerPhone" = '919801441675'
ORDER BY "createdAt" DESC LIMIT 5;
```

### Force-retry stuck outbound messages
```sql
UPDATE "WhatsAppOutboundMessage"
SET attempts = 0, "nextAttemptAt" = NULL, error = NULL
WHERE status = 'PENDING' AND "toPhone" = '919801441675' AND error IS NOT NULL;
```

### Clear all stuck messages (nuclear option)
```sql
UPDATE "WhatsAppOutboundMessage"
SET status = 'FAILED', error = 'manually_cleared'
WHERE status IN ('PENDING', 'PROCESSING') AND "toPhone" = '919801441675';
```

## Log Patterns to Look For

### Healthy message flow
```
INFO: Storing WhatsApp webhook message
INFO: WhatsApp inbound event stored
INFO: Engine routing decision { businessId, chosenEngine, actualEngine }
INFO: Inbound event processed — outbound queued { queue_wait_ms, response_generation_ms }
INFO: WhatsApp message sent { to, type, phoneNumberId, messageId }
INFO: Outbound message sent { outbound_queue_wait_ms, meta_send_ms }
```

### Problem indicators
```
WARN: WhatsApp outbound message send failed          ← send error (check meta API)
ERROR: WhatsApp send failed [400]: ...               ← specific Meta API error
INFO: Dropped stale outbound message                 ← version mismatch (usually OK)
INFO: Dropped expired outbound message               ← too old (usually OK)
WARN: Inbound phone_number_id did not match...       ← shared number (expected)
ERROR: Flow engine: dead-end                         ← flow definition issue
```

## Development Tips

1. **Use ngrok inspector** (`http://127.0.0.1:4040`) to see all webhook requests/responses
2. **Restart server after .env changes** — config is loaded once at boot
3. **The test number expires tokens frequently** — consider generating a 60-day token
4. **Reset conversation state** before each test session to start fresh
5. **Check `WhatsAppOutboundMessage` table** when messages seem stuck
6. **The `version` column tells you how many state changes happened** — useful for debugging stale message issues
