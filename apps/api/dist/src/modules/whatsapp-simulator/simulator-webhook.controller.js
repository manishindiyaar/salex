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
var SimulatorWebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulatorWebhookController = void 0;
const common_1 = require("@nestjs/common");
const booking_flow_service_1 = require("./services/booking-flow.service");
const customer_session_service_1 = require("../customer/customer-session.service");
const simulator_message_store_service_1 = require("./services/simulator-message-store.service");
let SimulatorWebhookController = SimulatorWebhookController_1 = class SimulatorWebhookController {
    constructor(bookingFlowService, customerSessionService, messageStore) {
        this.bookingFlowService = bookingFlowService;
        this.customerSessionService = customerSessionService;
        this.messageStore = messageStore;
        this.logger = new common_1.Logger(SimulatorWebhookController_1.name);
    }
    async processWhatsAppWebhook(payload) {
        this.logger.debug('Processing WhatsApp webhook payload', payload);
        try {
            const responses = [];
            for (const entry of payload.entry) {
                for (const change of entry.changes) {
                    if (change.field === 'messages' && change.value.messages) {
                        for (const message of change.value.messages) {
                            const customerPhone = message.from;
                            const messageResponses = await this.processIncomingMessage(message, customerPhone);
                            for (const response of messageResponses) {
                                await this.storeResponseMessage(customerPhone, response);
                            }
                            responses.push(...messageResponses);
                        }
                    }
                }
            }
            this.logger.debug(`Generated ${responses.length} responses`);
            return {
                success: true,
                responses: responses
            };
        }
        catch (error) {
            this.logger.error(`Webhook processing error: ${error.message}`, error.stack);
            throw new common_1.HttpException(`Webhook processing failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async processIncomingMessage(message, customerPhone) {
        this.logger.debug(`Processing message from ${customerPhone}:`, message);
        try {
            const session = await this.getOrCreateCustomerSession(customerPhone);
            const currentState = session.sessionData;
            let responses = [];
            if (message.type === 'text' && message.text?.body) {
                responses = await this.bookingFlowService.processBookingMessage(customerPhone, message.text.body, undefined, currentState);
            }
            else if (message.type === 'interactive' && message.interactive) {
                responses = await this.bookingFlowService.processBookingMessage(customerPhone, '', message.interactive, currentState);
            }
            responses.forEach(response => {
                response.to = customerPhone;
            });
            return responses;
        }
        catch (error) {
            this.logger.error(`Error processing message: ${error.message}`, error.stack);
            return [{
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: customerPhone,
                    type: "text",
                    text: {
                        body: "❌ Something went wrong. Please try again later."
                    }
                }];
        }
    }
    async getOrCreateCustomerSession(customerPhone) {
        try {
            const authResponse = await this.customerSessionService.authenticateCustomer({
                phoneNumber: customerPhone
            });
            const session = await this.customerSessionService.getSession(authResponse.sessionId);
            if (!session.sessionData) {
                await this.customerSessionService.updateSessionState(session.id, 'GREETING', { step: 'GREETING' });
                session.sessionData = { step: 'GREETING' };
            }
            return session;
        }
        catch (error) {
            this.logger.error(`Error getting/creating session: ${error.message}`);
            throw error;
        }
    }
    async storeResponseMessage(customerPhone, response) {
        try {
            const mockResponse = {
                id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                conversationId: `conv_${customerPhone}`,
                messageType: response.type,
                content: response,
                timestamp: new Date(),
                delivered: false
            };
            this.messageStore.storeMessage(customerPhone, response, 'sent');
        }
        catch (error) {
            this.logger.error(`Error storing response message: ${error.message}`);
        }
    }
};
exports.SimulatorWebhookController = SimulatorWebhookController;
__decorate([
    (0, common_1.Post)('whatsapp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SimulatorWebhookController.prototype, "processWhatsAppWebhook", null);
exports.SimulatorWebhookController = SimulatorWebhookController = SimulatorWebhookController_1 = __decorate([
    (0, common_1.Controller)('simulate-webhooks'),
    __metadata("design:paramtypes", [booking_flow_service_1.BookingFlowService,
        customer_session_service_1.CustomerSessionService,
        simulator_message_store_service_1.SimulatorMessageStoreService])
], SimulatorWebhookController);
//# sourceMappingURL=simulator-webhook.controller.js.map