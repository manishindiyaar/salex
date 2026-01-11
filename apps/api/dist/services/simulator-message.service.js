"use strict";
/**
 * Simulator Message Service
 *
 * Stores messages for the WhatsApp simulator polling mechanism.
 * This allows the Mock UI to poll for bot responses.
 *
 * Features:
 * - Store outgoing messages (bot → customer)
 * - Poll messages since timestamp
 * - Session management for simulator
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulatorMessageService = void 0;
const shared_types_1 = require("@salex/shared-types");
const logger_1 = require("../utils/logger");
class SimulatorMessageService {
    /**
     * Get or create a simulator session for a customer
     */
    async getOrCreateSession(customerPhone, businessId) {
        const normalizedPhone = this.normalizePhoneNumber(customerPhone);
        // Try to find existing session
        let session = await shared_types_1.prisma.customerSession.findFirst({
            where: {
                customerPhone: normalizedPhone,
                businessId: businessId || null,
            },
        });
        if (session) {
            // Update last message time
            session = await shared_types_1.prisma.customerSession.update({
                where: { id: session.id },
                data: { lastMessageAt: new Date() },
            });
            return session;
        }
        // Create new session
        session = await shared_types_1.prisma.customerSession.create({
            data: {
                customerPhone: normalizedPhone,
                businessId: businessId || null,
                currentState: 'GREETING',
                sessionData: {},
                lastMessageAt: new Date(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
        });
        logger_1.logger.debug({ sessionId: session.id, customerPhone: normalizedPhone }, 'Simulator session created');
        return session;
    }
    /**
     * Store an outgoing message (bot response)
     */
    async storeOutgoingMessage(customerPhone, businessPhone, message, businessId) {
        const normalizedCustomerPhone = this.normalizePhoneNumber(customerPhone);
        const normalizedBusinessPhone = this.normalizePhoneNumber(businessPhone);
        // Get or create session
        const session = await this.getOrCreateSession(normalizedCustomerPhone, businessId);
        // Convert InteractiveMessage to storage format
        const content = this.convertToStorageFormat(message);
        // Store message
        const stored = await shared_types_1.prisma.simulatorMessage.create({
            data: {
                sessionId: session.id,
                fromPhone: normalizedBusinessPhone,
                toPhone: normalizedCustomerPhone,
                messageType: message.type,
                content: content,
                isFromCustomer: false,
                delivered: false,
            },
        });
        logger_1.logger.debug({
            messageId: stored.messageId,
            toPhone: normalizedCustomerPhone,
            type: message.type
        }, 'Simulator message stored');
        return {
            id: stored.id,
            messageId: stored.messageId,
            fromPhone: stored.fromPhone,
            toPhone: stored.toPhone,
            messageType: stored.messageType,
            content: stored.content,
            timestamp: stored.timestamp,
            isFromCustomer: stored.isFromCustomer,
            delivered: stored.delivered,
        };
    }
    /**
     * Store an incoming message (customer message)
     */
    async storeIncomingMessage(customerPhone, businessPhone, messageText, messageType = 'text', businessId) {
        const normalizedCustomerPhone = this.normalizePhoneNumber(customerPhone);
        const normalizedBusinessPhone = this.normalizePhoneNumber(businessPhone);
        // Get or create session
        const session = await this.getOrCreateSession(normalizedCustomerPhone, businessId);
        // Store message
        const stored = await shared_types_1.prisma.simulatorMessage.create({
            data: {
                sessionId: session.id,
                fromPhone: normalizedCustomerPhone,
                toPhone: normalizedBusinessPhone,
                messageType,
                content: { text: { body: messageText } },
                isFromCustomer: true,
                delivered: true,
            },
        });
        return {
            id: stored.id,
            messageId: stored.messageId,
            fromPhone: stored.fromPhone,
            toPhone: stored.toPhone,
            messageType: stored.messageType,
            content: stored.content,
            timestamp: stored.timestamp,
            isFromCustomer: stored.isFromCustomer,
            delivered: stored.delivered,
        };
    }
    /**
     * Poll for messages since a timestamp
     * Returns messages sent TO the customer (bot responses)
     */
    async getMessagesSince(customerPhone, since, limit = 10) {
        const normalizedPhone = this.normalizePhoneNumber(customerPhone);
        const messages = await shared_types_1.prisma.simulatorMessage.findMany({
            where: {
                toPhone: normalizedPhone,
                isFromCustomer: false,
                timestamp: { gt: since },
            },
            orderBy: { timestamp: 'asc' },
            take: limit,
        });
        // Mark as delivered
        if (messages.length > 0) {
            await shared_types_1.prisma.simulatorMessage.updateMany({
                where: {
                    id: { in: messages.map(m => m.id) },
                },
                data: { delivered: true },
            });
        }
        return messages.map(m => ({
            id: m.id,
            messageId: m.messageId,
            fromPhone: m.fromPhone,
            toPhone: m.toPhone,
            messageType: m.messageType,
            content: m.content,
            timestamp: m.timestamp,
            isFromCustomer: m.isFromCustomer,
            delivered: m.delivered,
        }));
    }
    /**
     * Get all messages for a customer (for debugging)
     */
    async getAllMessages(customerPhone, limit = 50) {
        const normalizedPhone = this.normalizePhoneNumber(customerPhone);
        // Find session
        const session = await shared_types_1.prisma.customerSession.findFirst({
            where: { customerPhone: normalizedPhone },
        });
        if (!session) {
            return [];
        }
        const messages = await shared_types_1.prisma.simulatorMessage.findMany({
            where: { sessionId: session.id },
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
        return messages.map(m => ({
            id: m.id,
            messageId: m.messageId,
            fromPhone: m.fromPhone,
            toPhone: m.toPhone,
            messageType: m.messageType,
            content: m.content,
            timestamp: m.timestamp,
            isFromCustomer: m.isFromCustomer,
            delivered: m.delivered,
        }));
    }
    /**
     * Clear messages for a customer (reset session)
     */
    async clearMessages(customerPhone) {
        const normalizedPhone = this.normalizePhoneNumber(customerPhone);
        // Find and delete session (cascade deletes messages)
        await shared_types_1.prisma.customerSession.deleteMany({
            where: { customerPhone: normalizedPhone },
        });
        logger_1.logger.info({ customerPhone: normalizedPhone }, 'Simulator session cleared');
    }
    /**
     * Convert InteractiveMessage to storage format
     */
    convertToStorageFormat(message) {
        if (message.type === 'text') {
            return {
                text: { body: message.body.text },
            };
        }
        return {
            interactive: {
                type: message.type,
                header: message.header,
                body: message.body,
                footer: message.footer,
                action: message.action,
            },
        };
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
exports.simulatorMessageService = new SimulatorMessageService();
//# sourceMappingURL=simulator-message.service.js.map