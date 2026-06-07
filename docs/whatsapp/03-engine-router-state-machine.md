# Engine Router & State Machine

## Two Engines, One Router

The system has two conversation engines running in parallel:

1. **Legacy Conversation Service** — Hardcoded switch/case state machine
2. **Flow Engine** — Dynamic graph-based engine with per-business flow definitions

The **Engine Router** decides which one handles each message.

**File:** `apps/api/src/services/engine-router.service.ts`

## Routing Decision Logic

```typescript
function selectEngine(input): 'legacy' | 'flow' {
  // No business resolved → must use legacy (handles salon search)
  if (!input.businessId) return 'legacy';
  
  // Global cutover flag → all traffic to flow engine
  if (input.globalCutover) return 'flow';
  
  // Per-business flag OR has active custom flow → flow engine
  if (input.businessFlagged || input.hasActiveCustomFlow) return 'flow';
  
  // Default: legacy
  return 'legacy';
}
```

### Business-level flags checked:
- `Business.whatsappSettings.flowEngineEnabled` — admin toggle
- `flowService.hasActiveCustomFlow(businessId)` — has a published flow definition

### Drain Logic (Mid-Flight Legacy Conversations)

If a business is flagged for flow engine but has an existing legacy conversation mid-booking:
- The legacy conversation continues until completion or 24h timeout
- Only NEW conversations start on the flow engine
- Prevents disruption of in-progress bookings

## The Route Function

```typescript
async function route(input: RouteInput): Promise<RouteOutcome> {
  // 1. Resolve businessId (from webhook or existing conversation)
  // 2. Check business flags for engine selection
  // 3. Check drain logic
  // 4. Call selected engine's processMessage()
  // 5. On flow engine error → fallback to legacy
  // 6. Special: shared-number routing code resolved mid-legacy
  //    → hand off to flow engine if business is flagged
}
```

## Legacy Conversation Service

**File:** `apps/api/src/services/conversation.service.ts`

### State Machine

```
GREETING
  │
  ▼
AWAITING_ROUTING_CODE  ← shared number: user searches/types salon code
  │
  ▼
SERVICE_SELECTION      ← user picks a service from list
  │
  ▼
TIME_SELECTION         ← user picks a time slot
  │
  ▼
CONFIRMATION           ← review + confirm/cancel
  │
  ▼
COMPLETED              ← booking created, show "Book Again"
```

### Navigation Interceptor

Before the state-specific handler runs, a global interceptor checks:

```typescript
const navAction = parseNavAction(interactiveReply?.id, messageText);
```

Recognized actions:
- `nav_back` → go to previous step
- `nav_start_over` → clear context, restart at SERVICE_SELECTION
- `nav_change_salon` → clear businessId, go to AWAITING_ROUTING_CODE
- `edit_services` → clear time/intent, go to SERVICE_SELECTION
- `edit_time` → clear intent, go to TIME_SELECTION

Typed text commands also work:
- "back", "start over", "reset", "change salon", "edit service", "edit time", "cancel"

### "Hi" Mid-Flow Behavior

If user types "hi"/"hello"/"hey" while in a booking flow:
- Does NOT reset the session
- Shows a contextual menu: "You're currently selecting a service. Continue or Start Over?"

### 24-Hour Timeout

If `lastMessageAt` is older than 24 hours, the conversation resets to GREETING.

## Flow Engine

**File:** `apps/api/src/services/flow-engine.service.ts`

See [Flow Engine Deep Dive](./04-flow-engine.md) for full details.

The flow engine also has the same navigation interceptor:
- `nav_start_over` → resets to entry node
- `nav_change_salon` → clears business, returns to salon search
- "hi"/"hello" → contextual menu

## Conversation Context (Shared Between Engines)

Stored in `WhatsAppConversation.contextData` (JSON column):

```typescript
{
  routingCode?: string;
  selectedServiceIds?: string[];
  totalDuration?: number;
  totalPrice?: number;
  requestedTime?: string;         // ISO datetime
  bookingIntentId?: string;
  selectedStaffId?: string;
  selectedStaffName?: string;
  serviceNames?: string;
  businessName?: string;
  responses?: Record<string, unknown>;  // per-node responses (flow engine)
  __engine?: 'flow' | 'legacy';         // which engine handled this
}
```

## Conversation Version

The `WhatsAppConversation.version` column (integer) increments on every state change.
Used by the outbound worker to detect stale messages (see [Navigation & Session](./06-navigation-session.md)).
