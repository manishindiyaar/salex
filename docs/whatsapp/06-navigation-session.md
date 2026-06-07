# Navigation & Session Management

## Session Identity

A conversation is uniquely identified by:
- `customerPhone` + `businessId` (for per-business sessions)
- Or `customerPhone` with `businessId = null` (shared number, pre-salon-selection)

Stored in: `WhatsAppConversation` table with a unique constraint on `(customerPhone, businessId)`.

## Session Reset Rules

| Trigger | What Gets Cleared | New State |
|---------|-------------------|-----------|
| 24h inactivity | Everything | GREETING |
| Booking completed | Nothing (preserved) | COMPLETED |
| User types "start over" | services, staff, time, intent | SERVICE_SELECTION |
| User types "change salon" | businessId + all booking context | AWAITING_ROUTING_CODE |
| User types "back" | Varies by step | Previous step |
| User types "hi" mid-flow | Nothing | Shows contextual menu |

## Navigation Actions

**File:** `apps/api/src/services/whatsapp-ui.service.ts`

### Action IDs (interactive reply IDs)

| ID | Effect |
|----|--------|
| `nav_back` | Return to previous meaningful step |
| `nav_start_over` | Clear booking context, restart |
| `nav_change_salon` | Clear business, return to search |
| `edit_services` | Jump to service selection |
| `edit_staff` | Jump to staff selection |
| `edit_time` | Jump to time selection |
| `confirm_booking` | Confirm from review screen |

### Text Commands (typed by user)

| Text | Maps To |
|------|---------|
| "back", "go back" | nav_back |
| "start over", "reset", "cancel" | nav_start_over |
| "change salon", "different salon" | nav_change_salon |
| "edit service", "edit services", "change service" | edit_services |
| "edit time", "change time" | edit_time |
| "edit staff", "change staff" | edit_staff |

## Invalidation Rules

When you edit an upstream choice, downstream choices become invalid:

| Action | Clears |
|--------|--------|
| Edit services | `requestedTime`, `bookingIntentId` (time depends on service duration) |
| Edit staff | `requestedTime`, `bookingIntentId` (availability depends on staff) |
| Edit time | `bookingIntentId` (hold is time-specific) |
| Change salon | `businessId`, `selectedServiceIds`, `selectedStaffId`, `requestedTime`, `bookingIntentId` |
| Start over | `selectedServiceIds`, `totalDuration`, `totalPrice`, `requestedTime`, `bookingIntentId` |

## Stale Message Guard

**Problem solved:** If a message fails to send (e.g., token expired) and retries succeed minutes later, the customer receives an outdated screen that no longer matches the conversation's current state.

**Solution:** Every outbound message is stamped with `conversationVersion` when created. Before sending, the worker checks:

```typescript
if (conv.version > message.conversationVersion) {
  // Conversation has advanced — this message is stale. Drop it.
  status = 'SKIPPED';
}
```

**Additionally:** Messages older than 90 seconds are dropped regardless of version (safety net for long outages).

### How version increments:

```typescript
await prisma.whatsAppConversation.update({
  data: {
    state: newState,
    version: { increment: 1 },  // <-- incremented on every state change
    lastMessageAt: new Date(),
  }
});
```

## COMPLETED State Behavior

After booking is finalized:
1. State is set to `COMPLETED`
2. Any subsequent message from the customer shows:
   ```
   ✅ Booking Done
   Your appointment is confirmed.
   Want to book another appointment?
   [📅 Book Again]
   ```
3. Tapping "Book Again" resets to SERVICE_SELECTION
4. The old "Confirm Booking" button (from cached WhatsApp messages) shows "already booked" message
5. Does NOT auto-reset to GREETING on every message

## Per-Customer Locking

To prevent race conditions (two messages from the same customer arriving within milliseconds):

```sql
INSERT INTO "WhatsAppProcessingLock" (lockKey, lockedAt, lockedBy)
VALUES ('whatsapp:919801441675', NOW(), 'worker-id')
ON CONFLICT (lockKey) DO UPDATE
  SET lockedAt = EXCLUDED.lockedAt, lockedBy = EXCLUDED.lockedBy
WHERE "WhatsAppProcessingLock".lockedAt < NOW() - INTERVAL '2 minutes'
RETURNING lockKey
```

If lock acquisition fails (another worker is processing this customer's message), the event is re-queued with a 2s delay.
