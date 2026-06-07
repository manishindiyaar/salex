# Webhook & Message Pipeline

## How Meta Delivers Messages

When a customer sends a WhatsApp message, Meta's Cloud API posts to your webhook URL:

```
POST https://your-domain/v1/webhooks/whatsapp
```

The URL is configured in the Meta App Dashboard under WhatsApp > Configuration > Webhook URL.
For local development, this is tunneled via ngrok.

## Webhook Controller Flow

**File:** `apps/api/src/controllers/whatsapp-webhook.controller.ts`

### Step-by-step:

```
1. Receive POST request with JSON body
2. Parse payload via webhookEnhancerService.parseWebhookPayload()
3. Fast-path check: is phoneNumberId our shared platform number?
   ├── YES → Skip dedicated channel DB lookup (saves ~200ms)
   └── NO → Query WhatsAppChannel table for dedicated business
4. Signature verification (X-Hub-Signature-256 header)
   └── Uses WHATSAPP_APP_SECRET (or per-business appSecret for dedicated)
5. If payload is status-only (delivered/read receipt) → return 200, ignore
6. Log: customerPhone, messageType, messageId
7. Store event via whatsappInboundEventService.store()
8. Call whatsappDbWorkerService.kickInbound() → immediate processing
9. Return HTTP 200
```

### Webhook Verification (GET request)

Meta also sends a GET request to verify the webhook URL. The controller handles:
```
GET /v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=xxx&hub.challenge=yyy
```
Returns `hub.challenge` if `hub.verify_token` matches `WHATSAPP_VERIFY_TOKEN`.

## Payload Structure (from Meta)

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WABA_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "+1 555-645-5828",
          "phone_number_id": "1125541367309190"
        },
        "contacts": [{ "wa_id": "919801441675", "profile": { "name": "Customer" } }],
        "messages": [{
          "id": "wamid.HBgM...",
          "from": "919801441675",
          "timestamp": "1717300000",
          "type": "text",
          "text": { "body": "Hi" }
        }]
      },
      "field": "messages"
    }]
  }]
}
```

### Interactive Reply Payload (button/list tap)

```json
{
  "type": "interactive",
  "interactive": {
    "type": "list_reply",
    "list_reply": {
      "id": "service_cmpskelus000k...",
      "title": "Beard Trim",
      "description": "₹100 • 15 min"
    }
  }
}
```

## Inbound Event Storage

**File:** `apps/api/src/services/whatsapp-inbound-event.service.ts`

Stores the parsed message into `WhatsAppInboundEvent` table:

| Column | Purpose |
|--------|---------|
| waMessageId | Idempotency key (unique) — prevents duplicate processing |
| phoneNumberId | Which WhatsApp number received this |
| customerPhone | Sender's phone number |
| businessId | Resolved business (null for shared number) |
| messageType | text, interactive, image, etc. |
| messageText | Text body content |
| interactiveId | Button/list reply ID (e.g. "service_xxx") |
| interactiveText | Button/list reply title text |
| status | PENDING → PROCESSING → DONE/FAILED |
| attempts | Retry counter |

## Inbound Worker Processing

**File:** `apps/api/src/services/whatsapp-db-worker.service.ts` → `processInboundEvent()`

```
1. Acquire per-customer processing lock (prevents parallel processing)
2. Build interactiveReply object from event fields
3. Call engineRouter.route({customerPhone, messageText, interactiveReply, businessId})
4. Get back: { conversationId, message, engine }
5. Store audit record
6. Read conversation.version (for staleness stamp)
7. Create WhatsAppOutboundMessage with conversationVersion
8. Kick outbound worker
9. Mark inbound event as DONE
10. Release lock
```

## Outbound Worker Processing

**File:** `apps/api/src/services/whatsapp-db-worker.service.ts` → `processOutboundMessage()`

```
1. Claim pending outbound message (FOR UPDATE SKIP LOCKED)
2. STALE CHECK: Read conversation's current version
   ├── If conversation.version > message.conversationVersion → SKIP (drop)
   └── Continue if same version
3. AGE CHECK: If message is > 90s old → SKIP (expired)
4. Detect message type:
   ├── Flow CTA (__FLOW_CTA__ sentinel) → send via sendRawPayload
   └── Normal (text/button/list) → send via sendMessage
5. Call Meta Graph API
6. On success: mark SENT, log timing
7. On failure: increment attempts, schedule retry with backoff [10s, 30s, 120s, 600s, 1800s]
8. After 5 failures: mark FAILED
```

## Worker Kick Mechanism

Instead of waiting up to 1000ms for the next poll interval:

```typescript
// Called after storing inbound event
whatsappDbWorkerService.kickInbound();

// Called after creating outbound message
this.kickOutbound();
```

Uses `setImmediate()` to trigger processing on the next event loop turn.
Safe: if worker is already processing, the kick is a no-op (flag-based).

## Meta Graph API Calls (Sending Messages)

**File:** `apps/api/src/services/whatsapp.service.ts`

```
POST https://graph.facebook.com/v25.0/{phoneNumberId}/messages
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "919801441675",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "header": { "type": "text", "text": "📋 Faman Salon" },
    "body": { "text": "Select a service to book:" },
    "footer": { "text": "Tap to select" },
    "action": {
      "button": "View Services",
      "sections": [{
        "title": "Available services",
        "rows": [
          { "id": "service_xxx", "title": "Beard Trim", "description": "₹100 • 15 min" }
        ]
      }]
    }
  }
}
```

## Timing Observability

Every processed message logs:
- `queue_wait_ms` — time from event creation to processing start
- `response_generation_ms` — time spent in engine router
- `total_processing_ms` — full inbound processing time
- `outbound_queue_wait_ms` — time from outbound creation to send start
- `meta_send_ms` — Meta API round-trip time
