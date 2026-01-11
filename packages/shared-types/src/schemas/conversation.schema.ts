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
});

export type ConversationContextType = z.infer<typeof conversationContextSchema>;

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
