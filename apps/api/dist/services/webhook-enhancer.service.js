"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookEnhancerService = void 0;
const logger_1 = require("../utils/logger");
class WebhookEnhancerService {
    /**
     * Create a webhook payload for a text message
     */
    createTextMessagePayload(input) {
        const messageId = this.generateMessageId();
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const payload = {
            object: 'whatsapp_business_account',
            entry: [{
                    id: 'simulator_account_id',
                    changes: [{
                            value: {
                                messaging_product: 'whatsapp',
                                metadata: {
                                    display_phone_number: this.normalizePhoneNumber(input.businessPhone),
                                    phone_number_id: 'simulator_phone_id',
                                },
                                contacts: [{
                                        wa_id: this.normalizePhoneNumber(input.customerPhone),
                                        profile: {
                                            name: input.customerName || 'Simulator User',
                                        },
                                    }],
                                messages: [{
                                        id: messageId,
                                        from: this.normalizePhoneNumber(input.customerPhone),
                                        timestamp,
                                        type: 'text',
                                        text: {
                                            body: input.message,
                                        },
                                    }],
                            },
                            field: 'messages',
                        }],
                }],
        };
        logger_1.logger.debug({ messageId, from: input.customerPhone }, 'Created text message webhook payload');
        return payload;
    }
    /**
     * Create a webhook payload for an interactive reply (button or list)
     */
    createInteractiveReplyPayload(input) {
        const messageId = this.generateMessageId();
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const message = {
            id: messageId,
            from: this.normalizePhoneNumber(input.customerPhone),
            timestamp,
            type: 'interactive',
            interactive: {
                type: input.interactiveType,
            },
        };
        // Add the appropriate reply type
        if (input.interactiveType === 'button_reply') {
            message.interactive.button_reply = {
                id: input.replyId,
                title: input.replyTitle,
            };
        }
        else if (input.interactiveType === 'list_reply') {
            message.interactive.list_reply = {
                id: input.replyId,
                title: input.replyTitle,
                description: input.replyDescription,
            };
        }
        const payload = {
            object: 'whatsapp_business_account',
            entry: [{
                    id: 'simulator_account_id',
                    changes: [{
                            value: {
                                messaging_product: 'whatsapp',
                                metadata: {
                                    display_phone_number: this.normalizePhoneNumber(input.businessPhone),
                                    phone_number_id: 'simulator_phone_id',
                                },
                                contacts: [{
                                        wa_id: this.normalizePhoneNumber(input.customerPhone),
                                        profile: {
                                            name: input.customerName || 'Simulator User',
                                        },
                                    }],
                                messages: [message],
                            },
                            field: 'messages',
                        }],
                }],
        };
        logger_1.logger.debug({
            messageId,
            from: input.customerPhone,
            interactiveType: input.interactiveType,
            replyId: input.replyId
        }, 'Created interactive reply webhook payload');
        return payload;
    }
    /**
     * Parse a webhook payload and extract message details
     */
    parseWebhookPayload(payload) {
        try {
            const entry = payload.entry?.[0];
            const change = entry?.changes?.[0];
            const value = change?.value;
            const message = value?.messages?.[0];
            const contact = value?.contacts?.[0];
            if (!message) {
                return null;
            }
            const result = {
                customerPhone: message.from,
                businessPhone: value.metadata.display_phone_number,
                messageId: message.id,
                messageType: message.type,
                customerName: contact?.profile?.name,
            };
            // Extract text message
            if (message.type === 'text' && message.text) {
                result.messageText = message.text.body;
            }
            // Extract interactive reply
            if (message.type === 'interactive' && message.interactive) {
                const interactive = message.interactive;
                if (interactive.button_reply) {
                    result.interactiveReply = {
                        type: 'button_reply',
                        id: interactive.button_reply.id,
                        title: interactive.button_reply.title,
                    };
                }
                else if (interactive.list_reply) {
                    result.interactiveReply = {
                        type: 'list_reply',
                        id: interactive.list_reply.id,
                        title: interactive.list_reply.title,
                        description: interactive.list_reply.description,
                    };
                }
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to parse webhook payload');
            return null;
        }
    }
    /**
     * Validate webhook payload structure
     */
    isValidWebhookPayload(payload) {
        return (payload &&
            payload.object === 'whatsapp_business_account' &&
            Array.isArray(payload.entry) &&
            payload.entry.length > 0 &&
            payload.entry[0].changes &&
            Array.isArray(payload.entry[0].changes) &&
            payload.entry[0].changes.length > 0 &&
            payload.entry[0].changes[0].value &&
            payload.entry[0].changes[0].field === 'messages');
    }
    /**
     * Check if this is a simulator request
     */
    isSimulatorRequest(headers) {
        return headers['x-simulator-mode'] === 'true';
    }
    /**
     * Generate a unique message ID
     */
    generateMessageId() {
        return `sim_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
    /**
     * Normalize phone number
     */
    normalizePhoneNumber(phone) {
        // Handle null/undefined - use a default simulator business phone
        if (!phone) {
            return '+919999999999'; // Default simulator business phone
        }
        let normalized = phone.replace(/[^\d+]/g, '');
        if (!normalized.startsWith('+')) {
            if (normalized.length === 10) {
                normalized = '+91' + normalized;
            }
            else {
                normalized = '+' + normalized;
            }
        }
        return normalized;
    }
}
exports.webhookEnhancerService = new WebhookEnhancerService();
//# sourceMappingURL=webhook-enhancer.service.js.map