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
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const whatsapp_webhook_dto_1 = require("../../whatsapp/dto/whatsapp-webhook.dto");
const message_type_router_service_1 = require("../services/message-type-router.service");
const business_response_transformer_service_1 = require("../services/business-response-transformer.service");
const customer_session_service_1 = require("../../customer/customer-session.service");
const simulator_message_store_service_1 = require("../services/simulator-message-store.service");
const booking_flow_service_1 = require("../services/booking-flow.service");
let SimulatorWebhookController = SimulatorWebhookController_1 = class SimulatorWebhookController {
    constructor(messageTypeRouter, responseTransformer, customerSessionService, messageStore, bookingFlowService, configService) {
        this.messageTypeRouter = messageTypeRouter;
        this.responseTransformer = responseTransformer;
        this.customerSessionService = customerSessionService;
        this.messageStore = messageStore;
        this.bookingFlowService = bookingFlowService;
        this.configService = configService;
        this.logger = new common_1.Logger(SimulatorWebhookController_1.name);
    }
    async verifySimulatorWebhook(query) {
        this.logger.debug('Simulator webhook verification request received');
        const mode = query['hub.mode'];
        const token = query['hub.verify_token'];
        const challenge = query['hub.challenge'];
        if (!mode && !token && !challenge) {
            this.logger.debug('Simulator health check detected');
            return 'Simulator webhook endpoint healthy';
        }
        const simulatorVerifyToken = this.configService.get('SIMULATOR_WEBHOOK_VERIFY_TOKEN') || 'simulator-verify-token';
        this.logger.debug(`Simulator verify token check: "${token}" === "${simulatorVerifyToken}"`);
        if (mode === 'subscribe' && token === simulatorVerifyToken) {
            this.logger.log('Simulator webhook verified successfully');
            return challenge;
        }
        else {
            this.logger.warn(`Invalid simulator webhook verification: mode=${mode}, token=${token}`);
            throw new common_1.UnauthorizedException('Invalid simulator webhook verification');
        }
    }
    async handleSimulatorWebhook(req, payload, simulatorMode) {
        this.logger.debug(`Simulator webhook message received (Mode: ${simulatorMode || 'header-missing'})`);
        try {
            this.logger.debug('Simulator mode - skipping signature verification');
            const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
            if (!message) {
                this.logger.warn('No message found in webhook payload');
                return {
                    success: true,
                    data: { status: 'no_message' },
                    message: 'No message found in payload',
                };
            }
            const customerPhone = message.from;
            this.logger.debug(`Processing message from customer: ${customerPhone}`);
            this.logger.debug(`Creating/finding session for customer: ${customerPhone}`);
            const authResponse = await this.customerSessionService.authenticateCustomer({
                phoneNumber: customerPhone
            });
            const session = await this.customerSessionService.getSession(authResponse.sessionId);
            const context = {
                customerPhone: session.customerPhone,
                businessId: session.businessId || undefined,
                sessionId: session.id,
                currentState: session.currentState,
                sessionData: session.sessionData
            };
            const incomingMessage = {
                from: message.from,
                id: message.id,
                timestamp: message.timestamp,
                type: message.type,
                text: message.text,
                interactive: message.interactive
            };
            this.messageStore.storeMessage(customerPhone, incomingMessage, 'received');
            this.logger.debug(`Processing message through BookingFlowService`);
            this.logger.debug(`BookingFlowService is: ${this.bookingFlowService ? 'defined' : 'undefined'}`);
            const responseMessages = await this.bookingFlowService.processBookingMessage(customerPhone, message.text?.body || '', message.interactive, session.sessionData);
            this.logger.debug(`BookingFlowService returned ${responseMessages?.length || 0} messages`);
            if (responseMessages && responseMessages.length > 0) {
                responseMessages.forEach((responseMessage, index) => {
                    this.messageStore.storeMessage(customerPhone, responseMessage, 'sent');
                    this.logger.debug(`Stored response message ${index + 1}/${responseMessages.length} for customer: ${customerPhone}`);
                });
            }
            else {
                this.logger.warn(`No response messages to store for customer: ${customerPhone}`);
            }
            this.logger.debug(`Generated ${responseMessages.length} responses`);
            this.logger.debug('Simulator webhook processed successfully');
            return {
                success: true,
                data: { status: 'processed' },
                message: 'Simulator webhook processed successfully',
            };
        }
        catch (error) {
            this.logger.error(`Simulator webhook processing failed: ${error.message}`, error.stack);
            return {
                success: false,
                data: { status: 'error' },
                error: 'Simulator processing error: ' + error.message,
            };
        }
    }
    async healthCheck() {
        return {
            success: true,
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                mode: 'simulator',
            },
            message: 'Simulator WhatsApp service is healthy',
        };
    }
};
exports.SimulatorWebhookController = SimulatorWebhookController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SimulatorWebhookController.prototype, "verifySimulatorWebhook", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe({ transform: true }))),
    __param(2, (0, common_1.Headers)('x-simulator-mode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, whatsapp_webhook_dto_1.WhatsAppWebhookPayloadDto, String]),
    __metadata("design:returntype", Promise)
], SimulatorWebhookController.prototype, "handleSimulatorWebhook", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SimulatorWebhookController.prototype, "healthCheck", null);
exports.SimulatorWebhookController = SimulatorWebhookController = SimulatorWebhookController_1 = __decorate([
    (0, common_1.Controller)('simulate-webhooks/whatsapp'),
    (0, throttler_1.SkipThrottle)(),
    __metadata("design:paramtypes", [message_type_router_service_1.MessageTypeRouterService,
        business_response_transformer_service_1.BusinessResponseTransformerService,
        customer_session_service_1.CustomerSessionService,
        simulator_message_store_service_1.SimulatorMessageStoreService,
        booking_flow_service_1.BookingFlowService,
        config_1.ConfigService])
], SimulatorWebhookController);
//# sourceMappingURL=simulator-webhook.controller.js.map