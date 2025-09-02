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
var SimulatorController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulatorController = void 0;
const common_1 = require("@nestjs/common");
const mock_response_service_1 = require("./mock-response.service");
const webhook_enhancer_service_1 = require("./webhook-enhancer.service");
const simulator_message_store_service_1 = require("./services/simulator-message-store.service");
const prisma_service_1 = require("../../core/prisma.service");
let SimulatorController = SimulatorController_1 = class SimulatorController {
    constructor(mockResponseService, webhookEnhancerService, messageStore, prisma) {
        this.mockResponseService = mockResponseService;
        this.webhookEnhancerService = webhookEnhancerService;
        this.messageStore = messageStore;
        this.prisma = prisma;
        this.logger = new common_1.Logger(SimulatorController_1.name);
    }
    async pollMessages(customerPhone, since, limit) {
        if (!customerPhone) {
            throw new common_1.HttpException('customerPhone is required', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const sinceDate = since ? new Date(parseInt(since)) : undefined;
            const storedMessages = this.messageStore.getMessagesSince(customerPhone, sinceDate);
            const mockData = storedMessages
                .filter(msg => msg.type === 'sent')
                .slice(0, limit ? parseInt(limit) : 20)
                .map(msg => ({
                id: msg.id,
                conversationId: 'sim_' + customerPhone,
                messageType: this.determineMessageType(msg.content),
                content: msg.content,
                timestamp: msg.timestamp,
                delivered: true
            }));
            this.logger.debug(`Polled ${mockData.length} messages for ${customerPhone}`);
            return {
                success: true,
                data: mockData,
                hasMore: false
            };
        }
        catch (error) {
            this.logger.error(`Error polling messages for ${customerPhone}:`, error.message);
            throw new common_1.HttpException('Failed to poll messages', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async sendMessage(body, headers) {
        try {
            headers['x-simulator-mode'] = 'true';
            const webhookPayload = this.webhookEnhancerService.createSimulatorWebhookPayload(body.customerPhone, body.businessPhone, body.message, body.messageType || 'text');
            await this.webhookEnhancerService.processIncomingMessage(webhookPayload);
            this.logger.debug(`Sent message from ${body.customerPhone} to ${body.businessPhone}: "${body.message}"`);
            return {
                success: true,
                messageId: webhookPayload.entry[0].changes[0].value.messages?.[0].id,
                message: 'Message sent to webhook successfully'
            };
        }
        catch (error) {
            this.logger.error('Error sending message:', error.message);
            throw new common_1.HttpException('Failed to send message', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createWebhookPayload(body) {
        try {
            const payload = this.webhookEnhancerService.createSimulatorWebhookPayload(body.customerPhone, body.businessPhone, body.message, body.messageType || 'text');
            return {
                success: true,
                data: payload,
                message: 'Webhook payload created successfully'
            };
        }
        catch (error) {
            this.logger.error('Error creating webhook payload:', error.message);
            throw new common_1.HttpException('Failed to create webhook payload', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findBusinessByCode(code) {
        try {
            const cleanCode = code.replace(/^[sS]/, '');
            const business = await this.prisma.business.findFirst({
                where: {
                    routingCode: cleanCode,
                    businessType: 'SALON'
                },
                select: {
                    id: true,
                    name: true,
                    routingCode: true,
                    phoneNumber: true,
                    address: true,
                    hoursOfOperation: true
                }
            });
            if (!business) {
                throw new common_1.HttpException(`Business with code ${code} not found`, common_1.HttpStatus.NOT_FOUND);
            }
            return {
                success: true,
                data: {
                    businessId: business.id,
                    name: business.name,
                    routingCode: business.routingCode,
                    phoneNumber: business.phoneNumber,
                    address: business.address,
                    hoursOfOperation: business.hoursOfOperation
                }
            };
        }
        catch (error) {
            this.logger.error(`Error finding business ${code}:`, error.message);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Failed to search business', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getConversation(customerPhone, businessId) {
        try {
            const conversation = await this.prisma.whatsAppConversation.findFirst({
                where: {
                    customerPhone,
                    ...(businessId && { businessId }),
                },
                include: {
                    business: {
                        select: {
                            id: true,
                            name: true,
                            routingCode: true,
                        }
                    },
                    messages: {
                        orderBy: { createdAt: 'asc' },
                        take: 50
                    }
                }
            });
            if (!conversation) {
                return {
                    success: true,
                    data: null,
                    message: 'No conversation found'
                };
            }
            return {
                success: true,
                data: {
                    id: conversation.id,
                    customerPhone: conversation.customerPhone,
                    business: conversation.business,
                    state: conversation.state,
                    context: conversation.context,
                    lastMessageAt: conversation.lastMessageAt,
                    expiresAt: conversation.expiresAt,
                    messageCount: conversation.messages.length,
                    messages: conversation.messages.map(msg => ({
                        id: msg.id,
                        direction: msg.direction,
                        messageType: msg.messageType,
                        content: msg.content,
                        status: msg.status,
                        createdAt: msg.createdAt
                    }))
                }
            };
        }
        catch (error) {
            this.logger.error(`Error getting conversation for ${customerPhone}:`, error.message);
            throw new common_1.HttpException('Failed to get conversation', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async storeResponse(body) {
        try {
            await this.webhookEnhancerService.storeOutgoingResponse(body.customerPhone, body.businessId, body.responseMessage);
            return {
                success: true,
                message: 'Response stored successfully'
            };
        }
        catch (error) {
            this.logger.error('Error storing response:', error.message);
            throw new common_1.HttpException('Failed to store response', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async testWebhook(webhook) {
        try {
            this.logger.debug('Testing webhook format:', JSON.stringify(webhook, null, 2));
            const entry = webhook.entry?.[0];
            const change = entry?.changes?.[0];
            const message = change?.value?.messages?.[0];
            return {
                success: true,
                message: 'Webhook payload format is valid',
                data: {
                    entryCount: webhook.entry?.length || 0,
                    hasMessages: !!message,
                    messageFrom: message?.from,
                    messageText: message?.text?.body,
                    messageType: message?.type,
                    businessPhone: change?.value?.metadata?.display_phone_number
                }
            };
        }
        catch (error) {
            this.logger.error('Error testing webhook:', error.message);
            throw new common_1.HttpException('Invalid webhook format', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async healthCheck() {
        try {
            const configValidation = this.webhookEnhancerService.validateSimulatorConfig();
            const activeConversations = await this.prisma.whatsAppConversation.count({
                where: {
                    expiresAt: {
                        gt: new Date()
                    }
                }
            });
            return {
                success: true,
                data: {
                    status: 'healthy',
                    mode: this.webhookEnhancerService.isSimulatorMode() ? 'simulator' : 'production',
                    activeConversations,
                    configValid: configValidation.valid,
                    configErrors: configValidation.errors,
                    timestamp: new Date().toISOString()
                }
            };
        }
        catch (error) {
            this.logger.error('Health check failed:', error.message);
            throw new common_1.HttpException('Simulator unhealthy', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
    }
    async cleanup() {
        try {
            const cleanedCount = await this.mockResponseService.cleanupExpiredConversations();
            return {
                success: true,
                data: {
                    cleanedConversations: cleanedCount
                },
                message: `Cleaned up ${cleanedCount} expired conversations`
            };
        }
        catch (error) {
            this.logger.error('Cleanup failed:', error.message);
            throw new common_1.HttpException('Cleanup failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    determineMessageType(content) {
        if (content?.interactive?.type === 'button') {
            return 'interactive_button';
        }
        if (content?.interactive?.type === 'list') {
            return 'interactive_list';
        }
        if (content?.text) {
            return 'text';
        }
        return 'text';
    }
};
exports.SimulatorController = SimulatorController;
__decorate([
    (0, common_1.Get)('poll'),
    __param(0, (0, common_1.Query)('customerPhone')),
    __param(1, (0, common_1.Query)('since')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], SimulatorController.prototype, "pollMessages", null);
__decorate([
    (0, common_1.Post)('send'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SimulatorController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('create-webhook-payload'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SimulatorController.prototype, "createWebhookPayload", null);
__decorate([
    (0, common_1.Get)('businesses/search/:code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SimulatorController.prototype, "findBusinessByCode", null);
__decorate([
    (0, common_1.Get)('conversations/:customerPhone'),
    __param(0, (0, common_1.Param)('customerPhone')),
    __param(1, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SimulatorController.prototype, "getConversation", null);
__decorate([
    (0, common_1.Post)('store-response'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SimulatorController.prototype, "storeResponse", null);
__decorate([
    (0, common_1.Post)('test-webhook'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SimulatorController.prototype, "testWebhook", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SimulatorController.prototype, "healthCheck", null);
__decorate([
    (0, common_1.Post)('cleanup'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SimulatorController.prototype, "cleanup", null);
exports.SimulatorController = SimulatorController = SimulatorController_1 = __decorate([
    (0, common_1.Controller)('api/v1/whatsapp-simulator'),
    __metadata("design:paramtypes", [mock_response_service_1.MockResponseService,
        webhook_enhancer_service_1.WebhookEnhancerService,
        simulator_message_store_service_1.SimulatorMessageStoreService,
        prisma_service_1.PrismaService])
], SimulatorController);
//# sourceMappingURL=simulator.controller.js.map