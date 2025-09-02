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
var WebhookEnhancerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookEnhancerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mock_response_service_1 = require("./mock-response.service");
let WebhookEnhancerService = WebhookEnhancerService_1 = class WebhookEnhancerService {
    constructor(configService, mockResponseService) {
        this.configService = configService;
        this.mockResponseService = mockResponseService;
        this.logger = new common_1.Logger(WebhookEnhancerService_1.name);
    }
    isSimulatorMode() {
        const mode = this.configService.get('WHATSAPP_MODE');
        return mode === 'simulator';
    }
    detectSimulatorRequest(headers) {
        return headers['x-simulator-mode'] === 'true';
    }
    async processIncomingMessage(payload) {
        if (!this.isSimulatorMode()) {
            this.logger.debug('Not in simulator mode, skipping message storage');
            return;
        }
        try {
            const entry = payload.entry?.[0];
            const change = entry?.changes?.[0];
            const message = change?.value?.messages?.[0];
            if (!message) {
                this.logger.debug('No message found in payload');
                return;
            }
            const customerPhone = message.from;
            const metadata = change.value.metadata;
            const businessPhone = metadata.display_phone_number;
            this.logger.debug(`Processing simulator message from ${customerPhone} to ${businessPhone}`);
            const businessId = await this.findBusinessByPhone(businessPhone);
            if (!businessId) {
                this.logger.warn(`No business found for phone: ${businessPhone}`);
                return;
            }
            const conversation = await this.mockResponseService.getOrCreateConversation(customerPhone, businessId);
            await this.mockResponseService.storeIncomingMessage(conversation.id, payload, message.type);
            this.logger.debug(`Stored incoming message for conversation: ${conversation.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to process incoming message: ${error.message}`, error.stack);
        }
    }
    async storeOutgoingResponse(customerPhone, businessId, responseMessage) {
        if (!this.isSimulatorMode()) {
            this.logger.debug('Not in simulator mode, skipping response storage');
            return;
        }
        try {
            const conversation = await this.mockResponseService.getOrCreateConversation(customerPhone, businessId);
            await this.mockResponseService.storeResponse(conversation.id, responseMessage);
            this.logger.debug(`Stored outgoing response for conversation: ${conversation.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to store outgoing response: ${error.message}`, error.stack);
        }
    }
    async updateConversationState(customerPhone, businessId, state, context) {
        if (!this.isSimulatorMode()) {
            return;
        }
        try {
            const conversation = await this.mockResponseService.getOrCreateConversation(customerPhone, businessId);
            await this.mockResponseService.updateConversationState(conversation.id, state, context);
            this.logger.debug(`Updated conversation state: ${conversation.id} -> ${state}`);
        }
        catch (error) {
            this.logger.error(`Failed to update conversation state: ${error.message}`, error.stack);
        }
    }
    getBusinessRoutingCode(messageText) {
        if (!messageText)
            return null;
        const match = messageText.match(/[sS](\d{4})/);
        return match ? match[0].toUpperCase() : null;
    }
    extractRoutingCode(messageText) {
        const routingCodePattern = /[sS]?(\d{4})/;
        const match = messageText.match(routingCodePattern);
        if (match && match[1]) {
            return match[1];
        }
        return null;
    }
    formatSimulatorResponse(content, options) {
        return {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: '',
            type: "text",
            text: {
                body: content
            }
        };
    }
    createInteractiveResponse(previewText, businessCode) {
        return {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: '',
            type: "interactive",
            interactive: {
                type: "button",
                body: {
                    text: previewText
                },
                action: {
                    buttons: [
                        {
                            type: "reply",
                            reply: {
                                id: `business_${businessCode}`,
                                title: `Connect to ${businessCode}`
                            }
                        }
                    ]
                }
            }
        };
    }
    createSimulatorWebhookPayload(customerPhone, businessPhone, messageText, messageType = 'text') {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const messageId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return {
            object: 'whatsapp_business_account',
            entry: [
                {
                    id: 'simulator_entry',
                    changes: [
                        {
                            value: {
                                messaging_product: 'whatsapp',
                                metadata: {
                                    display_phone_number: businessPhone,
                                    phone_number_id: 'simulator_phone_id',
                                },
                                messages: [
                                    {
                                        from: customerPhone,
                                        id: messageId,
                                        timestamp,
                                        type: messageType,
                                        text: messageType === 'text' ? { body: messageText } : undefined,
                                        interactive: messageType === 'interactive' ? this.parseInteractiveMessage(messageText) : undefined,
                                    },
                                ],
                            },
                            field: 'messages',
                        },
                    ],
                },
            ],
        };
    }
    parseInteractiveMessage(messageText) {
        if (messageText.startsWith('BUTTON:')) {
            const parts = messageText.split(':');
            if (parts.length >= 3) {
                return {
                    type: 'button_reply',
                    button_reply: {
                        id: parts[1],
                        title: parts[2],
                    },
                };
            }
        }
        if (messageText.startsWith('LIST:')) {
            const parts = messageText.split(':');
            if (parts.length >= 3) {
                return {
                    type: 'list_reply',
                    list_reply: {
                        id: parts[1],
                        title: parts[2],
                    },
                };
            }
        }
        return undefined;
    }
    async findBusinessByPhone(phoneNumber) {
        const defaultBusinessId = this.configService.get('SIMULATOR_DEFAULT_BUSINESS_ID');
        if (defaultBusinessId) {
            return defaultBusinessId;
        }
        this.logger.warn(`No default business ID configured for simulator mode`);
        return null;
    }
    validateSimulatorConfig() {
        const errors = [];
        if (this.isSimulatorMode()) {
            const defaultBusinessId = this.configService.get('SIMULATOR_DEFAULT_BUSINESS_ID');
            if (!defaultBusinessId) {
                errors.push('SIMULATOR_DEFAULT_BUSINESS_ID is required in simulator mode');
            }
            const webhookUrl = this.configService.get('WEBHOOK_BASE_URL');
            if (!webhookUrl) {
                errors.push('WEBHOOK_BASE_URL is required for simulator polling');
            }
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
};
exports.WebhookEnhancerService = WebhookEnhancerService;
exports.WebhookEnhancerService = WebhookEnhancerService = WebhookEnhancerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mock_response_service_1.MockResponseService])
], WebhookEnhancerService);
//# sourceMappingURL=webhook-enhancer.service.js.map