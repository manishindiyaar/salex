import { ConfigService } from '@nestjs/config';
import { MockResponseService } from './mock-response.service';
import { WhatsAppWebhookPayload, WhatsAppOutgoingMessage } from 'shared-types';
export declare class WebhookEnhancerService {
    private readonly configService;
    private readonly mockResponseService;
    private readonly logger;
    constructor(configService: ConfigService, mockResponseService: MockResponseService);
    isSimulatorMode(): boolean;
    detectSimulatorRequest(headers: Record<string, string>): boolean;
    processIncomingMessage(payload: WhatsAppWebhookPayload): Promise<void>;
    storeOutgoingResponse(customerPhone: string, businessId: string, responseMessage: WhatsAppOutgoingMessage): Promise<void>;
    updateConversationState(customerPhone: string, businessId: string, state: string, context?: any): Promise<void>;
    getBusinessRoutingCode(messageText: string): string | null;
    extractRoutingCode(messageText: string): string | null;
    formatSimulatorResponse(content: string, options: {
        businessName: string;
        businessCode: string;
        timestamp?: Date;
    }): WhatsAppOutgoingMessage;
    createInteractiveResponse(previewText: string, businessCode: string): WhatsAppOutgoingMessage;
    createSimulatorWebhookPayload(customerPhone: string, businessPhone: string, messageText: string, messageType?: string): WhatsAppWebhookPayload;
    private parseInteractiveMessage;
    private findBusinessByPhone;
    validateSimulatorConfig(): {
        valid: boolean;
        errors: string[];
    };
}
