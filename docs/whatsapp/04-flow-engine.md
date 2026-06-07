# Flow Engine Deep Dive

## What Is It?

The Flow Engine is a **graph-based conversation runner** that replaces the hardcoded switch/case state machine. Each business can have a custom flow definition (stored as JSON in the database) that defines the booking conversation as a directed graph of nodes and edges.

**File:** `apps/api/src/services/flow-engine.service.ts`

## Core Concepts

### Flow Definition
A JSON document stored in the `WhatsAppFlow` table containing:
- `nodes[]` — screens/steps (service picker, time picker, confirmation, etc.)
- `edges[]` — transitions between nodes (with optional conditions)
- `entryNodeId` — where the flow starts

### Node Types
Each node has a `type` and a `config`:

| Type | Purpose | Auto-advance? |
|------|---------|---------------|
| `message` | Display text, no user input needed | Yes |
| `question` | Free-text input | No |
| `service_picker` | List of services to choose from | No |
| `staff_picker` | List of staff (buttons ≤3, list >3) | No |
| `time_picker` | Available time slots | No |
| `confirmation` | Review + confirm/cancel | No |
| `booking` | Finalize booking (create in DB) | No (terminal) |

### Node Handler Interface

```typescript
interface NodeHandler {
  type: NodeType;
  autoAdvance: boolean;
  
  // Phase 1: Produce the WhatsApp message to show the customer
  render(args: NodeRenderArgs): Promise<InteractiveMessage>;
  
  // Phase 2: Process the customer's reply, return context updates
  process?(args: NodeProcessArgs): Promise<NodeResult>;
}
```

## Execution Loop

```
1. Find/create conversation (customerPhone + businessId)
2. Check 24h timeout → reset if expired
3. Navigation interceptor (start over, change salon, hi)
4. Fresh start? → pin active flow, render entry node
5. COMPLETED? → show "Book Again" button
6. Load pinned flow (flowId + flowVersion)
7. Get handler for current node
8. Call handler.process(incomingMessage)
   ├── complete: false → re-render same node with error
   └── complete: true → merge contextUpdates
9. Resolve next node via edges
10. Auto-advance through message nodes (cycle guard: max 50 steps)
11. Render destination node
12. Persist new state atomically
13. Return rendered message
```

## Auto-Advance

Message nodes don't wait for user input. The engine renders them and immediately follows the outgoing edge to the next node. This continues until reaching a node that requires input (service_picker, time_picker, etc.).

A visited-set prevents infinite loops if message nodes form a cycle.

## Edge Resolution

```typescript
function resolveNextNode(edges, currentNodeId, context): string | null {
  // Find edges FROM currentNodeId
  // Evaluate conditions against context
  // Return first matching edge's target
  // Return null if no edge matches (dead-end)
}
```

Edges can have conditions like:
```json
{ "source": "confirmation", "target": "booking", "condition": "responses.confirmation === 'confirm'" }
{ "source": "confirmation", "target": "service_selection", "condition": "responses.confirmation === 'cancel'" }
```

## Flow Pinning (Version Safety)

When a conversation starts, the flow engine "pins" the active flow version:
- `conversation.flowId` — which flow definition
- `conversation.flowVersion` — which version of it

This ensures that even if the business publishes a new flow version mid-conversation, the customer finishes on the version they started with. If the pinned version becomes invalid, the conversation resets with a notice.

## Context Hydration

**File:** `apps/api/src/services/flow-context-builder.service.ts`

Before rendering a node, the context is "hydrated" with live business data:
- Business name, category
- Customer phone (normalized)
- Conversation ID

## Node Handler Details

### service-picker.ts
- Queries `Service` table for active services
- Renders WhatsApp list message (id: `service_{serviceId}`)
- On selection: sets `selectedServiceIds`, `totalDuration`, `totalPrice`

### staff-picker.ts
- Queries `Staff` table for active staff
- ≤3 staff: renders reply buttons
- >3 staff: renders list message
- On selection: sets `selectedStaffId`, `selectedStaffName`

### time-picker.ts
- Generates candidate time slots (hourly, configurable range)
- Calls `availabilityService.getBulkAvailabilityData()` for the entire range
- Filters available slots in memory
- Renders list (max 10 rows, WhatsApp limit)
- On selection: sets `requestedTime`

### confirmation.ts
- Renders booking summary with Confirm/Cancel buttons
- On confirm: creates `BookingIntent` (hold) with expiry
- On cancel: clears context, signals flow to route back
- On hold expired: clears `requestedTime`, signals time picker re-entry

### booking.ts
- Creates the actual `Booking` record
- Auto-assigns resource and staff
- Marks `BookingIntent` as CONFIRMED
- Marks conversation as COMPLETED (terminal signal)
- Renders confirmation message with booking details
