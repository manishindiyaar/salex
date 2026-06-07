# Architecture Overview

## System Design

The WhatsApp booking system is a **queue-based, event-driven architecture** built on:
- Express.js API server
- PostgreSQL (via Prisma ORM, hosted on Supabase)
- Meta WhatsApp Business Cloud API
- Ngrok for local webhook tunneling (production will use a proper domain)

## High-Level Data Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│  Customer   │ ──────► │  Meta Cloud  │ ──────► │  Webhook POST   │
│  WhatsApp   │         │  API Server  │         │  /v1/webhooks/  │
└─────────────┘         └──────────────┘         │  whatsapp       │
                                                  └────────┬────────┘
                                                           │
                                              ┌────────────▼────────────┐
                                              │  Webhook Controller     │
                                              │  • Validate signature   │
                                              │  • Parse payload        │
                                              │  • Detect shared/       │
                                              │    dedicated number     │
                                              │  • Store inbound event  │
                                              │  • Kick inbound worker  │
                                              └────────────┬────────────┘
                                                           │
                                              ┌────────────▼────────────┐
                                              │  Inbound DB Worker      │
                                              │  • Claim event (lock)   │
                                              │  • Route via            │
                                              │    EngineRouter         │
                                              │  • Get response message │
                                              │  • Create outbound row  │
                                              │  • Kick outbound worker │
                                              └────────────┬────────────┘
                                                           │
                                              ┌────────────▼────────────┐
                                              │  Outbound DB Worker     │
                                              │  • Claim outbound msg   │
                                              │  • Staleness check      │
                                              │  • Send via Meta API    │
                                              │  • Mark SENT/SKIPPED    │
                                              └────────────┬────────────┘
                                                           │
                                              ┌────────────▼────────────┐
                                              │  Meta Graph API         │
                                              │  POST /{phoneId}/       │
                                              │  messages               │
                                              └────────────┬────────────┘
                                                           │
                                              ┌────────────▼────────────┐
                                              │  Customer receives      │
                                              │  reply on WhatsApp      │
                                              └─────────────────────────┘
```

## Why Queue-Based (Not Inline)?

The webhook must return HTTP 200 within ~5 seconds or Meta will retry. Processing a booking message involves:
- Database lookups (conversation, business, services, availability)
- State machine logic
- Response generation

This can take 1-3 seconds. To keep webhook latency low (~100ms), we:
1. Store the raw event in `WhatsAppInboundEvent` table
2. Return 200 immediately
3. A background worker picks up the event and processes it
4. The response is queued in `WhatsAppOutboundMessage` table
5. Another worker sends it via Meta API

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| DB queue over Redis/BullMQ | Simpler ops, single DB, sufficient for current scale. Redis path documented for future. |
| Per-customer locking | Prevents race conditions when two messages arrive rapidly from the same customer |
| Conversation version stamping | Prevents stale messages from being sent after conversation advances |
| 90s outbound expiry | Safety net for messages stuck during outages |
| Idempotency by waMessageId | Prevents duplicate processing if Meta retries the webhook |
| Immediate worker kick | Reduces latency from 0-1000ms poll interval to near-zero |

## Database Models (simplified)

```
WhatsAppInboundEvent     → Raw incoming messages (queue)
WhatsAppOutboundMessage  → Pending/sent outgoing messages (queue)
WhatsAppConversation     → Active conversation state + context
WhatsAppMessage          → Audit trail of all messages
BookingIntent            → Short-lived booking hold before confirmation
Business                 → Salon/shop entity
Service                  → Available services for a business
Staff                    → Staff members
Resource                 → Chairs/rooms (for parallel booking)
```

## Component Responsibilities

| Component | Single Responsibility |
|-----------|----------------------|
| Webhook Controller | Accept, validate, store, return 200 |
| Inbound Worker | Process stored events → generate response |
| Engine Router | Decide: legacy engine or flow engine? |
| Conversation Service | Legacy state machine (switch/case) |
| Flow Engine | Graph-based dynamic flow execution |
| Outbound Worker | Send messages, handle retries, drop stale |
| WhatsApp Service | HTTP client for Meta Graph API |
| SharedBusinessResolver | Salon search and routing code lookup |
