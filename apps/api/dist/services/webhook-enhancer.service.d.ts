/**
 * Webhook Enhancer Service
 *
 * Creates WhatsApp Cloud API format webhook payloads from simulator messages.
 * This ensures the conversation service processes simulator messages
 * identically to production webhooks.
 *
 * WhatsApp Cloud API Webhook Format:
 * {
 *   object: "whatsapp_business_account",
 *   entry: [{
 *     id: "BUSINESS_ACCOUNT_ID",
 *     changes: [{
 *       value: {
 *         messaging_product: "whatsapp",
 *         metadata: { display_phone_number, phone_number_id },
 *         contacts: [{ wa_id, profile: { name } }],
 *         messages: [{ id, from, timestamp, type, text/interactive }]
 *       },
 *       field: "messages"
 *     }]
 *   }]
 * }
 */
export interface WhatsAppWebhookPayload {
    object: 'whatsapp_business_account';
    entry: WhatsAppWebhookEntry[];
}
export interface WhatsAppWebhookEntry {
    id: string;
    changes: WhatsAppWebhookChange[];
}
export interface WhatsAppWebhookChange {
    value: WhatsAppWebhookValue;
    field: 'messages';
}
export interface WhatsAppWebhookValue {
    messaging_product: 'whatsapp';
    metadata: {
        display_phone_number: string;
        phone_number_id: string;
    };
    contacts?: WhatsAppContact[];
    messages?: WhatsAppMessage[];
    statuses?: WhatsAppStatus[];
}
export interface WhatsAppContact {
    wa_id: string;
    profile: {
        name: string;
    };
}
export interface WhatsAppMessage {
    id: string;
    from: string;
    timestamp: string;
    type: 'text' | 'interactive' | 'button' | 'image' | 'document';
    text?: {
        body: string;
    };
    interactive?: {
        type: 'button_reply' | 'list_reply';
        button_reply?: {
            id: string;
            title: string;
        };
        list_reply?: {
            id: string;
            title: string;
            description?: string;
        };
    };
}
export interface WhatsAppStatus {
    id: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
    recipient_id: string;
}
export interface SimulatorTextMessage {
    customerPhone: string;
    businessPhone: string;
    message: string;
    customerName?: string;
}
export interface SimulatorInteractiveMessage {
    customerPhone: string;
    businessPhone: string;
    interactiveType: 'button_reply' | 'list_reply';
    replyId: string;
    replyTitle: string;
    replyDescription?: string;
    customerName?: string;
}
declare class WebhookEnhancerService {
    /**
     * Create a webhook payload for a text message
     */
    createTextMessagePayload(input: SimulatorTextMessage): WhatsAppWebhookPayload;
    /**
     * Create a webhook payload for an interactive reply (button or list)
     */
    createInteractiveReplyPayload(input: SimulatorInteractiveMessage): WhatsAppWebhookPayload;
    /**
     * Parse a webhook payload and extract message details
     */
    parseWebhookPayload(payload: WhatsAppWebhookPayload): {
        customerPhone: string;
        businessPhone: string;
        messageId: string;
        messageType: string;
        messageText?: string;
        interactiveReply?: {
            type: string;
            id: string;
            title: string;
            description?: string;
        };
        customerName?: string;
    } | null;
    /**
     * Validate webhook payload structure
     */
    isValidWebhookPayload(payload: any): payload is WhatsAppWebhookPayload;
    /**
     * Check if this is a simulator request
     */
    isSimulatorRequest(headers: Record<string, string | string[] | undefined>): boolean;
    /**
     * Generate a unique message ID
     */
    private generateMessageId;
    /**
     * Normalize phone number
     */
    private normalizePhoneNumber;
}
export declare const webhookEnhancerService: WebhookEnhancerService;
export {};
//# sourceMappingURL=webhook-enhancer.service.d.ts.map