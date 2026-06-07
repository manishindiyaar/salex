# Configuration Reference

## Environment Variables

All WhatsApp-related configuration is in `apps/api/.env`.

### Core WhatsApp API

| Variable | Required | Description |
|----------|----------|-------------|
| `WHATSAPP_APP_SECRET` | Yes | Meta App Secret for webhook signature verification |
| `WHATSAPP_ACCESS_TOKEN` | Yes | Access token for sending messages via Graph API |
| `WHATSAPP_PHONE_NUMBER_ID` | Yes | The shared platform phone number ID |
| `WHATSAPP_VERIFY_TOKEN` | Yes | Token for webhook URL verification (GET request) |
| `WHATSAPP_GRAPH_API_VERSION` | No | Graph API version (default: `v25.0`) |
| `WHATSAPP_MODE` | No | `production` or `simulator` (default: `simulator`) |

### Workers

| Variable | Required | Description |
|----------|----------|-------------|
| `WHATSAPP_QUEUE_BACKEND` | No | Queue backend: `db` or `redis` (default: `db`) |
| `REDIS_URL` | Required when Redis backend is active | Redis connection URL for BullMQ queues and Redis locks |
| `WHATSAPP_WORKERS_ENABLED` | No | Master switch for WhatsApp workers (default: `true`) |
| `WHATSAPP_DB_WORKERS_ENABLED` | No | Enable legacy DB polling workers. Set `false` when `WHATSAPP_QUEUE_BACKEND=redis` |
| `WHATSAPP_INBOUND_CONCURRENCY` | No | Number of inbound WhatsApp jobs processed in parallel (local: `5`, staging/prod: `10+`) |
| `WHATSAPP_OUTBOUND_CONCURRENCY` | No | Number of outbound WhatsApp sends processed in parallel (local: `5`, staging/prod: `10+`) |

Recommended local Redis worker config:

```env
REDIS_URL=redis://localhost:6379
WHATSAPP_QUEUE_BACKEND=redis
WHATSAPP_WORKERS_ENABLED=true
WHATSAPP_DB_WORKERS_ENABLED=false
WHATSAPP_INBOUND_CONCURRENCY=5
WHATSAPP_OUTBOUND_CONCURRENCY=5
```

Recommended Railway staging/prod Redis worker config:

```env
REDIS_URL=${{Redis.REDIS_URL}}
WHATSAPP_QUEUE_BACKEND=redis
WHATSAPP_WORKERS_ENABLED=true
WHATSAPP_DB_WORKERS_ENABLED=false
WHATSAPP_INBOUND_CONCURRENCY=10
WHATSAPP_OUTBOUND_CONCURRENCY=10
```

`WHATSAPP_INBOUND_CONCURRENCY` means how many incoming customer messages can be processed at the same time. `WHATSAPP_OUTBOUND_CONCURRENCY` means how many Salex replies can be sent at the same time.

### Meta WhatsApp Flows

| Variable | Required | Description |
|----------|----------|-------------|
| `WHATSAPP_BUSINESS_SELECTION_FLOW_ID` | No | Meta Flow ID for salon selection UI |
| `WHATSAPP_BUSINESS_SELECTION_FLOW_MODE` | No | `draft` or `published` (default: `draft`) |
| `WHATSAPP_FLOW_PRIVATE_KEY` | No | RSA private key (PEM) for Flow encryption |
| `WHATSAPP_FLOW_TOKEN_SECRET` | No | Secret for generating flow session tokens |
| `WHATSAPP_FLOW_ENDPOINT_ENABLED` | No | Master switch for Flow feature (default: `false`) |

### Flow Engine

| Variable | Required | Description |
|----------|----------|-------------|
| `FLOW_ENGINE_GLOBAL_CUTOVER` | No | Route ALL traffic to flow engine (default: `false`) |

### Channel Encryption

| Variable | Required | Description |
|----------|----------|-------------|
| `CHANNEL_ENCRYPTION_KEY` | No | 64-char hex key for encrypting per-business WhatsApp credentials |

## Feature Flags

### `isWhatsAppFlowEnabled()`
Returns `true` if `WHATSAPP_BUSINESS_SELECTION_FLOW_ID` is set AND `WHATSAPP_FLOW_ENDPOINT_ENABLED` is true.
When enabled: greeting sends a Flow CTA button. When disabled: greeting sends plain text.

### `FLOW_ENGINE_GLOBAL_CUTOVER`
When `true`: ALL businesses use the flow engine regardless of per-business flags.
When `false`: only businesses with `whatsappSettings.flowEngineEnabled = true` or an active published flow use the flow engine.

### Per-Business Flow Engine Flag
Stored in `Business.whatsappSettings` JSON:
```json
{ "flowEngineEnabled": true }
```

## Token Types

### Temporary User Token (current)
- Generated in Meta App Dashboard → WhatsApp → API Setup → Generate Token
- Expires in ~24 hours (or 60 days for extended tokens)
- Requires manual renewal
- **Causes outages when it expires**

### System User Permanent Token (recommended for production)
- Created via Business Manager → System Users → Generate Token
- Never expires
- Scoped to specific WABAs
- **Eliminates the token-expiry problem entirely**

## Important Timeouts/Thresholds

| Constant | Value | Location |
|----------|-------|----------|
| Conversation timeout | 24 hours | conversation.service.ts, flow-engine.service.ts |
| Outbound max age | 90 seconds | whatsapp-db-worker.service.ts, whatsapp-outbound.worker.ts |
| Booking intent hold | 10 minutes | confirmation.ts |
| DB worker poll interval | 1000ms | whatsapp-db-worker.service.ts |
| DB lock stale threshold | 2 minutes | whatsapp-db-worker.service.ts |
| Redis lock TTL | 2 minutes | whatsapp-inbound.worker.ts |
| Max DB retry attempts | 5 | whatsapp-db-worker.service.ts |
| Max BullMQ retry attempts | 5 | whatsapp-queues.ts |
| DB retry backoff | 10s, 30s, 120s, 600s, 1800s | whatsapp-db-worker.service.ts |
| BullMQ retry backoff | exponential: inbound 5s, outbound 3s | whatsapp-queues.ts |
| Max auto-advance steps | 50 | flow-engine.service.ts |
