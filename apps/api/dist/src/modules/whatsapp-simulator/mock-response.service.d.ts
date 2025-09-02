import { PrismaService } from '../../core/prisma.service';
import { WhatsAppOutgoingMessage, MockResponseQuery, MockResponsesResponse, WhatsAppConversation, WhatsAppMessage } from 'shared-types';
export declare class MockResponseService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    storeResponse(conversationId: string, responseMessage: WhatsAppOutgoingMessage): Promise<void>;
    storeIncomingMessage(conversationId: string, messageContent: any, messageType?: string): Promise<void>;
    getResponsesForCustomer(query: MockResponseQuery): Promise<MockResponsesResponse>;
    getConversationMessages(conversationId: string): Promise<WhatsAppMessage[]>;
    getOrCreateConversation(customerPhone: string, businessId: string): Promise<WhatsAppConversation>;
    updateConversationState(conversationId: string, state: string, context?: any): Promise<void>;
    cleanupExpiredConversations(): Promise<number>;
}
