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
var WhatsAppService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../core/prisma.service");
let WhatsAppService = WhatsAppService_1 = class WhatsAppService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.logger = new common_1.Logger(WhatsAppService_1.name);
    }
    async processMessage(payload, business) {
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
        this.logMessage('processing', { from, messageText, type: messageType }, { businessId: business.id });
        await this.ensureCustomerExists(from);
        let conversation = await this.prisma.whatsAppConversation.findFirst({
            where: {
                customerPhone: from,
                businessId: business.id
            }
        });
        if (!conversation) {
            conversation = await this.prisma.whatsAppConversation.create({
                data: {
                    customerPhone: from,
                    businessId: business.id,
                    state: 'GREETING',
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    context: {}
                }
            });
        }
        await this.prisma.whatsAppMessage.create({
            data: {
                conversationId: conversation.id,
                whatsappMessageId: message.id || `sim_${Date.now()}`,
                direction: 'INCOMING',
                messageType,
                content: { raw: message },
                isSimulator: false,
                status: 'delivered'
            }
        });
        const response = await this.generateResponse(messageText, conversation.state, business);
        if (response) {
            await this.prisma.whatsAppMessage.create({
                data: {
                    conversationId: conversation.id,
                    whatsappMessageId: `resp_${Date.now()}_${from}`,
                    direction: 'OUTGOING',
                    messageType: response.type,
                    content: response.content,
                    isSimulator: false,
                    status: 'sent'
                }
            });
            if (response.nextState) {
                await this.prisma.whatsAppConversation.update({
                    where: { id: conversation.id },
                    data: {
                        state: response.nextState,
                        updatedAt: new Date()
                    }
                });
            }
        }
        this.logMessage('completed', { response: response?.type || 'none', nextState: response?.nextState }, { businessId: business.id });
    }
    async generateResponse(messageText, currentState, business) {
        const routingCode = this.extractRoutingCode(messageText);
        if (routingCode) {
            const targetBusiness = await this.prisma.business.findFirst({
                where: { routingCode: routingCode, businessType: 'SALON' }
            });
            if (targetBusiness) {
                return {
                    type: 'text',
                    content: { text: { body: `Connected to ${targetBusiness.name} (${targetBusiness.routingCode})` } },
                    nextState: 'BUSINESS_CONNECTED'
                };
            }
            else {
                return {
                    type: 'text',
                    content: { text: { body: `Business code ${routingCode} not found. Please check the code and try again.` } }
                };
            }
        }
        switch (currentState) {
            case 'GREETING':
                return {
                    type: 'text',
                    content: {
                        text: {
                            body: `Hello! Welcome to ${business.name} (${business.identifier || business.id}).
    
How can I help you today?

You can:
• Send a business code like "BOOK_AT_S1234" to connect
• Ask about our services
• Check business hours
• Inquire about availability`
                        }
                    },
                    nextState: 'AWAITING_RESPONSE'
                };
            case 'BUSINESS_CONNECTED':
                const services = await this.prisma.service.findMany({
                    where: { businessId: business.id },
                    orderBy: { name: 'asc' }
                });
                if (services.length > 0) {
                    const servicesText = services.map(s => `• ${s.name}: $${s.price} (${s.durationMinutes}min)`).join('\n');
                    return {
                        type: 'text',
                        content: {
                            text: {
                                body: `Here are our available services:\n\n${servicesText}\n\nWhich service would you like to book?`
                            }
                        },
                        nextState: 'SERVICE_SELECTION'
                    };
                }
                else {
                    return {
                        type: 'text',
                        content: { text: { body: `We currently don't have services listed. Please contact us directly for inquiries.` } }
                    };
                }
            case 'SERVICE_SELECTION':
                return {
                    type: 'text',
                    content: { text: { body: 'Great choice! Appointment booking is coming soon. For now, please contact us directly to book your appointment.' } }
                };
            default:
                return {
                    type: 'text',
                    content: { text: { body: `Thanks for your message! I'm here to help you with:\n\n📅 Booking appointments\n💇‍♂️ Services and pricing\n🏢 Business hours\n📱 Contact information\n\nWhat can I help you with today?` } }
                };
        }
    }
    async extractBusinessFromMessage(payload) {
        for (const entry of payload.entry) {
            for (const change of entry.changes) {
                if (change.field === 'messages') {
                    const messages = change.value.messages || [];
                    for (const message of messages) {
                        const messageText = message.text?.body || '';
                        const routingCode = this.extractRoutingCode(messageText);
                        if (routingCode) {
                            const business = await this.prisma.business.findFirst({
                                where: { routingCode: routingCode, businessType: 'SALON' }
                            });
                            if (business) {
                                return { id: business.id, name: business.name, identifier: business.routingCode };
                            }
                        }
                        const customerPhone = message.from;
                        if (customerPhone) {
                            const existingConversation = await this.prisma.whatsAppConversation.findFirst({
                                where: {
                                    customerPhone,
                                    expiresAt: { gt: new Date() }
                                },
                                include: { business: true },
                                orderBy: { lastMessageAt: 'desc' }
                            });
                            if (existingConversation?.business) {
                                return {
                                    id: existingConversation.business.id,
                                    name: existingConversation.business.name,
                                    identifier: existingConversation.business.routingCode
                                };
                            }
                        }
                    }
                }
            }
        }
        return null;
    }
    verifyWebhookSignature(rawBody, signature) {
        const appSecret = this.configService.get('WHATSAPP_APP_SECRET');
        if (!appSecret) {
            return true;
        }
        try {
            const crypto = require('crypto');
            const hmac = crypto.createHmac('sha256', appSecret);
            hmac.update(rawBody);
            const expectedSignature = 'sha256=' + hmac.digest('hex');
            return signature === expectedSignature;
        }
        catch (error) {
            this.logger.error('Signature verification failed', error.message);
            return false;
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
    async ensureCustomerExists(phoneNumber) {
        try {
            const existingCustomer = await this.prisma.customer.findUnique({
                where: { phoneNumber }
            });
            if (!existingCustomer) {
                await this.prisma.customer.create({
                    data: {
                        phoneNumber,
                        name: null
                    }
                });
                this.logger.debug(`Created customer record for phone: ${phoneNumber}`);
            }
        }
        catch (error) {
            if (error.code === 'P2002') {
                this.logger.debug(`Customer already exists for phone: ${phoneNumber}`);
                return;
            }
            throw error;
        }
    }
    logMessage(action, data, context) {
        console.log(`[PRODUCTION] WhatsApp ${action}:`, data, context);
    }
    async getConversationHistory(businessId, customerPhone) {
        const conversation = await this.prisma.whatsAppConversation.findFirst({
            where: {
                businessId,
                customerPhone
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    take: 50
                },
                business: {
                    select: { name: true, routingCode: true, phoneNumber: true }
                }
            }
        });
        return conversation;
    }
};
exports.WhatsAppService = WhatsAppService;
exports.WhatsAppService = WhatsAppService = WhatsAppService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], WhatsAppService);
//# sourceMappingURL=whatsapp.service.js.map