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
var QRCodeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QRCodeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const business_service_1 = require("./business.service");
const business_routing_service_1 = require("./business-routing.service");
let QRCodeService = QRCodeService_1 = class QRCodeService {
    constructor(configService, businessService, businessRoutingService) {
        this.configService = configService;
        this.businessService = businessService;
        this.businessRoutingService = businessRoutingService;
        this.logger = new common_1.Logger(QRCodeService_1.name);
        this.whatsappNumber = this.configService.get('WHATSAPP_PHONE_NUMBER_ID', '+919876543210');
        this.businessPrefix = this.configService.get('WHATSAPP_BUSINESS_IDENTIFIER_PREFIX', 'S');
    }
    async generateBusinessQR(businessId, userId, customMessage) {
        this.logger.debug(`Generating QR code for business: ${businessId}`);
        const business = await this.businessService.getBusinessById(businessId, userId);
        if (!business.routingCode) {
            throw new common_1.NotFoundException('Business does not have a routing code. Please set one first.');
        }
        const routingMessage = customMessage || `BOOK_AT_${this.businessPrefix}${business.routingCode}`;
        const whatsappUrl = this.generateWhatsAppURL(routingMessage);
        const qrCodeUrl = this.generateQRCodeURL(whatsappUrl);
        return {
            qrCodeUrl,
            whatsappUrl,
            routingCode: business.routingCode,
            businessName: business.name,
            message: routingMessage,
        };
    }
    async generateBusinessQRVariations(businessId, userId) {
        const business = await this.businessService.getBusinessById(businessId, userId);
        if (!business.routingCode) {
            throw new common_1.NotFoundException('Business does not have a routing code. Please set one first.');
        }
        const routingCode = business.routingCode;
        const prefix = this.businessPrefix;
        const messageVariations = [
            `BOOK_AT_${prefix}${routingCode}`,
            `BOOK_${prefix}${routingCode}`,
            `APPOINTMENT_${prefix}${routingCode}`,
            `SALON_${prefix}${routingCode}`,
            `${prefix}${routingCode}`,
        ];
        const qrVariations = messageVariations.map(message => {
            const whatsappUrl = this.generateWhatsAppURL(message);
            const qrCodeUrl = this.generateQRCodeURL(whatsappUrl);
            return {
                qrCodeUrl,
                whatsappUrl,
                routingCode,
                businessName: business.name,
                message,
            };
        });
        return qrVariations;
    }
    generateWhatsAppURL(message) {
        const phoneNumber = this.whatsappNumber.replace('+', '');
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    }
    generateQRCodeURL(data) {
        const encodedData = encodeURIComponent(data);
        const size = '300x300';
        const errorCorrection = 'M';
        return `https://chart.googleapis.com/chart?chs=${size}&cht=qr&chl=${encodedData}&choe=UTF-8&chld=${errorCorrection}|2`;
    }
    async getBusinessQRStats(businessId, userId) {
        const business = await this.businessService.getBusinessById(businessId, userId);
        if (!business.routingCode) {
            return {
                routingCode: '',
                businessName: business.name,
                qrGenerated: false,
                suggestedMessages: ['Please set a routing code first'],
            };
        }
        const prefix = this.businessPrefix;
        const routingCode = business.routingCode;
        const suggestedMessages = [
            `"Scan to book at ${business.name}"`,
            `"Quick booking: ${prefix}${routingCode}"`,
            `"WhatsApp us: BOOK_AT_${prefix}${routingCode}"`,
            `"Message us: SALON_${prefix}${routingCode}"`,
        ];
        return {
            routingCode,
            businessName: business.name,
            qrGenerated: true,
            suggestedMessages,
        };
    }
    async validateAndSuggestCode(preferredCode) {
        const isAvailable = await this.businessRoutingService.isCodeAvailable(preferredCode);
        if (isAvailable) {
            return { isAvailable: true, suggestions: [] };
        }
        const suggestions = await this.businessRoutingService.suggestSimilarCodes(preferredCode, 5);
        return { isAvailable: false, suggestions };
    }
    async generateMarketingMaterials(businessId, userId) {
        const business = await this.businessService.getBusinessById(businessId, userId);
        if (!business.routingCode) {
            throw new common_1.NotFoundException('Business routing code required for marketing materials');
        }
        const qrCodes = await this.generateBusinessQRVariations(businessId, userId);
        const routingCode = business.routingCode;
        const prefix = this.businessPrefix;
        const printableText = [
            `📱 Book with ${business.name}`,
            `Text us: ${prefix}${routingCode}`,
            `WhatsApp: ${this.whatsappNumber}`,
            `Message: "BOOK_AT_${prefix}${routingCode}"`,
        ];
        const socialMediaText = [
            `🚀 Now booking on WhatsApp! Text "${prefix}${routingCode}" to ${this.whatsappNumber}`,
            `📅 Quick appointments at ${business.name} - just send "${prefix}${routingCode}"!`,
            `💬 Skip the call, just text! Message us "${prefix}${routingCode}" to book instantly`,
        ];
        return {
            qrCodes,
            printableText,
            socialMediaText,
        };
    }
};
exports.QRCodeService = QRCodeService;
exports.QRCodeService = QRCodeService = QRCodeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        business_service_1.BusinessService,
        business_routing_service_1.BusinessRoutingService])
], QRCodeService);
//# sourceMappingURL=qr-code.service.js.map