import { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppWebhookPayloadDto } from '../../whatsapp/dto/whatsapp-webhook.dto';
import { MessageTypeRouterService } from '../services/message-type-router.service';
import { BusinessResponseTransformerService } from '../services/business-response-transformer.service';
import { CustomerSessionService } from '../../customer/customer-session.service';
import { SimulatorMessageStoreService } from '../services/simulator-message-store.service';
import { BookingFlowService } from '../services/booking-flow.service';
import { ApiResponse } from 'shared-types';
export declare class SimulatorWebhookController {
    private readonly messageTypeRouter;
    private readonly responseTransformer;
    private readonly customerSessionService;
    private readonly messageStore;
    private readonly bookingFlowService;
    private readonly configService;
    private readonly logger;
    constructor(messageTypeRouter: MessageTypeRouterService, responseTransformer: BusinessResponseTransformerService, customerSessionService: CustomerSessionService, messageStore: SimulatorMessageStoreService, bookingFlowService: BookingFlowService, configService: ConfigService);
    verifySimulatorWebhook(query: any): Promise<string>;
    handleSimulatorWebhook(req: RawBodyRequest<Request>, payload: WhatsAppWebhookPayloadDto, simulatorMode?: string): Promise<ApiResponse<{
        status: string;
    }>>;
    healthCheck(): Promise<ApiResponse<{
        status: string;
        timestamp: string;
        mode: string;
    }>>;
}
