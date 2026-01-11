"use strict";
/**
 * WhatsApp Conversation Zod Schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationLookupSchema = exports.createWhatsAppMessageSchema = exports.messageTypeSchema = exports.messageDirectionSchema = exports.updateConversationStateSchema = exports.upsertConversationSchema = exports.conversationContextSchema = exports.conversationStateSchema = void 0;
const zod_1 = require("zod");
// Conversation states
exports.conversationStateSchema = zod_1.z.enum([
    'GREETING',
    'AWAITING_ROUTING_CODE',
    'SERVICE_SELECTION',
    'TIME_SELECTION',
    'CONFIRMATION',
    'COMPLETED',
    'SHOP_CLOSED',
]);
// Conversation context data (stored in JSON field)
exports.conversationContextSchema = zod_1.z.object({
    selectedServiceIds: zod_1.z.array(zod_1.z.string().cuid()).optional(),
    totalDuration: zod_1.z.number().int().optional(),
    totalPrice: zod_1.z.number().optional(),
    requestedTime: zod_1.z.string().datetime().optional(),
    routingCode: zod_1.z.string().optional(),
});
// Conversation upsert
exports.upsertConversationSchema = zod_1.z.object({
    customerPhone: zod_1.z.string().regex(/^\+?\d{10,15}$/),
    businessId: zod_1.z.string().cuid().optional().nullable(),
    state: exports.conversationStateSchema.default('GREETING'),
    contextData: exports.conversationContextSchema.default({}),
});
// Conversation state update
exports.updateConversationStateSchema = zod_1.z.object({
    state: exports.conversationStateSchema,
    contextData: exports.conversationContextSchema.optional(),
});
// WhatsApp message direction
exports.messageDirectionSchema = zod_1.z.enum(['inbound', 'outbound']);
// WhatsApp message type
exports.messageTypeSchema = zod_1.z.enum(['text', 'interactive', 'button', 'template']);
// WhatsApp message creation
exports.createWhatsAppMessageSchema = zod_1.z.object({
    conversationId: zod_1.z.string().cuid(),
    whatsappMessageId: zod_1.z.string().optional(),
    direction: exports.messageDirectionSchema,
    messageType: exports.messageTypeSchema,
    content: zod_1.z.record(zod_1.z.unknown()),
    status: zod_1.z.enum(['sent', 'delivered', 'read', 'failed']).default('sent'),
});
// Conversation lookup
exports.conversationLookupSchema = zod_1.z.object({
    customerPhone: zod_1.z.string().regex(/^\+?\d{10,15}$/),
    businessId: zod_1.z.string().cuid().optional(),
});
