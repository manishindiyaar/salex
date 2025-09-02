import { PrismaService } from '../../../core/prisma.service';
import { WhatsAppWebhookPayloadDto } from '../../whatsapp/dto/whatsapp-webhook.dto';
import { BusinessApiRouterService } from './business-api-router.service';
import { BusinessResponseTransformerService } from './business-response-transformer.service';
import { CustomerSessionService } from '../../customer/customer-session.service';
export declare class SimulatorWebhookProcessorService {
    private readonly prisma;
    private readonly businessApiRouter;
    private readonly responseTransformer;
    private readonly customerSession;
    private readonly logger;
    constructor(prisma: PrismaService, businessApiRouter: BusinessApiRouterService, responseTransformer: BusinessResponseTransformerService, customerSession: CustomerSessionService);
    extractBusinessFromMessage(payload: WhatsAppWebhookPayloadDto): Promise<{
        id: string;
        name: string;
        identifier?: string;
    } | null>;
    processSimulatorMessage(payload: WhatsAppWebhookPayloadDto, business: {
        id: string;
        name: string;
        identifier?: string;
    }): Promise<void>;
    private processIndividualMessage;
    private generateBusinessResponse;
    private handleWelcomeState;
    private handleBusinessConnectedState;
    private handleServiceSelectionState;
    private handleTimeSelectionState;
    private handleInteractiveMessage;
    private storeIncomingMessage;
    private storeOutgoingMessage;
    private extractRoutingCode;
    private extractServiceId;
    private extractTimeSlot;
}
