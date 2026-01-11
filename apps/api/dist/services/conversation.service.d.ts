/**
 * Conversation Service
 *
 * Manages WhatsApp conversation state machine for booking flow.
 *
 * State Machine:
 * GREETING → AWAITING_ROUTING_CODE → SERVICE_SELECTION → TIME_SELECTION → CONFIRMATION → COMPLETED
 *
 * Features:
 * - Customer upsert by phoneNumber
 * - Conversation upsert by customerPhone
 * - State persistence with contextData
 * - Routing code association
 * - 24-hour timeout reset
 * - Interactive message generation
 */
import { WhatsAppConversation, Customer } from '@salex/shared-types';
import { ConversationStateType, ConversationContextType } from '@salex/shared-types';
export type ConversationWithRelations = WhatsAppConversation & {
    customer?: Customer | null;
    business?: {
        id: string;
        name: string;
        routingCode: string | null;
    } | null;
};
export interface InteractiveButton {
    type: 'reply';
    reply: {
        id: string;
        title: string;
    };
}
export interface InteractiveListRow {
    id: string;
    title: string;
    description?: string;
}
export interface InteractiveListSection {
    title?: string;
    rows: InteractiveListRow[];
}
export interface InteractiveMessage {
    type: 'button' | 'list' | 'text';
    header?: {
        type: 'text';
        text: string;
    };
    body: {
        text: string;
    };
    footer?: {
        text: string;
    };
    action?: {
        button?: string;
        buttons?: InteractiveButton[];
        sections?: InteractiveListSection[];
    };
}
export interface ConversationResponse {
    conversationId: string;
    state: ConversationStateType;
    message: InteractiveMessage;
    contextData: ConversationContextType;
}
declare class ConversationService {
    /**
     * Ensure customer exists (upsert by phone number)
     */
    ensureCustomer(phoneNumber: string, name?: string): Promise<Customer>;
    /**
     * Get or create conversation for a customer
     * Resets state if conversation is older than 24 hours
     */
    getOrCreateConversation(customerPhone: string, businessId?: string | null): Promise<ConversationWithRelations>;
    /**
     * Update conversation state and context
     */
    updateState(conversationId: string, state: ConversationStateType, contextData?: Partial<ConversationContextType>): Promise<ConversationWithRelations>;
    /**
     * Associate conversation with a business via routing code
     * If a conversation already exists for this customer+business, use that one instead
     */
    associateWithBusiness(conversationId: string, routingCode: string): Promise<ConversationWithRelations>;
    /**
     * Process incoming message and return response
     * This is the main state machine handler
     */
    processMessage(customerPhone: string, messageText: string, interactiveReply?: {
        type: string;
        id: string;
        title: string;
    }): Promise<ConversationResponse>;
    /**
     * Handle GREETING state - welcome message
     */
    private handleGreeting;
    /**
     * Handle AWAITING_ROUTING_CODE state
     */
    private handleRoutingCode;
    /**
     * Show service selection list
     */
    private showServiceSelection;
    /**
     * Handle SERVICE_SELECTION state
     */
    private handleServiceSelection;
    /**
     * Show time selection options
     */
    private showTimeSelection;
    /**
     * Handle TIME_SELECTION state
     */
    private handleTimeSelection;
    /**
     * Show booking confirmation
     */
    private showConfirmation;
    /**
     * Handle CONFIRMATION state
     */
    private handleConfirmation;
    /**
     * Normalize phone number to E.164 format
     */
    private normalizePhoneNumber;
    /**
     * Extract routing code from message text
     * Supports formats: S1234, s1234, 1234
     */
    private extractRoutingCode;
    /**
     * Find service by text (number or name)
     */
    private findServiceByText;
    /**
     * Generate available time slots
     */
    private generateTimeSlots;
    /**
     * Parse time from text message
     */
    private parseTimeFromText;
    /**
     * Get conversation by ID
     */
    getById(id: string): Promise<ConversationWithRelations | null>;
    /**
     * Get conversation by customer phone
     */
    getByCustomerPhone(customerPhone: string): Promise<ConversationWithRelations | null>;
}
export declare const conversationService: ConversationService;
export {};
//# sourceMappingURL=conversation.service.d.ts.map