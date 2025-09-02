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
var SimulatorWebhookProcessorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulatorWebhookProcessorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/prisma.service");
const business_api_router_service_1 = require("./business-api-router.service");
const business_response_transformer_service_1 = require("./business-response-transformer.service");
const customer_session_service_1 = require("../../customer/customer-session.service");
const shared_types_1 = require("shared-types");
let SimulatorWebhookProcessorService = SimulatorWebhookProcessorService_1 = class SimulatorWebhookProcessorService {
    constructor(prisma, businessApiRouter, responseTransformer, customerSession) {
        this.prisma = prisma;
        this.businessApiRouter = businessApiRouter;
        this.responseTransformer = responseTransformer;
        this.customerSession = customerSession;
        this.logger = new common_1.Logger(SimulatorWebhookProcessorService_1.name);
    }
    async extractBusinessFromMessage(payload) {
        this.logger.debug('Extracting business from simulator message');
        for (const entry of payload.entry) {
            for (const change of entry.changes) {
                if (change.field === 'messages') {
                    const messages = change.value.messages || [];
                    for (const message of messages) {
                        const messageText = message.text?.body || '';
                        const routingCode = this.extractRoutingCode(messageText);
                        if (routingCode) {
                            try {
                                const business = await this.businessApiRouter.getBusinessByRoutingCode(routingCode);
                                if (business) {
                                    return {
                                        id: business.id,
                                        name: business.name,
                                        identifier: business.routingCode
                                    };
                                }
                            }
                            catch (error) {
                                this.logger.warn(`Business lookup failed for code ${routingCode}: ${error.message}`);
                            }
                        }
                        const customerPhone = message.from;
                        if (customerPhone) {
                            try {
                                const activeSession = await this.prisma.customerSession.findFirst({
                                    where: {
                                        customerPhone,
                                        businessId: { not: null },
                                        expiresAt: { gte: new Date() }
                                    }
                                });
                                if (activeSession && activeSession.businessId) {
                                    const business = await this.businessApiRouter.getBusinessById(activeSession.businessId);
                                    if (business) {
                                        return {
                                            id: business.id,
                                            name: business.name,
                                            identifier: business.routingCode
                                        };
                                    }
                                }
                            }
                            catch (error) {
                                this.logger.warn(`Session lookup failed for phone ${customerPhone}: ${error.message}`);
                            }
                        }
                    }
                }
            }
        }
        return null;
    }
    async processSimulatorMessage(payload, business) {
        this.logger.debug(`Processing simulator message for business: ${business.name}`);
        for (const entry of payload.entry) {
            for (const change of entry.changes) {
                if (change.field === 'messages') {
                    for (const message of change.value.messages || []) {
                        await this.processIndividualMessage(message, business);
                    }
                }
            }
        }
    }
    async processIndividualMessage(message, business) {
        const from = message.from;
        const messageText = message.text?.body || message.interactive?.title || '';
        const messageType = message.type || 'text';
        this.logger.debug(`Processing message from ${from}: "${messageText}"`);
        let session;
        try {
            const existingSession = await this.prisma.customerSession.findFirst({
                where: {
                    customerPhone: from,
                    expiresAt: { gte: new Date() }
                }
            });
            if (existingSession) {
                session = existingSession;
                if (!session.businessId && business.id) {
                    session = await this.customerSession.setBusinessContext(session.id, business.id);
                }
            }
            else {
                const authResponse = await this.customerSession.authenticateCustomer({ phoneNumber: from });
                session = await this.customerSession.getSession(authResponse.sessionId);
                if (business.id) {
                    session = await this.customerSession.setBusinessContext(session.id, business.id);
                }
            }
        }
        catch (error) {
            this.logger.error(`Failed to manage customer session: ${error.message}`);
            return;
        }
        await this.storeIncomingMessage(session.id, message, business.id);
        const response = await this.generateBusinessResponse(messageText, messageType, session, business);
        if (response) {
            await this.storeOutgoingMessage(session.id, response, business.id);
            if (response.nextState) {
                let newState;
                switch (response.nextState) {
                    case 'business_connected':
                        newState = shared_types_1.CustomerSessionState.BUSINESS_SELECTED;
                        break;
                    case 'service_selection':
                        newState = shared_types_1.CustomerSessionState.SERVICE_SELECTION;
                        break;
                    case 'time_selection':
                        newState = shared_types_1.CustomerSessionState.TIME_SELECTION;
                        break;
                    case 'booking_completed':
                        newState = shared_types_1.CustomerSessionState.BOOKING_COMPLETE;
                        break;
                    default:
                        newState = shared_types_1.CustomerSessionState.INITIAL;
                }
                await this.customerSession.updateSessionState(session.id, newState);
            }
        }
    }
    async generateBusinessResponse(messageText, messageType, session, business) {
        this.logger.debug(`Generating response for message: "${messageText}" in state: ${session.currentStep}`);
        const routingCode = this.extractRoutingCode(messageText);
        if (routingCode) {
            return this.responseTransformer.createBusinessConnectionResponse(business);
        }
        if (messageType === 'interactive') {
            const interactiveMessage = {
                interactive: {
                    type: 'button_reply',
                    button_reply: { id: messageText },
                    list_reply: { id: messageText }
                }
            };
            return await this.handleInteractiveMessage(interactiveMessage, session, business);
        }
        switch (session.currentState) {
            case shared_types_1.CustomerSessionState.INITIAL:
                return await this.handleWelcomeState(session, business);
            case shared_types_1.CustomerSessionState.BUSINESS_SELECTED:
                return await this.handleBusinessConnectedState(messageText, session, business);
            case shared_types_1.CustomerSessionState.SERVICE_SELECTION:
                return await this.handleServiceSelectionState(messageText, session, business);
            case shared_types_1.CustomerSessionState.TIME_SELECTION:
                return await this.handleTimeSelectionState(messageText, session, business);
            default:
                return this.responseTransformer.createGenericHelpResponse();
        }
    }
    async handleWelcomeState(session, business) {
        try {
            const services = await this.businessApiRouter.getBusinessServices(business.id);
            return this.responseTransformer.createServicesListResponse(services);
        }
        catch (error) {
            this.logger.error(`Failed to get services for business ${business.id}: ${error.message}`);
            return this.responseTransformer.createErrorResponse('Unable to load services at this time.');
        }
    }
    async handleBusinessConnectedState(messageText, session, business) {
        const lowerText = messageText.toLowerCase();
        if (lowerText.includes('service') || lowerText.includes('price')) {
            try {
                const services = await this.businessApiRouter.getBusinessServices(business.id);
                return this.responseTransformer.createServicesListResponse(services);
            }
            catch (error) {
                return this.responseTransformer.createErrorResponse('Unable to load services.');
            }
        }
        if (lowerText.includes('hour') || lowerText.includes('time') || lowerText.includes('open')) {
            try {
                const hours = await this.businessApiRouter.getBusinessHours(business.id);
                return this.responseTransformer.createBusinessHoursResponse(hours);
            }
            catch (error) {
                return this.responseTransformer.createErrorResponse('Unable to load business hours.');
            }
        }
        return this.responseTransformer.createBusinessMenuResponse(business.name);
    }
    async handleServiceSelectionState(messageText, session, business) {
        const serviceId = this.extractServiceId(messageText);
        if (serviceId) {
            try {
                const timeSlots = await this.businessApiRouter.getAvailableTimeSlots(business.id, undefined, { serviceId, startDate: new Date().toISOString().split('T')[0] });
                return this.responseTransformer.createTimeSlotsResponse(timeSlots);
            }
            catch (error) {
                return this.responseTransformer.createErrorResponse('Unable to load available time slots.');
            }
        }
        return this.responseTransformer.createErrorResponse('Please select a valid service.');
    }
    async handleTimeSelectionState(messageText, session, business) {
        const timeSlot = this.extractTimeSlot(messageText);
        if (timeSlot) {
            try {
                const sessionData = session.sessionData || {};
                const booking = await this.businessApiRouter.createBooking(business.id, '', {
                    serviceId: sessionData.selectedServiceId,
                    timeSlot: timeSlot,
                    customerPhone: session.customerPhone,
                });
                return this.responseTransformer.createBookingConfirmationResponse(booking);
            }
            catch (error) {
                return this.responseTransformer.createErrorResponse('Unable to create booking. Please try again.');
            }
        }
        return this.responseTransformer.createErrorResponse('Please select a valid time slot.');
    }
    async handleInteractiveMessage(message, session, business) {
        if (message.interactive?.type === 'button_reply') {
            const buttonId = message.interactive.button_reply.id;
            switch (buttonId) {
                case 'view_services':
                    return await this.handleWelcomeState(session, business);
                case 'view_hours':
                    try {
                        const hours = await this.businessApiRouter.getBusinessHours(business.id);
                        return this.responseTransformer.createBusinessHoursResponse(hours);
                    }
                    catch (error) {
                        return this.responseTransformer.createErrorResponse('Unable to load business hours.');
                    }
                default:
                    return this.responseTransformer.createGenericHelpResponse();
            }
        }
        if (message.interactive?.type === 'list_reply') {
            const listId = message.interactive.list_reply.id;
            if (listId.startsWith('service_')) {
                const serviceId = listId.replace('service_', '');
                const currentData = session.sessionData || {};
                await this.customerSession.updateSessionState(session.id, shared_types_1.CustomerSessionState.SERVICE_SELECTION, {
                    ...currentData,
                    selectedServiceId: serviceId
                });
                return await this.handleServiceSelectionState(`service_${serviceId}`, session, business);
            }
        }
        return this.responseTransformer.createGenericHelpResponse();
    }
    async storeIncomingMessage(sessionId, message, businessId) {
        try {
            await this.prisma.whatsAppMessage.create({
                data: {
                    conversationId: sessionId,
                    whatsappMessageId: message.id || `sim_${Date.now()}`,
                    direction: 'INCOMING',
                    messageType: message.type || 'text',
                    content: { raw: message },
                    isSimulator: true,
                    status: 'delivered'
                }
            });
        }
        catch (error) {
            this.logger.error(`Failed to store incoming message: ${error.message}`);
        }
    }
    async storeOutgoingMessage(sessionId, response, businessId) {
        try {
            await this.prisma.whatsAppMessage.create({
                data: {
                    conversationId: sessionId,
                    whatsappMessageId: `resp_${Date.now()}_${businessId}`,
                    direction: 'OUTGOING',
                    messageType: response.type,
                    content: response.content,
                    isSimulator: true,
                    status: 'sent'
                }
            });
        }
        catch (error) {
            this.logger.error(`Failed to store outgoing message: ${error.message}`);
        }
    }
    extractRoutingCode(message) {
        if (!message)
            return null;
        const sMatch = message.match(/[sS](\d{4})/);
        if (sMatch)
            return sMatch[1];
        const numberMatch = message.match(/\b(\d{4})\b/);
        if (numberMatch)
            return numberMatch[1];
        return null;
    }
    extractServiceId(message) {
        const match = message.match(/service_([a-zA-Z0-9-]+)/);
        return match ? match[1] : null;
    }
    extractTimeSlot(message) {
        const timeMatch = message.match(/(\d{1,2}:\d{2}(?:\s*[AP]M)?)/i);
        return timeMatch ? timeMatch[1] : null;
    }
};
exports.SimulatorWebhookProcessorService = SimulatorWebhookProcessorService;
exports.SimulatorWebhookProcessorService = SimulatorWebhookProcessorService = SimulatorWebhookProcessorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        business_api_router_service_1.BusinessApiRouterService,
        business_response_transformer_service_1.BusinessResponseTransformerService,
        customer_session_service_1.CustomerSessionService])
], SimulatorWebhookProcessorService);
//# sourceMappingURL=simulator-webhook-processor.service.js.map