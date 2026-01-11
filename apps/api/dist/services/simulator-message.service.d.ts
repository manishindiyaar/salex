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
import { CustomerSession } from '@salex/shared-types';
import { InteractiveMessage } from './conversation.service';
export interface SimulatorMessageContent {
    text?: {
        body: string;
    };
    interactive?: {
        type: string;
        header?: {
            type: string;
            text: string;
        };
        body: {
            text: string;
        };
        footer?: {
            text: string;
        };
        action?: any;
    };
}
export interface StoredMessage {
    id: string;
    messageId: string;
    fromPhone: string;
    toPhone: string;
    messageType: string;
    content: SimulatorMessageContent;
    timestamp: Date;
    isFromCustomer: boolean;
    delivered: boolean;
}
declare class SimulatorMessageService {
    /**
     * Get or create a simulator session for a customer
     */
    getOrCreateSession(customerPhone: string, businessId?: string | null): Promise<CustomerSession>;
    /**
     * Store an outgoing message (bot response)
     */
    storeOutgoingMessage(customerPhone: string, businessPhone: string, message: InteractiveMessage, businessId?: string | null): Promise<StoredMessage>;
    /**
     * Store an incoming message (customer message)
     */
    storeIncomingMessage(customerPhone: string, businessPhone: string, messageText: string, messageType?: string, businessId?: string | null): Promise<StoredMessage>;
    /**
     * Poll for messages since a timestamp
     * Returns messages sent TO the customer (bot responses)
     */
    getMessagesSince(customerPhone: string, since: Date, limit?: number): Promise<StoredMessage[]>;
    /**
     * Get all messages for a customer (for debugging)
     */
    getAllMessages(customerPhone: string, limit?: number): Promise<StoredMessage[]>;
    /**
     * Clear messages for a customer (reset session)
     */
    clearMessages(customerPhone: string): Promise<void>;
    /**
     * Convert InteractiveMessage to storage format
     */
    private convertToStorageFormat;
    /**
     * Normalize phone number
     */
    private normalizePhoneNumber;
}
export declare const simulatorMessageService: SimulatorMessageService;
export {};
//# sourceMappingURL=simulator-message.service.d.ts.map