import { CustomerSessionService } from '../customer/customer-session.service';
import { MessageRoutingService } from './message-routing.service';
import { MessageTypeRouterService } from './services/message-type-router.service';
import { BusinessResponseTransformerService } from './services/business-response-transformer.service';
import { SimulatorMessageStoreService } from './services/simulator-message-store.service';
import { BusinessService } from '../business/business.service';
import { ApiResponse, CustomerAuthRequest, CustomerAuthResponse, SendMessageResponse, PollMessagesResponse, ParseRoutingCodeRequest, ParseRoutingCodeResponse, CustomerSession } from 'shared-types';
export declare class WhatsAppSimulatorController {
    private readonly customerSessionService;
    private readonly messageRoutingService;
    private readonly messageTypeRouter;
    private readonly responseTransformer;
    private readonly messageStore;
    private readonly businessService;
    private readonly logger;
    constructor(customerSessionService: CustomerSessionService, messageRoutingService: MessageRoutingService, messageTypeRouter: MessageTypeRouterService, responseTransformer: BusinessResponseTransformerService, messageStore: SimulatorMessageStoreService, businessService: BusinessService);
    authenticateCustomer(request: CustomerAuthRequest): Promise<ApiResponse<CustomerAuthResponse>>;
    sendMessage(sessionId: string, request: {
        message: string;
    }): Promise<ApiResponse<SendMessageResponse>>;
    pollMessages(sessionId: string, since?: string): Promise<ApiResponse<PollMessagesResponse>>;
    getSession(sessionId: string): Promise<ApiResponse<CustomerSession>>;
    parseRoutingCode(request: ParseRoutingCodeRequest): Promise<ApiResponse<ParseRoutingCodeResponse>>;
    handleInteraction(sessionId: string, request: {
        type: string;
        payload: string;
    }): Promise<ApiResponse<SendMessageResponse>>;
    getSimulatorStats(): Promise<ApiResponse<any>>;
    healthCheck(): Promise<ApiResponse<any>>;
    private processCustomerMessage;
    private handleInitialState;
    private handleBusinessSelectedState;
    private handleServiceSelectionState;
    private handleDefaultResponse;
    private processInteraction;
    private determineMessageType;
    private convertToMessageContent;
}
