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
var MockResponseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockResponseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma.service");
let MockResponseService = MockResponseService_1 = class MockResponseService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(MockResponseService_1.name);
    }
    async storeResponse(conversationId, responseMessage) {
        try {
            await this.prisma.whatsAppMessage.create({
                data: {
                    conversationId,
                    direction: 'OUTGOING',
                    messageType: responseMessage.type,
                    content: responseMessage,
                    status: 'sent',
                    isSimulator: true,
                },
            });
            this.logger.debug(`Stored response message for conversation: ${conversationId}`);
        }
        catch (error) {
            this.logger.error(`Failed to store response: ${error.message}`, error.stack);
            throw error;
        }
    }
    async storeIncomingMessage(conversationId, messageContent, messageType = 'text') {
        try {
            await this.prisma.whatsAppMessage.create({
                data: {
                    conversationId,
                    direction: 'INCOMING',
                    messageType,
                    content: messageContent,
                    status: 'delivered',
                    isSimulator: true,
                },
            });
            this.logger.debug(`Stored incoming message for conversation: ${conversationId}`);
        }
        catch (error) {
            this.logger.error(`Failed to store incoming message: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getResponsesForCustomer(query) {
        try {
            const { customerPhone, since, limit = 20 } = query;
            const conversation = await this.prisma.whatsAppConversation.findFirst({
                where: {
                    customerPhone,
                },
                orderBy: {
                    lastMessageAt: 'desc',
                },
            });
            if (!conversation) {
                return {
                    success: true,
                    data: [],
                    hasMore: false,
                };
            }
            const whereClause = {
                conversationId: conversation.id,
                direction: 'OUTGOING',
                isSimulator: true,
            };
            if (since) {
                whereClause.createdAt = {
                    gt: new Date(since),
                };
            }
            const messages = await this.prisma.whatsAppMessage.findMany({
                where: whereClause,
                orderBy: {
                    createdAt: 'asc',
                },
                take: limit + 1,
            });
            const hasMore = messages.length > limit;
            const resultMessages = hasMore ? messages.slice(0, limit) : messages;
            const responseData = resultMessages.map((msg) => ({
                id: msg.id,
                conversationId: msg.conversationId,
                messageType: msg.messageType,
                content: msg.content,
                timestamp: msg.createdAt,
                delivered: msg.status === 'delivered' || msg.status === 'read',
            }));
            this.logger.debug(`Retrieved ${responseData.length} responses for customer: ${customerPhone}`);
            return {
                success: true,
                data: responseData,
                hasMore,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get responses: ${error.message}`, error.stack);
            return {
                success: false,
                data: [],
                hasMore: false,
            };
        }
    }
    async getConversationMessages(conversationId) {
        try {
            const messages = await this.prisma.whatsAppMessage.findMany({
                where: {
                    conversationId,
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });
            return messages.map((msg) => ({
                id: msg.id,
                conversationId: msg.conversationId,
                whatsappMessageId: msg.whatsappMessageId,
                direction: msg.direction,
                messageType: msg.messageType,
                content: msg.content,
                status: msg.status,
                isSimulator: msg.isSimulator,
                createdAt: msg.createdAt,
            }));
        }
        catch (error) {
            this.logger.error(`Failed to get conversation messages: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getOrCreateConversation(customerPhone, businessId) {
        try {
            let conversation = await this.prisma.whatsAppConversation.findFirst({
                where: {
                    customerPhone,
                    businessId,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
            });
            if (!conversation) {
                const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
                conversation = await this.prisma.whatsAppConversation.create({
                    data: {
                        customerPhone,
                        businessId,
                        state: 'GREETING',
                        expiresAt,
                        lastMessageAt: new Date(),
                    },
                });
                this.logger.debug(`Created new conversation: ${conversation.id}`);
            }
            else {
                conversation = await this.prisma.whatsAppConversation.update({
                    where: { id: conversation.id },
                    data: { lastMessageAt: new Date() },
                });
            }
            return {
                id: conversation.id,
                customerPhone: conversation.customerPhone,
                businessId: conversation.businessId,
                state: conversation.state,
                context: conversation.context,
                lastMessageAt: conversation.lastMessageAt,
                expiresAt: conversation.expiresAt,
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get/create conversation: ${error.message}`, error.stack);
            throw error;
        }
    }
    async updateConversationState(conversationId, state, context) {
        try {
            await this.prisma.whatsAppConversation.update({
                where: { id: conversationId },
                data: {
                    state,
                    context,
                    lastMessageAt: new Date(),
                },
            });
            this.logger.debug(`Updated conversation state: ${conversationId} -> ${state}`);
        }
        catch (error) {
            this.logger.error(`Failed to update conversation state: ${error.message}`, error.stack);
            throw error;
        }
    }
    async cleanupExpiredConversations() {
        try {
            const result = await this.prisma.whatsAppConversation.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date(),
                    },
                },
            });
            this.logger.debug(`Cleaned up ${result.count} expired conversations`);
            return result.count;
        }
        catch (error) {
            this.logger.error(`Failed to cleanup expired conversations: ${error.message}`, error.stack);
            return 0;
        }
    }
};
exports.MockResponseService = MockResponseService;
exports.MockResponseService = MockResponseService = MockResponseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MockResponseService);
//# sourceMappingURL=mock-response.service.js.map