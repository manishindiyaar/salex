# WhatsApp Booking System — Developer Documentation

This folder contains the complete technical documentation for Salex's WhatsApp-based booking system.

## Table of Contents

| Document | What It Covers |
|----------|---------------|
| [Architecture Overview](./01-architecture-overview.md) | High-level system design, components, data flow diagram |
| [Webhook & Message Pipeline](./02-webhook-message-pipeline.md) | How Meta delivers messages, signature verification, inbound/outbound queue |
| [Engine Router & State Machine](./03-engine-router-state-machine.md) | How messages are routed between legacy and flow engine, state transitions |
| [Flow Engine Deep Dive](./04-flow-engine.md) | Node handlers, auto-advance, graph execution, context management |
| [Booking Flow UX](./05-booking-flow-ux.md) | Customer-facing flow: salon search → service → time → confirm → booked |
| [Navigation & Session Management](./06-navigation-session.md) | Back/edit/start-over, stale message guard, session reset rules |
| [Meta WhatsApp Flows (Native UI)](./07-meta-whatsapp-flows.md) | Meta's Flow framework, encryption, data endpoint, salon finder flow |
| [Shared vs Dedicated Numbers](./08-shared-vs-dedicated.md) | Multi-tenant shared number vs per-business dedicated channels |
| [Configuration Reference](./09-configuration.md) | All env vars, feature flags, and their effects |
| [Troubleshooting](./10-troubleshooting.md) | Common issues, debugging tips, manual DB operations |
| [Complete Product Flow](./11-complete-product-flow.md) | Full E2E data flow: all actors, API endpoints, auth, booking lifecycle, schema |
| [Redis + BullMQ Queue](./12-redis-bullmq-queue.md) | Railway Redis setup, BullMQ architecture, job payloads, migration guide |
| [Meta Platform Strategy 2026](./13-meta-platform-strategy-2026.md) | Meta platform updates, account model roadmap, conversation ownership, billing, AI strategy |

## Quick Start for New Developers

1. Read [Architecture Overview](./01-architecture-overview.md) first
2. Then [Webhook & Message Pipeline](./02-webhook-message-pipeline.md) to understand the data flow
3. Then [Engine Router](./03-engine-router-state-machine.md) to understand routing decisions
4. Then [Meta Platform Strategy 2026](./13-meta-platform-strategy-2026.md) to understand upcoming account, billing, and multi-partner changes
5. Run the API locally and send a WhatsApp message to the test number to see it end-to-end

## Key Files Map

```
apps/api/src/
├── controllers/
│   └── whatsapp-webhook.controller.ts   ← Meta webhook entry point
├── services/
    │   ├── whatsapp.service.ts              ← Sends messages via Meta Graph API
    │   ├── whatsapp-queue.service.ts        ← Enqueues Redis/BullMQ inbound/outbound jobs
    │   ├── whatsapp-db-worker.service.ts    ← Legacy DB polling queue processor
    │   ├── whatsapp-inbound-event.service.ts← Legacy DB inbound event storage
│   ├── webhook-enhancer.service.ts      ← Parses Meta webhook payloads
│   ├── engine-router.service.ts         ← Routes to legacy or flow engine
│   ├── conversation.service.ts          ← Legacy state machine (GREETING → COMPLETED)
│   ├── flow-engine.service.ts           ← Graph-based flow engine
│   ├── shared-business-resolver.service.ts ← Salon search/routing code lookup
│   ├── whatsapp-ui.service.ts           ← Button/list message builders + nav parser
│   ├── whatsapp-flow-crypto.service.ts  ← Meta Flow encryption/decryption
    │   └── flow-handlers/
│       ├── service-picker.ts            ← Service selection node
│       ├── staff-picker.ts              ← Staff selection node
│       ├── time-picker.ts               ← Time slot selection node
│       ├── confirmation.ts              ← Booking confirmation node
│       └── booking.ts                   ← Booking finalization node
    ├── routes/
    │   ├── webhook.routes.ts                ← /v1/webhooks/whatsapp
    │   └── whatsapp-flow.routes.ts          ← /api/v1/whatsapp/flows/business-selection
    ├── queues/
    │   ├── redis-connection.ts              ← Redis connection options for BullMQ/Railway
    │   └── whatsapp-queues.ts               ← BullMQ queue names and job payload types
    ├── workers/
    │   ├── whatsapp-inbound.worker.ts       ← Redis/BullMQ inbound job processor
    │   ├── whatsapp-outbound.worker.ts      ← Redis/BullMQ outbound sender
    │   └── whatsapp-workers.ts              ← Starts/stops WhatsApp Redis workers
packages/shared-types/
├── prisma/schema.prisma                 ← Database models
└── src/schemas/conversation.schema.ts   ← Context/state type definitions
```
