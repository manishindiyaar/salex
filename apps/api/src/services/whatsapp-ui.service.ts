/**
 * WhatsApp UI Helper Service
 *
 * Builds consistent WhatsApp interactive messages (buttons, lists) with
 * standard navigation actions. Parses action IDs from interactive replies.
 *
 * Action ID format:
 *   nav_back, nav_start_over, nav_change_salon
 *   edit_services, edit_staff, edit_time
 *   confirm_booking
 *   service:{serviceId}
 *   staff:{staffId}
 *   slot:{ISO time}
 *   biz_{businessId}
 *   page:services:{n}, page:slots:{n}
 */

import type { InteractiveMessage, InteractiveButton, InteractiveListRow } from './conversation.service';

// ─── Navigation Action IDs ───────────────────────────────────────────────────

export const NAV = {
  BACK: 'nav_back',
  START_OVER: 'nav_start_over',
  CHANGE_SALON: 'nav_change_salon',
  MORE: 'nav_more',
  EDIT_SERVICES: 'edit_services',
  EDIT_STAFF: 'edit_staff',
  EDIT_TIME: 'edit_time',
  CONFIRM: 'confirm_booking',
} as const;

export type NavAction = (typeof NAV)[keyof typeof NAV];

// ─── Text Command Parser ─────────────────────────────────────────────────────

const TEXT_COMMANDS: Record<string, NavAction> = {
  'back': NAV.BACK,
  'go back': NAV.BACK,
  'start over': NAV.START_OVER,
  'reset': NAV.START_OVER,
  'change salon': NAV.CHANGE_SALON,
  'different salon': NAV.CHANGE_SALON,
  'edit service': NAV.EDIT_SERVICES,
  'edit services': NAV.EDIT_SERVICES,
  'change service': NAV.EDIT_SERVICES,
  'edit time': NAV.EDIT_TIME,
  'change time': NAV.EDIT_TIME,
  'edit staff': NAV.EDIT_STAFF,
  'change staff': NAV.EDIT_STAFF,
  'cancel': NAV.START_OVER,
};

/**
 * Parse a navigation action from an interactive reply ID or typed text.
 * Returns the NavAction if matched, null otherwise.
 */
export function parseNavAction(
  interactiveReplyId?: string,
  messageText?: string,
): NavAction | null {
  // Check interactive reply ID directly
  if (interactiveReplyId) {
    const allNavValues = Object.values(NAV) as string[];
    if (allNavValues.includes(interactiveReplyId)) {
      return interactiveReplyId as NavAction;
    }
  }

  // Check typed text commands (case-insensitive, trimmed)
  if (messageText) {
    const normalized = messageText.trim().toLowerCase();
    if (TEXT_COMMANDS[normalized]) {
      return TEXT_COMMANDS[normalized];
    }
  }

  return null;
}

// ─── Message Builders ────────────────────────────────────────────────────────

/**
 * Build a reply button. WhatsApp allows max 3 per message.
 * Title max 20 chars.
 */
export function btn(id: string, title: string): InteractiveButton {
  return { type: 'reply', reply: { id, title: title.slice(0, 20) } };
}

/**
 * Build a list row. Title max 24 chars, description max 72 chars.
 */
export function row(id: string, title: string, description?: string): InteractiveListRow {
  return {
    id,
    title: title.slice(0, 24),
    ...(description ? { description: description.slice(0, 72) } : {}),
  };
}

/**
 * Build a button message (max 3 buttons).
 */
export function buttonMessage(opts: {
  body: string;
  buttons: InteractiveButton[];
  header?: string;
  footer?: string;
}): InteractiveMessage {
  return {
    type: 'button',
    ...(opts.header ? { header: { type: 'text', text: opts.header } } : {}),
    body: { text: opts.body },
    ...(opts.footer ? { footer: { text: opts.footer } } : {}),
    action: { buttons: opts.buttons.slice(0, 3) },
  };
}

/**
 * Build a list message (max 10 rows total across sections).
 */
export function listMessage(opts: {
  body: string;
  buttonLabel: string;
  rows: InteractiveListRow[];
  header?: string;
  footer?: string;
  sectionTitle?: string;
}): InteractiveMessage {
  return {
    type: 'list',
    ...(opts.header ? { header: { type: 'text', text: opts.header } } : {}),
    body: { text: opts.body },
    ...(opts.footer ? { footer: { text: opts.footer } } : {}),
    action: {
      button: opts.buttonLabel,
      sections: [{ title: opts.sectionTitle, rows: opts.rows.slice(0, 10) }],
    },
  };
}

// ─── Navigation Row Builders ─────────────────────────────────────────────────

/** Standard navigation rows to append to list messages */
export function navRows(opts?: {
  includeBack?: boolean;
  includeStartOver?: boolean;
  includeChangeSalon?: boolean;
  includeEditServices?: boolean;
  includeEditStaff?: boolean;
  includeEditTime?: boolean;
}): InteractiveListRow[] {
  const rows: InteractiveListRow[] = [];
  if (opts?.includeBack) rows.push(row(NAV.BACK, '← Back'));
  if (opts?.includeEditServices) rows.push(row(NAV.EDIT_SERVICES, '✏️ Edit Services'));
  if (opts?.includeEditStaff) rows.push(row(NAV.EDIT_STAFF, '✏️ Edit Staff'));
  if (opts?.includeEditTime) rows.push(row(NAV.EDIT_TIME, '✏️ Edit Time'));
  if (opts?.includeChangeSalon) rows.push(row(NAV.CHANGE_SALON, '🔄 Change Salon'));
  if (opts?.includeStartOver) rows.push(row(NAV.START_OVER, '🔄 Start Over'));
  return rows;
}

/**
 * Build a review/confirmation list message with all edit options.
 * Used at the final review step before booking confirmation.
 */
export function reviewMessage(opts: {
  businessName: string;
  serviceNames: string;
  staffName?: string;
  dateTime: string;
  price?: number;
  duration?: number;
  isDedicatedNumber?: boolean;
}): InteractiveMessage {
  const lines: string[] = [
    `📍 ${opts.businessName}`,
    `🧴 ${opts.serviceNames}`,
  ];
  if (opts.staffName) lines.push(`👤 ${opts.staffName}`);
  lines.push(`⏰ ${opts.dateTime}`);
  if (opts.duration) lines.push(`⏱️ ${opts.duration} min`);
  if (opts.price !== undefined) lines.push(`💰 ₹${opts.price}`);
  lines.push('');
  lines.push('Review your booking and choose an action:');

  const rows: InteractiveListRow[] = [
    row(NAV.CONFIRM, '✅ Confirm Booking'),
    row(NAV.EDIT_SERVICES, '✏️ Edit Services'),
    row(NAV.EDIT_TIME, '✏️ Edit Time'),
  ];

  if (opts.staffName) {
    rows.push(row(NAV.EDIT_STAFF, '✏️ Edit Staff'));
  }

  if (!opts.isDedicatedNumber) {
    rows.push(row(NAV.CHANGE_SALON, '🔄 Change Salon'));
  }

  rows.push(row(NAV.START_OVER, '🔄 Start Over'));

  return listMessage({
    header: '📋 Booking Summary',
    body: lines.join('\n'),
    buttonLabel: 'Manage Booking',
    rows,
    footer: 'Tap to manage',
  });
}

/**
 * Build a contextual "You're mid-booking" message shown when user
 * says "hi" in the middle of a flow, instead of resetting.
 */
export function midFlowContextMessage(opts: {
  currentStep: string;
  businessName?: string;
}): InteractiveMessage {
  const stepLabels: Record<string, string> = {
    'SERVICE_SELECTION': 'selecting a service',
    'service_selection': 'selecting a service',
    'STAFF_SELECTION': 'selecting staff',
    'staff_selection': 'selecting staff',
    'TIME_SELECTION': 'choosing a time',
    'time_selection': 'choosing a time',
    'CONFIRMATION': 'confirming your booking',
    'confirmation': 'confirming your booking',
  };

  const stepLabel = stepLabels[opts.currentStep] || 'booking';
  const bizText = opts.businessName ? ` at ${opts.businessName}` : '';

  return buttonMessage({
    body: `You're currently ${stepLabel}${bizText}.\n\nWhat would you like to do?`,
    buttons: [
      btn(NAV.BACK, '← Continue'),
      btn(NAV.START_OVER, '🔄 Start Over'),
    ],
  });
}
