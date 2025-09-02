import { WhatsAppIncomingMessage, CustomerSessionState } from 'shared-types';
import { BusinessApiRouterService } from './business-api-router.service';
import { BusinessResponseTransformerService, WhatsAppMessage } from './business-response-transformer.service';
import { MessageRoutingService } from '../message-routing.service';
import { CustomerSessionService } from '../../customer/customer-session.service';
export interface MessageRouterContext {
    customerPhone: string;
    businessId?: string;
    sessionId: string;
    currentState: CustomerSessionState;
    sessionData?: any;
}
export interface ConversationFlow {
    currentState: CustomerSessionState;
    nextState?: CustomerSessionState;
    requiresBusinessContext: boolean;
    expectedInput?: 'routing_code' | 'service_selection' | 'time_selection' | 'confirmation';
}
export declare class MessageTypeRouterService {
    private readonly businessApiRouter;
    private readonly responseTransformer;
    private readonly messageRouting;
    private readonly customerSession;
    private readonly logger;
    constructor(businessApiRouter: BusinessApiRouterService, responseTransformer: BusinessResponseTransformerService, messageRouting: MessageRoutingService, customerSession: CustomerSessionService);
    routeMessage(message: WhatsAppIncomingMessage, context: MessageRouterContext): Promise<WhatsAppMessage>;
    private handleTextMessage;
    private handleInteractiveMessage;
    private handleButtonReply;
    private handleListReply;
    private handleQuickReply;
    private handleQuickBook;
    private handleServiceCategorySelection;
    private handleRoutingCodeMessage;
    private handleViewServices;
    private handleBookAppointment;
    private handleViewHours;
    private handleServiceSelection;
    private handleTimeSelection;
    private handleMainMenu;
    private handleTryAgain;
    private handleInitialStateText;
    private handleBusinessSelectedText;
    private handleServiceSelectionText;
    private handleTimeSelectionText;
    private handleBookingConfirmationText;
    private getConversationFlow;
    validateMessageContext(context: MessageRouterContext): boolean;
    getExpectedMessageTypes(state: CustomerSessionState): string[];
}
