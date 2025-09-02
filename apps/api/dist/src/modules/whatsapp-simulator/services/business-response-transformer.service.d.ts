export interface WhatsAppInteractiveButton {
    type: 'reply';
    reply: {
        id: string;
        title: string;
    };
}
export interface WhatsAppInteractiveList {
    body: {
        text: string;
    };
    footer?: {
        text: string;
    };
    action: {
        button: string;
        sections: Array<{
            title: string;
            rows: Array<{
                id: string;
                title: string;
                description?: string;
            }>;
        }>;
    };
}
export interface WhatsAppButtonAction {
    buttons: WhatsAppInteractiveButton[];
}
export interface WhatsAppListAction {
    button: string;
    sections: Array<{
        title: string;
        rows: Array<{
            id: string;
            title: string;
            description?: string;
        }>;
    }>;
}
export interface WhatsAppQuickReplyAction {
    quick_replies: Array<{
        type: 'reply';
        reply: {
            id: string;
            title: string;
        };
    }>;
}
export interface WhatsAppMessage {
    type: 'text' | 'interactive';
    text?: {
        body: string;
    };
    interactive?: {
        type: 'button' | 'list' | 'quick_reply';
        body?: {
            text: string;
        };
        header?: {
            type: 'text';
            text: string;
        };
        footer?: {
            text: string;
        };
        action?: WhatsAppButtonAction | WhatsAppListAction | WhatsAppQuickReplyAction;
    };
    nextState?: string;
}
export declare class BusinessResponseTransformerService {
    private readonly logger;
    createBusinessConnectionResponse(business: any): WhatsAppMessage;
    createServicesListResponse(services: any[]): WhatsAppMessage;
    createTimeSlotsResponse(timeSlots: any[]): WhatsAppMessage;
    createBusinessHoursResponse(hours: any): WhatsAppMessage;
    createBookingConfirmationResponse(booking: any): WhatsAppMessage;
    createBusinessMenuResponse(businessName: string): WhatsAppMessage;
    createErrorResponse(errorMessage: string): WhatsAppMessage;
    createGenericHelpResponse(): WhatsAppMessage;
    createWelcomeMessage(): WhatsAppMessage;
    createQuickReplyMessage(bodyText: string, quickReplies: Array<{
        id: string;
        title: string;
    }>): WhatsAppMessage;
    createBookingFlowQuickReplies(businessName: string): WhatsAppMessage;
    createServiceCategoryQuickReplies(categories: string[]): WhatsAppMessage;
    transformApiResponse(apiResponse: any, messageType: 'services' | 'timeslots' | 'hours' | 'booking'): WhatsAppMessage;
    validateWhatsAppMessage(message: WhatsAppMessage): boolean;
    getMessageContentForStorage(message: WhatsAppMessage): any;
}
