"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MessageTypeRouterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageTypeRouterService = void 0;
const common_1 = require("@nestjs/common");
const shared_types_1 = require("shared-types");
const business_api_router_service_1 = require("./business-api-router.service");
const business_response_transformer_service_1 = require("./business-response-transformer.service");
const message_routing_service_1 = require("../message-routing.service");
const customer_session_service_1 = require("../../customer/customer-session.service");
let MessageTypeRouterService = MessageTypeRouterService_1 = class MessageTypeRouterService {
    constructor(businessApiRouter, responseTransformer, messageRouting, customerSession) {
        this.businessApiRouter = businessApiRouter;
        this.responseTransformer = responseTransformer;
        this.messageRouting = messageRouting;
        this.customerSession = customerSession;
        this.logger = new common_1.Logger(MessageTypeRouterService_1.name);
    }
    async routeMessage(message, context) {
        this.logger.debug(`Routing message type: ${message.type} for customer: ${context.customerPhone}`);
        const flow = this.getConversationFlow(context.currentState);
        try {
            switch (message.type) {
                case 'text':
                    return await this.handleTextMessage(message, context, flow);
                case 'interactive':
                    return await this.handleInteractiveMessage(message, context, flow);
                default:
                    return this.responseTransformer.createErrorResponse('Sorry, I can only process text messages and interactive selections at this time.');
            }
        }
        catch (error) {
            this.logger.error(`Error routing message: ${error.message}`, error);
            return this.responseTransformer.createErrorResponse('Sorry, something went wrong processing your message. Please try again.');
        }
    }
    async handleTextMessage(message, context, flow) {
        const messageText = message.text?.body || '';
        this.logger.debug(`Handling text message: "${messageText}" in state: ${context.currentState}`);
        if (this.messageRouting.hasRoutingCode(messageText)) {
            return await this.handleRoutingCodeMessage(messageText, context);
        }
        switch (context.currentState) {
            case shared_types_1.CustomerSessionState.INITIAL:
                return this.handleInitialStateText(messageText, context);
            case shared_types_1.CustomerSessionState.BUSINESS_SELECTED:
                return this.handleBusinessSelectedText(messageText, context);
            case shared_types_1.CustomerSessionState.SERVICE_SELECTION:
                return this.handleServiceSelectionText(messageText, context);
            case shared_types_1.CustomerSessionState.TIME_SELECTION:
                return this.handleTimeSelectionText(messageText, context);
            case shared_types_1.CustomerSessionState.BOOKING_CONFIRMATION:
                return this.handleBookingConfirmationText(messageText, context);
            default:
                return this.responseTransformer.createGenericHelpResponse();
        }
    }
    async handleInteractiveMessage(message, context, flow) {
        const interactive = message.interactive;
        if (!interactive) {
            return this.responseTransformer.createErrorResponse('Invalid interactive message format.');
        }
        this.logger.debug(`Handling interactive message type: ${interactive.type} in state: ${context.currentState}`);
        switch (interactive.type) {
            case 'button_reply':
                return await this.handleButtonReply(interactive.button_reply, context);
            case 'list_reply':
                return await this.handleListReply(interactive.list_reply, context);
            case 'quick_reply':
                return await this.handleQuickReply(interactive.quick_reply, context);
            default:
                return this.responseTransformer.createErrorResponse('Unsupported interactive message type.');
        }
    }
    async handleButtonReply(buttonReply, context) {
        const { id, title } = buttonReply;
        this.logger.debug(`Processing button reply: ${id} (${title}) in state: ${context.currentState}`);
        switch (id) {
            case 'view_services':
                return await this.handleViewServices(context);
            case 'book_appointment':
            case 'book_now':
                return await this.handleBookAppointment(context);
            case 'view_hours':
                return await this.handleViewHours(context);
            case 'main_menu':
                return await this.handleMainMenu(context);
            case 'help':
                return this.responseTransformer.createGenericHelpResponse();
            case 'try_again':
                return await this.handleTryAgain(context);
            default:
                if (id.startsWith('time_')) {
                    return await this.handleTimeSelection(id, context);
                }
                return this.responseTransformer.createErrorResponse(`Unknown button action: ${id}`);
        }
    }
    async handleListReply(listReply, context) {
        const { id, title } = listReply;
        this.logger.debug(`Processing list reply: ${id} (${title}) in state: ${context.currentState}`);
        if (id.startsWith('service_')) {
            return await this.handleServiceSelection(id, context);
        }
        if (id.startsWith('time_')) {
            return await this.handleTimeSelection(id, context);
        }
        return this.responseTransformer.createErrorResponse(`Unknown list selection: ${id}`);
    }
    async handleQuickReply(quickReply, context) {
        const { id, title } = quickReply;
        this.logger.debug(`Processing quick reply: ${id} (${title}) in state: ${context.currentState}`);
        switch (id) {
            case 'quick_book':
                return await this.handleQuickBook(context);
            case 'view_services':
                return await this.handleViewServices(context);
            case 'view_hours':
                return await this.handleViewHours(context);
            case 'main_menu':
                return await this.handleMainMenu(context);
            case 'help':
                return this.responseTransformer.createGenericHelpResponse();
            default:
                if (id.startsWith('category_')) {
                    return await this.handleServiceCategorySelection(id, context);
                }
                if (id.startsWith('time_')) {
                    return await this.handleTimeSelection(id, context);
                }
                return this.responseTransformer.createErrorResponse(`Unknown quick reply action: ${id}`);
        }
    }
    async handleQuickBook(context) {
        if (!context.businessId) {
            return this.responseTransformer.createErrorResponse('Please select a business first by sending a routing code like "S1234".');
        }
        try {
            const services = await this.businessApiRouter.getBusinessServices(context.businessId);
            if (services.length === 0) {
                return this.responseTransformer.createErrorResponse('No services available for quick booking.');
            }
            const popularService = services[0];
            const updatedSessionData = {
                ...context.sessionData,
                selectedServiceId: popularService.id,
                isQuickBooking: true
            };
            await this.customerSession.updateSessionState(context.sessionId, shared_types_1.CustomerSessionState.TIME_SELECTION, updatedSessionData);
            const timeSlots = await this.businessApiRouter.getAvailableTimeSlots(context.businessId, undefined, { serviceId: popularService.id });
            return this.responseTransformer.createTimeSlotsResponse(timeSlots);
        }
        catch (error) {
            this.logger.error(`Failed quick booking:`, error);
            return this.responseTransformer.createErrorResponse('Unable to start quick booking. Please try browsing services instead.');
        }
    }
    async handleServiceCategorySelection(categoryId, context) {
        const categoryIndex = parseInt(categoryId.replace('category_', ''));
        return await this.handleViewServices(context);
    }
    async handleRoutingCodeMessage(messageText, context) {
        const routingResult = await this.messageRouting.parseRoutingMessage({ message: messageText });
        if (!routingResult.success || !routingResult.business) {
            return this.responseTransformer.createErrorResponse(routingResult.suggestedMessage || 'Invalid business code. Please check and try again.');
        }
        await this.customerSession.setBusinessContext(context.sessionId, routingResult.business.id);
        return this.responseTransformer.createBusinessConnectionResponse(routingResult.business);
    }
    async handleViewServices(context) {
        if (!context.businessId) {
            return this.responseTransformer.createErrorResponse('Please select a business first by sending a routing code like "S1234".');
        }
        try {
            const services = await this.businessApiRouter.getBusinessServices(context.businessId);
            return this.responseTransformer.createServicesListResponse(services);
        }
        catch (error) {
            this.logger.error(`Failed to get services for business ${context.businessId}:`, error);
            return this.responseTransformer.createErrorResponse('Unable to load services. Please try again later.');
        }
    }
    async handleBookAppointment(context) {
        if (!context.businessId) {
            return this.responseTransformer.createErrorResponse('Please select a business first by sending a routing code like "S1234".');
        }
        await this.customerSession.updateSessionState(context.sessionId, shared_types_1.CustomerSessionState.SERVICE_SELECTION);
        return await this.handleViewServices(context);
    }
    async handleViewHours(context) {
        if (!context.businessId) {
            return this.responseTransformer.createErrorResponse('Please select a business first by sending a routing code like "S1234".');
        }
        try {
            const business = await this.businessApiRouter.getBusinessById(context.businessId);
            return this.responseTransformer.createBusinessHoursResponse(business);
        }
        catch (error) {
            this.logger.error(`Failed to get business hours for ${context.businessId}:`, error);
            return this.responseTransformer.createErrorResponse('Unable to load business hours. Please try again later.');
        }
    }
    async handleServiceSelection(serviceId, context) {
        const actualServiceId = serviceId.replace('service_', '');
        const updatedSessionData = {
            ...context.sessionData,
            selectedServiceId: actualServiceId
        };
        await this.customerSession.updateSessionState(context.sessionId, shared_types_1.CustomerSessionState.TIME_SELECTION, updatedSessionData);
        try {
            const timeSlots = await this.businessApiRouter.getAvailableTimeSlots(context.businessId, undefined, { serviceId: actualServiceId });
            return this.responseTransformer.createTimeSlotsResponse(timeSlots);
        }
        catch (error) {
            this.logger.error(`Failed to get time slots:`, error);
            return this.responseTransformer.createErrorResponse('Unable to load available times. Please try again.');
        }
    }
    async handleTimeSelection(timeId, context) {
        const timeSlot = timeId.replace('time_', '').replace(/(\d{2})(\d{2})/, '$1:$2');
        const updatedSessionData = {
            ...context.sessionData,
            selectedTimeSlot: timeSlot
        };
        await this.customerSession.updateSessionState(context.sessionId, shared_types_1.CustomerSessionState.BOOKING_CONFIRMATION, updatedSessionData);
        const bookingDetails = {
            id: `booking_${Date.now()}`,
            service: { name: 'Selected Service' },
            time: timeSlot,
            date: 'Today',
            price: 'See service details'
        };
        return this.responseTransformer.createBookingConfirmationResponse(bookingDetails);
    }
    async handleMainMenu(context) {
        if (!context.businessId) {
            return this.responseTransformer.createWelcomeMessage();
        }
        await this.customerSession.updateSessionState(context.sessionId, shared_types_1.CustomerSessionState.BUSINESS_SELECTED);
        try {
            const business = await this.businessApiRouter.getBusinessById(context.businessId);
            return this.responseTransformer.createBusinessMenuResponse(business.name);
        }
        catch (error) {
            return this.responseTransformer.createWelcomeMessage();
        }
    }
    async handleTryAgain(context) {
        switch (context.currentState) {
            case shared_types_1.CustomerSessionState.SERVICE_SELECTION:
                return await this.handleViewServices(context);
            case shared_types_1.CustomerSessionState.TIME_SELECTION:
                return await this.handleBookAppointment(context);
            default:
                return await this.handleMainMenu(context);
        }
    }
    handleInitialStateText(messageText, context) {
        return this.responseTransformer.createWelcomeMessage();
    }
    handleBusinessSelectedText(messageText, context) {
        const lowerText = messageText.toLowerCase();
        if (lowerText.includes('service') || lowerText.includes('book') || lowerText.includes('appointment')) {
            return this.responseTransformer.createBusinessMenuResponse('Business');
        }
        if (lowerText.includes('hour') || lowerText.includes('time') || lowerText.includes('open')) {
            return this.responseTransformer.createBusinessMenuResponse('Business');
        }
        return this.responseTransformer.createBusinessMenuResponse('Business');
    }
    handleServiceSelectionText(messageText, context) {
        return this.responseTransformer.createErrorResponse('Please select a service from the list above, or use the main menu.');
    }
    handleTimeSelectionText(messageText, context) {
        return this.responseTransformer.createErrorResponse('Please select an available time slot from the options above.');
    }
    handleBookingConfirmationText(messageText, context) {
        const lowerText = messageText.toLowerCase();
        if (lowerText.includes('yes') || lowerText.includes('confirm') || lowerText.includes('book')) {
            return this.responseTransformer.createBookingConfirmationResponse({
                id: `booking_${Date.now()}`,
                service: { name: 'Selected Service' },
                time: context.sessionData?.selectedTimeSlot || 'Selected Time',
                date: 'Today',
                price: 'Service Price'
            });
        }
        if (lowerText.includes('no') || lowerText.includes('cancel')) {
            return this.responseTransformer.createBusinessMenuResponse('Business');
        }
        return this.responseTransformer.createErrorResponse('Please confirm your booking by typing "yes" or "confirm", or "no" to cancel.');
    }
    getConversationFlow(state) {
        const flows = {
            [shared_types_1.CustomerSessionState.INITIAL]: {
                currentState: state,
                nextState: shared_types_1.CustomerSessionState.BUSINESS_SELECTED,
                requiresBusinessContext: false,
                expectedInput: 'routing_code'
            },
            [shared_types_1.CustomerSessionState.BUSINESS_SELECTED]: {
                currentState: state,
                nextState: shared_types_1.CustomerSessionState.SERVICE_SELECTION,
                requiresBusinessContext: true
            },
            [shared_types_1.CustomerSessionState.SERVICE_SELECTION]: {
                currentState: state,
                nextState: shared_types_1.CustomerSessionState.TIME_SELECTION,
                requiresBusinessContext: true,
                expectedInput: 'service_selection'
            },
            [shared_types_1.CustomerSessionState.TIME_SELECTION]: {
                currentState: state,
                nextState: shared_types_1.CustomerSessionState.BOOKING_CONFIRMATION,
                requiresBusinessContext: true,
                expectedInput: 'time_selection'
            },
            [shared_types_1.CustomerSessionState.BOOKING_CONFIRMATION]: {
                currentState: state,
                nextState: shared_types_1.CustomerSessionState.BOOKING_COMPLETE,
                requiresBusinessContext: true,
                expectedInput: 'confirmation'
            },
            [shared_types_1.CustomerSessionState.BOOKING_COMPLETE]: {
                currentState: state,
                requiresBusinessContext: true
            },
            [shared_types_1.CustomerSessionState.EXPIRED]: {
                currentState: state,
                nextState: shared_types_1.CustomerSessionState.INITIAL,
                requiresBusinessContext: false
            }
        };
        return flows[state] || flows[shared_types_1.CustomerSessionState.INITIAL];
    }
    validateMessageContext(context) {
        const flow = this.getConversationFlow(context.currentState);
        if (flow.requiresBusinessContext && !context.businessId) {
            return false;
        }
        return true;
    }
    getExpectedMessageTypes(state) {
        switch (state) {
            case shared_types_1.CustomerSessionState.INITIAL:
                return ['text'];
            case shared_types_1.CustomerSessionState.BUSINESS_SELECTED:
                return ['interactive', 'text'];
            case shared_types_1.CustomerSessionState.SERVICE_SELECTION:
                return ['interactive'];
            case shared_types_1.CustomerSessionState.TIME_SELECTION:
                return ['interactive'];
            case shared_types_1.CustomerSessionState.BOOKING_CONFIRMATION:
                return ['text', 'interactive'];
            default:
                return ['text', 'interactive'];
        }
    }
};
exports.MessageTypeRouterService = MessageTypeRouterService;
exports.MessageTypeRouterService = MessageTypeRouterService = MessageTypeRouterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [business_api_router_service_1.BusinessApiRouterService,
        business_response_transformer_service_1.BusinessResponseTransformerService,
        message_routing_service_1.MessageRoutingService,
        customer_session_service_1.CustomerSessionService])
], MessageTypeRouterService);
//# sourceMappingURL=message-type-router.service.js.map