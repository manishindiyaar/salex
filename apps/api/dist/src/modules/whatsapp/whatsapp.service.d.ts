import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma.service';
import { WhatsAppWebhookPayloadDto } from './dto/whatsapp-webhook.dto';
export declare class WhatsAppService {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService);
    processMessage(payload: WhatsAppWebhookPayloadDto, business: {
        id: string;
        name: string;
        identifier?: string;
    }): Promise<void>;
    private processIndividualMessage;
    private generateResponse;
    extractBusinessFromMessage(payload: WhatsAppWebhookPayloadDto): Promise<{
        id: string;
        name: string;
        identifier?: string;
    } | null>;
    verifyWebhookSignature(rawBody: string, signature: string): boolean;
    extractRoutingCode(message: string): string | null;
    private ensureCustomerExists;
    private logMessage;
    getConversationHistory(businessId: string, customerPhone: string): Promise<{
        business: {
            phoneNumber: string;
            name: string;
            routingCode: string;
        };
        messages: {
            status: string;
            id: string;
            createdAt: Date;
            conversationId: string;
            whatsappMessageId: string | null;
            direction: string;
            messageType: string;
            content: import("@prisma/client/runtime/library").JsonValue;
            isSimulator: boolean;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        businessId: string;
        customerPhone: string;
        state: string;
        context: import("@prisma/client/runtime/library").JsonValue | null;
        lastMessageAt: Date;
        expiresAt: Date;
    }>;
}
