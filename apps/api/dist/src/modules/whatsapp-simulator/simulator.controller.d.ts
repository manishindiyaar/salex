import { MockResponseService } from './mock-response.service';
import { WebhookEnhancerService } from './webhook-enhancer.service';
import { SimulatorMessageStoreService } from './services/simulator-message-store.service';
import { PrismaService } from '../../core/prisma.service';
import { WhatsAppOutgoingMessage, MockResponsesResponse, WhatsAppWebhookPayload, ApiResponse } from 'shared-types';
export declare class SimulatorController {
    private readonly mockResponseService;
    private readonly webhookEnhancerService;
    private readonly messageStore;
    private readonly prisma;
    private readonly logger;
    constructor(mockResponseService: MockResponseService, webhookEnhancerService: WebhookEnhancerService, messageStore: SimulatorMessageStoreService, prisma: PrismaService);
    pollMessages(customerPhone: string, since?: string, limit?: string): Promise<MockResponsesResponse>;
    sendMessage(body: {
        customerPhone: string;
        businessPhone: string;
        message: string;
        messageType?: string;
    }, headers: Record<string, string>): Promise<{
        success: boolean;
        messageId: string;
        message: string;
    }>;
    createWebhookPayload(body: {
        customerPhone: string;
        businessPhone: string;
        message: string;
        messageType?: string;
    }): Promise<ApiResponse<WhatsAppWebhookPayload>>;
    findBusinessByCode(code: string): Promise<{
        success: boolean;
        data: {
            businessId: string;
            name: string;
            routingCode: string;
            phoneNumber: string;
            address: string;
            hoursOfOperation: import("@prisma/client/runtime/library").JsonValue;
        };
    }>;
    getConversation(customerPhone: string, businessId?: string): Promise<{
        success: boolean;
        data: any;
        message: string;
    } | {
        success: boolean;
        data: {
            id: string;
            customerPhone: string;
            business: {
                id: string;
                name: string;
                routingCode: string;
            };
            state: string;
            context: import("@prisma/client/runtime/library").JsonValue;
            lastMessageAt: Date;
            expiresAt: Date;
            messageCount: number;
            messages: {
                id: string;
                direction: string;
                messageType: string;
                content: import("@prisma/client/runtime/library").JsonValue;
                status: string;
                createdAt: Date;
            }[];
        };
        message?: undefined;
    }>;
    storeResponse(body: {
        customerPhone: string;
        businessId: string;
        responseMessage: WhatsAppOutgoingMessage;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    testWebhook(webhook: WhatsAppWebhookPayload): Promise<{
        success: boolean;
        message: string;
        data: {
            entryCount: number;
            hasMessages: boolean;
            messageFrom: string;
            messageText: string;
            messageType: "text" | "interactive" | "button" | "list" | "image" | "document";
            businessPhone: string;
        };
    }>;
    healthCheck(): Promise<{
        success: boolean;
        data: {
            status: string;
            mode: string;
            activeConversations: number;
            configValid: boolean;
            configErrors: string[];
            timestamp: string;
        };
    }>;
    cleanup(): Promise<{
        success: boolean;
        data: {
            cleanedConversations: number;
        };
        message: string;
    }>;
    private determineMessageType;
}
