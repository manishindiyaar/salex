import { BookingFlowService } from './services/booking-flow.service';
import { CustomerSessionService } from '../customer/customer-session.service';
import { SimulatorMessageStoreService } from './services/simulator-message-store.service';
import { WhatsAppWebhookPayload, WhatsAppOutgoingMessage } from 'shared-types';
export declare class SimulatorWebhookController {
    private readonly bookingFlowService;
    private readonly customerSessionService;
    private readonly messageStore;
    private readonly logger;
    constructor(bookingFlowService: BookingFlowService, customerSessionService: CustomerSessionService, messageStore: SimulatorMessageStoreService);
    processWhatsAppWebhook(payload: WhatsAppWebhookPayload): Promise<{
        success: boolean;
        responses?: WhatsAppOutgoingMessage[];
    }>;
    private processIncomingMessage;
    private getOrCreateCustomerSession;
    private storeResponseMessage;
}
