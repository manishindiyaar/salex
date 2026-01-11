/**
 * WhatsApp Conversation Zod Schemas
 */
import { z } from 'zod';
export declare const conversationStateSchema: z.ZodEnum<["GREETING", "AWAITING_ROUTING_CODE", "SERVICE_SELECTION", "TIME_SELECTION", "CONFIRMATION", "COMPLETED", "SHOP_CLOSED"]>;
export type ConversationStateType = z.infer<typeof conversationStateSchema>;
export declare const conversationContextSchema: z.ZodObject<{
    selectedServiceIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    totalDuration: z.ZodOptional<z.ZodNumber>;
    totalPrice: z.ZodOptional<z.ZodNumber>;
    requestedTime: z.ZodOptional<z.ZodString>;
    routingCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    routingCode?: string | undefined;
    selectedServiceIds?: string[] | undefined;
    totalDuration?: number | undefined;
    totalPrice?: number | undefined;
    requestedTime?: string | undefined;
}, {
    routingCode?: string | undefined;
    selectedServiceIds?: string[] | undefined;
    totalDuration?: number | undefined;
    totalPrice?: number | undefined;
    requestedTime?: string | undefined;
}>;
export type ConversationContextType = z.infer<typeof conversationContextSchema>;
export declare const upsertConversationSchema: z.ZodObject<{
    customerPhone: z.ZodString;
    businessId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    state: z.ZodDefault<z.ZodEnum<["GREETING", "AWAITING_ROUTING_CODE", "SERVICE_SELECTION", "TIME_SELECTION", "CONFIRMATION", "COMPLETED", "SHOP_CLOSED"]>>;
    contextData: z.ZodDefault<z.ZodObject<{
        selectedServiceIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        totalDuration: z.ZodOptional<z.ZodNumber>;
        totalPrice: z.ZodOptional<z.ZodNumber>;
        requestedTime: z.ZodOptional<z.ZodString>;
        routingCode: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        routingCode?: string | undefined;
        selectedServiceIds?: string[] | undefined;
        totalDuration?: number | undefined;
        totalPrice?: number | undefined;
        requestedTime?: string | undefined;
    }, {
        routingCode?: string | undefined;
        selectedServiceIds?: string[] | undefined;
        totalDuration?: number | undefined;
        totalPrice?: number | undefined;
        requestedTime?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    customerPhone: string;
    state: "COMPLETED" | "GREETING" | "AWAITING_ROUTING_CODE" | "SERVICE_SELECTION" | "TIME_SELECTION" | "CONFIRMATION" | "SHOP_CLOSED";
    contextData: {
        routingCode?: string | undefined;
        selectedServiceIds?: string[] | undefined;
        totalDuration?: number | undefined;
        totalPrice?: number | undefined;
        requestedTime?: string | undefined;
    };
    businessId?: string | null | undefined;
}, {
    customerPhone: string;
    businessId?: string | null | undefined;
    state?: "COMPLETED" | "GREETING" | "AWAITING_ROUTING_CODE" | "SERVICE_SELECTION" | "TIME_SELECTION" | "CONFIRMATION" | "SHOP_CLOSED" | undefined;
    contextData?: {
        routingCode?: string | undefined;
        selectedServiceIds?: string[] | undefined;
        totalDuration?: number | undefined;
        totalPrice?: number | undefined;
        requestedTime?: string | undefined;
    } | undefined;
}>;
export type UpsertConversationInput = z.infer<typeof upsertConversationSchema>;
export declare const updateConversationStateSchema: z.ZodObject<{
    state: z.ZodEnum<["GREETING", "AWAITING_ROUTING_CODE", "SERVICE_SELECTION", "TIME_SELECTION", "CONFIRMATION", "COMPLETED", "SHOP_CLOSED"]>;
    contextData: z.ZodOptional<z.ZodObject<{
        selectedServiceIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        totalDuration: z.ZodOptional<z.ZodNumber>;
        totalPrice: z.ZodOptional<z.ZodNumber>;
        requestedTime: z.ZodOptional<z.ZodString>;
        routingCode: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        routingCode?: string | undefined;
        selectedServiceIds?: string[] | undefined;
        totalDuration?: number | undefined;
        totalPrice?: number | undefined;
        requestedTime?: string | undefined;
    }, {
        routingCode?: string | undefined;
        selectedServiceIds?: string[] | undefined;
        totalDuration?: number | undefined;
        totalPrice?: number | undefined;
        requestedTime?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    state: "COMPLETED" | "GREETING" | "AWAITING_ROUTING_CODE" | "SERVICE_SELECTION" | "TIME_SELECTION" | "CONFIRMATION" | "SHOP_CLOSED";
    contextData?: {
        routingCode?: string | undefined;
        selectedServiceIds?: string[] | undefined;
        totalDuration?: number | undefined;
        totalPrice?: number | undefined;
        requestedTime?: string | undefined;
    } | undefined;
}, {
    state: "COMPLETED" | "GREETING" | "AWAITING_ROUTING_CODE" | "SERVICE_SELECTION" | "TIME_SELECTION" | "CONFIRMATION" | "SHOP_CLOSED";
    contextData?: {
        routingCode?: string | undefined;
        selectedServiceIds?: string[] | undefined;
        totalDuration?: number | undefined;
        totalPrice?: number | undefined;
        requestedTime?: string | undefined;
    } | undefined;
}>;
export type UpdateConversationStateInput = z.infer<typeof updateConversationStateSchema>;
export declare const messageDirectionSchema: z.ZodEnum<["inbound", "outbound"]>;
export declare const messageTypeSchema: z.ZodEnum<["text", "interactive", "button", "template"]>;
export declare const createWhatsAppMessageSchema: z.ZodObject<{
    conversationId: z.ZodString;
    whatsappMessageId: z.ZodOptional<z.ZodString>;
    direction: z.ZodEnum<["inbound", "outbound"]>;
    messageType: z.ZodEnum<["text", "interactive", "button", "template"]>;
    content: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    status: z.ZodDefault<z.ZodEnum<["sent", "delivered", "read", "failed"]>>;
}, "strip", z.ZodTypeAny, {
    status: "sent" | "delivered" | "read" | "failed";
    conversationId: string;
    direction: "inbound" | "outbound";
    messageType: "text" | "interactive" | "button" | "template";
    content: Record<string, unknown>;
    whatsappMessageId?: string | undefined;
}, {
    conversationId: string;
    direction: "inbound" | "outbound";
    messageType: "text" | "interactive" | "button" | "template";
    content: Record<string, unknown>;
    status?: "sent" | "delivered" | "read" | "failed" | undefined;
    whatsappMessageId?: string | undefined;
}>;
export type CreateWhatsAppMessageInput = z.infer<typeof createWhatsAppMessageSchema>;
export declare const conversationLookupSchema: z.ZodObject<{
    customerPhone: z.ZodString;
    businessId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    customerPhone: string;
    businessId?: string | undefined;
}, {
    customerPhone: string;
    businessId?: string | undefined;
}>;
export type ConversationLookupInput = z.infer<typeof conversationLookupSchema>;
