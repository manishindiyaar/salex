/**
 * Default_Flow — the built-in flow definition that reproduces the legacy
 * booking sequence: greeting → service selection → time selection →
 * confirmation → booking.
 *
 * This flow is used for any business that has no active custom FlowDefinition
 * (Req 1.4, 9.1). It produces byte-for-byte parity with the legacy state
 * machine so existing businesses see no behavioral change until they customize.
 *
 * The time_picker node uses `parityMode: "legacy"` to invoke the
 * `isSlotBookableLegacyParity` availability determination rather than the
 * capacity-count formula, ensuring migration is invisible (Req 9.2).
 *
 * Requirements: 9.1, 9.2, 9.4
 */

import type { FlowDefinition } from '@salex/shared-types';

/**
 * Internal version constant for the Default_Flow.
 * Used for observability when pinning conversations to the default flow
 * (flowVersion = 0 indicates the built-in default, not a user-created version).
 */
export const DEFAULT_FLOW_VERSION = 0;

/**
 * The Default_Flow graph definition.
 *
 * Nodes:
 *   - greeting: message node, auto-advances (no customer input)
 *   - service_selection: service_picker, waits for customer choice
 *   - time_selection: time_picker (parityMode: "legacy"), waits for slot choice
 *   - confirmation: confirmation node, waits for confirm/cancel
 *   - booking: booking node, finalizes the reservation (terminal)
 *
 * Edges:
 *   - e1: greeting → service_selection (fallback, auto-advance from message)
 *   - e2: service_selection → time_selection (fallback)
 *   - e3: time_selection → confirmation (fallback)
 *   - e4: confirmation → booking (conditional: responses.confirmation eq "confirm")
 *   - e5: confirmation → time_selection (conditional: responses.confirmation eq "expired")
 *        — handles E4 expired hold by returning to time selection
 *   - e6: confirmation → service_selection (fallback) — handles cancel
 */
export const DEFAULT_FLOW: FlowDefinition = {
  entryNodeId: 'greeting',
  nodes: [
    {
      id: 'greeting',
      type: 'message',
      config: {
        text: '👋 Welcome to {{businessName}}!',
      },
    },
    {
      id: 'service_selection',
      type: 'service_picker',
      config: {
        header: '📋 {{businessName}}',
        body: 'Select a {{serviceTerm}} to book:',
        buttonLabel: 'View {{servicePluralTerm}}',
        noServicesMessage:
          '😔 This business has no services available at the moment.\n\nPlease try again later.',
      },
    },
    {
      id: 'time_selection',
      type: 'time_picker',
      config: {
        parityMode: 'legacy',
        durationField: 'totalDuration',
        header: '⏰ Select Time',
        noSlotsText:
          'No slots are available right now. Please try again later or contact the business directly.',
      },
    },
    {
      id: 'confirmation',
      type: 'confirmation',
      config: {
        confirmId: 'btn_confirm_booking',
        cancelId: 'btn_cancel_booking',
      },
    },
    {
      id: 'booking',
      type: 'booking',
      config: {},
    },
  ],
  edges: [
    // greeting auto-advances to service_selection (fallback)
    { id: 'e1', from: 'greeting', to: 'service_selection' },
    // service_selection → time_selection (fallback after selection)
    { id: 'e2', from: 'service_selection', to: 'time_selection' },
    // time_selection → confirmation (fallback after slot choice)
    { id: 'e3', from: 'time_selection', to: 'confirmation' },
    // confirmation → booking (conditional: customer confirmed)
    {
      id: 'e4',
      from: 'confirmation',
      to: 'booking',
      condition: { field: 'responses.confirmation', operator: 'eq', value: 'confirm' },
    },
    // confirmation → time_selection (conditional: hold expired — E4)
    {
      id: 'e5',
      from: 'confirmation',
      to: 'time_selection',
      condition: { field: 'responses.confirmation', operator: 'eq', value: 'expired' },
    },
    // confirmation → service_selection (fallback: cancel or any other response)
    { id: 'e6', from: 'confirmation', to: 'service_selection' },
  ],
};
