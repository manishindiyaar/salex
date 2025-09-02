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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WhatsAppSimulatorController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppSimulatorController = void 0;
const common_1 = require("@nestjs/common");
const customer_session_service_1 = require("../customer/customer-session.service");
const message_routing_service_1 = require("./message-routing.service");
const message_type_router_service_1 = require("./services/message-type-router.service");
const business_response_transformer_service_1 = require("./services/business-response-transformer.service");
const simulator_message_store_service_1 = require("./services/simulator-message-store.service");
const business_service_1 = require("../business/business.service");
const shared_types_1 = require("shared-types");
let WhatsAppSimulatorController = WhatsAppSimulatorController_1 = class WhatsAppSimulatorController {
    constructor(customerSessionService, messageRoutingService, messageTypeRouter, responseTransformer, messageStore, businessService) {
        this.customerSessionService = customerSessionService;
        this.messageRoutingService = messageRoutingService;
        this.messageTypeRouter = messageTypeRouter;
        this.responseTransformer = responseTransformer;
        this.messageStore = messageStore;
        this.businessService = businessService;
        this.logger = new common_1.Logger(WhatsAppSimulatorController_1.name);
    }
    async authenticateCustomer(request) {
        this.logger.debug(`Customer authentication request: ${request.phoneNumber}`);
        try {
            const authResponse = await this.customerSessionService.authenticateCustomer(request);
            return {
                success: true,
                data: authResponse,
                message: 'Authentication successful',
            };
        }
        catch (error) {
            this.logger.error(`Authentication failed: ${error.message}`, error.stack);
            throw new common_1.HttpException(error.message, common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async sendMessage(sessionId, request) {
        this.logger.debug(`Send message request for session: ${sessionId}`);
        try {
            const session = await this.customerSessionService.getSession(sessionId);
            const incomingMessage = {
                from: session.customerPhone,
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Math.floor(Date.now() / 1000).toString(),
                type: 'text',
                text: { body: request.message }
            };
            const context = {
                customerPhone: session.customerPhone,
                businessId: session.businessId || undefined,
                sessionId: session.id,
                currentState: session.currentState,
                sessionData: session.sessionData
            };
            const responseMessage = await this.messageTypeRouter.routeMessage(incomingMessage, context);
            return {
                success: true,
                data: {
                    success: true,
                    messageId: `msg_${Date.now()}`,
                    timestamp: new Date()
                },
                message: 'Message sent successfully',
            };
        }
        catch (error) {
            this.logger.error(`Send message failed: ${error.message}`, error.stack);
            throw new common_1.HttpException(error.message, common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async pollMessages(sessionId, since) {
        this.logger.debug(`Poll messages for session: ${sessionId}`);
        try {
            const session = await this.customerSessionService.getSession(sessionId);
            const sinceDate = since ? new Date(since) : undefined;
            const storedMessages = this.messageStore.getMessagesSince(session.customerPhone, sinceDate);
            const messages = storedMessages.map(stored => ({
                id: stored.id,
                sessionId: sessionId,
                messageId: stored.id,
                fromPhone: stored.type === 'received' ? session.customerPhone : 'business',
                toPhone: stored.type === 'received' ? 'business' : session.customerPhone,
                messageType: this.determineMessageType(stored.content),
                content: this.convertToMessageContent(stored.content),
                timestamp: stored.timestamp,
                isFromCustomer: stored.type === 'received',
                delivered: true,
                read: true
            }));
            const response = {
                success: true,
                messages,
                hasMore: false
            };
            return {
                success: true,
                data: response,
                message: 'Messages retrieved successfully',
            };
        }
        catch (error) {
            this.logger.error(`Poll messages failed: ${error.message}`, error.stack);
            throw new common_1.HttpException(error.message, common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getSession(sessionId) {
        this.logger.debug(`Get session: ${sessionId}`);
        try {
            const session = await this.customerSessionService.getSession(sessionId);
            return {
                success: true,
                data: session,
                message: 'Session retrieved successfully',
            };
        }
        catch (error) {
            this.logger.error(`Get session failed: ${error.message}`, error.stack);
            throw new common_1.HttpException(error.message, common_1.HttpStatus.NOT_FOUND);
        }
    }
    async parseRoutingCode(request) {
        this.logger.debug(`Parse routing code from: "${request.message}"`);
        try {
            const response = await this.messageRoutingService.parseRoutingMessage(request);
            return {
                success: true,
                data: response,
                message: 'Message parsed successfully',
            };
        }
        catch (error) {
            this.logger.error(`Parse routing failed: ${error.message}`, error.stack);
            throw new common_1.HttpException(error.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async handleInteraction(sessionId, request) {
        this.logger.debug(`Handle interaction for session: ${sessionId}, type: ${request.type}`);
        try {
            const session = await this.customerSessionService.getSession(sessionId);
            const response = await this.processInteraction(session, request.type, request.payload);
            return {
                success: true,
                data: response,
                message: 'Interaction processed successfully',
            };
        }
        catch (error) {
            this.logger.error(`Handle interaction failed: ${error.message}`, error.stack);
            throw new common_1.HttpException(error.message, common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getSimulatorStats() {
        this.logger.debug('Get simulator statistics');
        try {
            const sessionStats = await this.customerSessionService.getSessionStats();
            return {
                success: true,
                data: {
                    sessions: sessionStats,
                },
                message: 'Statistics retrieved successfully',
            };
        }
        catch (error) {
            this.logger.error(`Get stats failed: ${error.message}`, error.stack);
            throw new common_1.HttpException(error.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async healthCheck() {
        try {
            const stats = await this.customerSessionService.getSessionStats();
            return {
                success: true,
                data: {
                    status: 'healthy',
                    activeSessions: stats.activeSessions,
                    timestamp: new Date(),
                },
                message: 'WhatsApp Simulator is healthy',
            };
        }
        catch (error) {
            this.logger.error(`Health check failed: ${error.message}`, error.stack);
            throw new common_1.HttpException('Simulator unhealthy', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
    }
    async processCustomerMessage(session, message) {
        this.logger.debug(`Processing customer message in state: ${session.currentState}`);
        if (this.messageRoutingService.hasRoutingCode(message)) {
            const parseResponse = await this.messageRoutingService.parseRoutingMessage({ message });
            if (parseResponse.success && parseResponse.business) {
                await this.customerSessionService.setBusinessContext(session.id, parseResponse.business.id);
                return;
            }
            else {
                const errorContent = {
                    text: parseResponse.suggestedMessage || 'Sorry, I could not find that business code.'
                };
                return;
            }
        }
        switch (session.currentState) {
            case shared_types_1.CustomerSessionState.INITIAL:
                await this.handleInitialState(session.id, message);
                break;
            case shared_types_1.CustomerSessionState.BUSINESS_SELECTED:
                await this.handleBusinessSelectedState(session.id, message);
                break;
            case shared_types_1.CustomerSessionState.SERVICE_SELECTION:
                await this.handleServiceSelectionState(session.id, message);
                break;
            default:
                await this.handleDefaultResponse(session.id, message);
        }
    }
    async handleInitialState(sessionId, message) {
        const responseContent = {
            text: `I'd be happy to help you! To get started, please send me a business code like "BOOK_AT_S1234".\n\nIf you don't have a code, you can ask the salon for their Salex booking code.`
        };
    }
    async handleBusinessSelectedState(sessionId, message) {
        const session = await this.customerSessionService.getSession(sessionId);
        if (session.businessId) {
            const services = await this.businessService.getBusinessServices(session.businessId, '');
            if (services.length > 0) {
                await this.customerSessionService.updateSessionState(sessionId, shared_types_1.CustomerSessionState.SERVICE_SELECTION);
            }
            else {
                const responseContent = {
                    text: 'This business hasn\'t set up their services yet. Please contact them directly or try again later.'
                };
            }
        }
    }
    async handleServiceSelectionState(sessionId, message) {
        const responseContent = {
            text: 'Great choice! Appointment booking is coming soon. For now, please contact the business directly to complete your booking. 📞'
        };
    }
    async handleDefaultResponse(sessionId, message) {
        const responseContent = {
            text: `Thanks for your message! I'm still learning how to help with that. Try sending "BOOK_AT_S1234" with your salon's code to get started.`
        };
    }
    async processInteraction(session, type, payload) {
        this.logger.debug(`Processing interaction: ${type} with payload: ${payload}`);
        switch (payload) {
            case 'view_services':
                if (session.businessId) {
                    await this.customerSessionService.updateSessionState(session.id, shared_types_1.CustomerSessionState.SERVICE_SELECTION);
                }
                break;
            case 'book_appointment':
                return {
                    success: true,
                    messageId: `msg_${Date.now()}`,
                    timestamp: new Date()
                };
            case 'business_hours':
                if (session.businessId) {
                    return {
                        success: true,
                        messageId: `msg_${Date.now()}`,
                        timestamp: new Date()
                    };
                }
                break;
            default:
                if (payload.startsWith('service_')) {
                    return {
                        success: true,
                        messageId: `msg_${Date.now()}`,
                        timestamp: new Date()
                    };
                }
        }
        return {
            success: true,
            messageId: `msg_${Date.now()}`,
            timestamp: new Date()
        };
    }
    determineMessageType(content) {
        if (content?.interactive?.type === 'button') {
            return shared_types_1.MessageType.INTERACTIVE_BUTTON;
        }
        if (content?.interactive?.type === 'list') {
            return shared_types_1.MessageType.INTERACTIVE_LIST;
        }
        if (content?.text) {
            return shared_types_1.MessageType.TEXT;
        }
        return shared_types_1.MessageType.TEXT;
    }
    convertToMessageContent(content) {
        if (content?.text?.body) {
            return { text: content.text.body };
        }
        if (content?.interactive) {
            const interactive = content.interactive;
            if (interactive.type === 'button' && interactive.action?.buttons) {
                return {
                    text: interactive.body?.text || '',
                    buttons: interactive.action.buttons.map((btn) => ({
                        id: btn.reply.id,
                        title: btn.reply.title,
                        payload: btn.reply.id
                    }))
                };
            }
            if (interactive.type === 'list' && interactive.action?.sections) {
                return {
                    text: interactive.body?.text || '',
                    list: {
                        header: interactive.header?.text,
                        body: interactive.body?.text || '',
                        footer: interactive.footer?.text,
                        buttonText: interactive.action.button || 'Select',
                        sections: interactive.action.sections.map((section) => ({
                            title: section.title,
                            rows: section.rows.map((row) => ({
                                id: row.id,
                                title: row.title,
                                description: row.description
                            }))
                        }))
                    }
                };
            }
        }
        if (content?.text || content?.buttons || content?.list) {
            return content;
        }
        if (typeof content === 'string') {
            return { text: content };
        }
        if (content?.text?.body) {
            return { text: content.text.body };
        }
        return { text: JSON.stringify(content) };
    }
};
exports.WhatsAppSimulatorController = WhatsAppSimulatorController;
__decorate([
    (0, common_1.Post)('auth'),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WhatsAppSimulatorController.prototype, "authenticateCustomer", null);
__decorate([
    (0, common_1.Post)('sessions/:sessionId/send'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WhatsAppSimulatorController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)('sessions/:sessionId/messages'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Query)('since')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WhatsAppSimulatorController.prototype, "pollMessages", null);
__decorate([
    (0, common_1.Get)('sessions/:sessionId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsAppSimulatorController.prototype, "getSession", null);
__decorate([
    (0, common_1.Post)('parse-routing'),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WhatsAppSimulatorController.prototype, "parseRoutingCode", null);
__decorate([
    (0, common_1.Post)('sessions/:sessionId/interact'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WhatsAppSimulatorController.prototype, "handleInteraction", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsAppSimulatorController.prototype, "getSimulatorStats", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsAppSimulatorController.prototype, "healthCheck", null);
exports.WhatsAppSimulatorController = WhatsAppSimulatorController = WhatsAppSimulatorController_1 = __decorate([
    (0, common_1.Controller)('api/v1/whatsapp-simulator'),
    __metadata("design:paramtypes", [customer_session_service_1.CustomerSessionService,
        message_routing_service_1.MessageRoutingService,
        message_type_router_service_1.MessageTypeRouterService,
        business_response_transformer_service_1.BusinessResponseTransformerService,
        simulator_message_store_service_1.SimulatorMessageStoreService,
        business_service_1.BusinessService])
], WhatsAppSimulatorController);
//# sourceMappingURL=whatsapp-simulator.controller.js.map