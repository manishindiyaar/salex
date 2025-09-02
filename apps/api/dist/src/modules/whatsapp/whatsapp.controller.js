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
var WhatsAppController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const whatsapp_service_1 = require("./whatsapp.service");
const whatsapp_webhook_dto_1 = require("./dto/whatsapp-webhook.dto");
let WhatsAppController = WhatsAppController_1 = class WhatsAppController {
    constructor(whatsappService, configService) {
        this.whatsappService = whatsappService;
        this.configService = configService;
        this.logger = new common_1.Logger(WhatsAppController_1.name);
    }
    async verifyWebhook(query) {
        this.logger.debug('WhatsApp webhook verification request received');
        const mode = query['hub.mode'];
        const token = query['hub.verify_token'];
        const challenge = query['hub.challenge'];
        const verifyToken = this.configService.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
        this.logger.debug(`Loaded verify token: "${verifyToken}"`);
        this.logger.debug(`Received token: "${token}"`);
        this.logger.debug(`Mode: "${mode}"`);
        this.logger.debug(`Token match: ${token === verifyToken}`);
        this.logger.debug(`Mode match: ${mode === 'subscribe'}`);
        if (!verifyToken) {
            this.logger.error('WHATSAPP_WEBHOOK_VERIFY_TOKEN not configured');
            throw new common_1.BadRequestException('Webhook verify token not configured');
        }
        if (mode === 'subscribe' && token === verifyToken) {
            this.logger.log('WhatsApp webhook verified successfully');
            return challenge;
        }
        else {
            this.logger.warn(`Invalid webhook verification: mode=${mode}, token=${token}, verifyToken=${verifyToken}`);
            throw new common_1.UnauthorizedException('Invalid webhook verification');
        }
    }
    async handleWebhook(req, payload, signature) {
        this.logger.debug('WhatsApp webhook message received');
        try {
            if (signature) {
                const rawBody = req.rawBody?.toString('utf8');
                if (!rawBody) {
                    this.logger.error('Raw body not available for signature verification');
                    throw new common_1.UnauthorizedException('Cannot verify webhook signature');
                }
                const isValidSignature = this.whatsappService.verifyWebhookSignature(rawBody, signature);
                if (!isValidSignature) {
                    throw new common_1.UnauthorizedException('Invalid webhook signature');
                }
            }
            else {
                this.logger.warn('No signature provided for webhook verification');
                if (this.configService.get('NODE_ENV') === 'production') {
                    throw new common_1.UnauthorizedException('Webhook signature required');
                }
            }
            const business = await this.whatsappService.extractBusinessFromMessage(payload);
            if (!business) {
                this.logger.warn('Could not identify business from WhatsApp message');
                return {
                    success: true,
                    data: { status: 'processed_without_business_context' },
                    message: 'Message processed but no business context found',
                };
            }
            await this.whatsappService.processMessage(payload, business);
            this.logger.debug('WhatsApp webhook processed successfully');
            return {
                success: true,
                data: { status: 'processed' },
                message: 'Webhook processed successfully',
            };
        }
        catch (error) {
            this.logger.error(`WhatsApp webhook processing failed: ${error.message}`, error.stack);
            if (error instanceof common_1.UnauthorizedException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            return {
                success: false,
                data: { status: 'error' },
                error: 'Internal processing error',
            };
        }
    }
    async healthCheck() {
        return {
            success: true,
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
            },
            message: 'WhatsApp service is healthy',
        };
    }
};
exports.WhatsAppController = WhatsAppController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "verifyWebhook", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe({ transform: true }))),
    __param(2, (0, common_1.Headers)('x-hub-signature-256')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, whatsapp_webhook_dto_1.WhatsAppWebhookPayloadDto, String]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "healthCheck", null);
exports.WhatsAppController = WhatsAppController = WhatsAppController_1 = __decorate([
    (0, common_1.Controller)('webhooks/whatsapp'),
    (0, throttler_1.SkipThrottle)(),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsAppService,
        config_1.ConfigService])
], WhatsAppController);
//# sourceMappingURL=whatsapp.controller.js.map