/**
 * WhatsApp Conversation Zod Schemas
 */

import { z } from 'zod';

// Conversation states
export const conversationStateSchema = z.enum([
  'GREETING',
  'AWAITING_ROUTING_CODE',
  'SERVICE_SELECTION',
  'TIME_SELECTION',
  'CONFIRMATION',
  'COMPLETED',
  'SHOP_CLOSED',
]);

export type ConversationStateType = z.infer<typeof conversationStateSchema>;

// Conversation context data (stored in JSON field)
export const conversationContextSchema = z.object({
  selectedServiceIds: z.array(z.string().cuid()).optional(),
  totalDuration: z.number().int().optional(),
  totalPrice: z.number().optional(),
  requestedTime: z.string().datetime().optional(),
  routingCode: z.string().optional(),
  bookingIntentId: z.string().cuid().optional(),
});

export type ConversationContextType = z.infer<typeof conversationContextSchema>;

/**
 * Flow_Engine context schema — a permissive superset of conversationContextSchema.
 *
 * The Flow_Engine uses this schema instead of the strict conversationContextSchema so that
 * arbitrary node-id-keyed responses and richer context survive round-trips. Legacy fields
 * are preserved so a conversation can be read by either engine.
 *
 * `.passthrough()` ensures unknown keys (e.g. future node outputs) are not stripped during
 * parse, maintaining backward compatibility for pre-existing rows (Req 15.6).
 *
 * NOTE on `state` / currentNodeId:
 * In the Flow_Engine path, the conversation's `state` column is treated as an **opaque node id**
 * rather than being constrained by `conversationStateSchema` (the fixed enum). The DB column is
 * `String @default("GREETING")` — no migration needed. The value `"GREETING"` is retained as the
 * **entry sentinel**: a conversation whose `state === "GREETING"` and that has no pinned `flowId`
 * is treated as "fresh" and is initialized by pinning the active/Default flow and rendering its
 * entry node. This preserves backward compatibility for every pre-existing row (Req 15.6).
 */
export const flowContextSchema = conversationContextSchema
  .extend({
    /** Dynamic per-node responses keyed by node id (Req 5.5) */
    responses: z.record(z.unknown()).optional(),
    /** Selected staff member id from the staff_picker node */
    selectedStaffId: z.string().cuid().optional(),
    /** Unique identifier for the current flow run (engine bookkeeping) */
    flowRunId: z.string().optional(),
  })
  .passthrough();

export type FlowContextType = z.infer<typeof flowContextSchema>;

// Conversation upsert
export const upsertConversationSchema = z.object({
  customerPhone: z.string().regex(/^\+?\d{10,15}$/),
  businessId: z.string().cuid().optional().nullable(),
  state: conversationStateSchema.default('GREETING'),
  contextData: conversationContextSchema.default({}),
});

export type UpsertConversationInput = z.infer<typeof upsertConversationSchema>;

// Conversation state update
export const updateConversationStateSchema = z.object({
  state: conversationStateSchema,
  contextData: conversationContextSchema.optional(),
});

export type UpdateConversationStateInput = z.infer<typeof updateConversationStateSchema>;

// WhatsApp message direction
export const messageDirectionSchema = z.enum(['inbound', 'outbound']);

// WhatsApp message type
export const messageTypeSchema = z.enum(['text', 'interactive', 'button', 'template']);

// WhatsApp message creation
export const createWhatsAppMessageSchema = z.object({
  conversationId: z.string().cuid(),
  whatsappMessageId: z.string().optional(),
  direction: messageDirectionSchema,
  messageType: messageTypeSchema,
  content: z.record(z.unknown()),
  status: z.enum(['sent', 'delivered', 'read', 'failed']).default('sent'),
});

export type CreateWhatsAppMessageInput = z.infer<typeof createWhatsAppMessageSchema>;

// Conversation lookup
export const conversationLookupSchema = z.object({
  customerPhone: z.string().regex(/^\+?\d{10,15}$/),
  businessId: z.string().cuid().optional(),
});

export type ConversationLookupInput = z.infer<typeof conversationLookupSchema>;
