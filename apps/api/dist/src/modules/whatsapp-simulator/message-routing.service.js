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
var MessageRoutingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRoutingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma.service");
const business_service_1 = require("../business/business.service");
let MessageRoutingService = MessageRoutingService_1 = class MessageRoutingService {
    constructor(prisma, businessService) {
        this.prisma = prisma;
        this.businessService = businessService;
        this.logger = new common_1.Logger(MessageRoutingService_1.name);
    }
    async parseRoutingMessage(request) {
        const { message } = request;
        this.logger.debug(`Parsing message for routing codes: "${message}"`);
        const routingCodes = this.extractRoutingCodes(message);
        if (routingCodes.length === 0) {
            return {
                success: false,
                suggestedMessage: 'Please include a business code like "BOOK_AT_S1234" to get started!'
            };
        }
        const routingCode = routingCodes[0];
        try {
            const business = await this.businessService.findBusinessByRoutingCode(routingCode);
            const businessInfo = {
                id: business.id,
                name: business.name,
                address: business.address,
                phoneNumber: business.phoneNumber,
                routingCode: business.routingCode,
                hoursOfOperation: business.hoursOfOperation
            };
            return {
                success: true,
                routingCode,
                business: businessInfo,
                suggestedMessage: `Great! I found ${business.name}. How can I help you today?`
            };
        }
        catch (error) {
            this.logger.warn(`Business not found for routing code: ${routingCode}`);
            return {
                success: false,
                routingCode,
                suggestedMessage: `Sorry, I couldn't find a business with code S${routingCode}. Please check the code and try again.`
            };
        }
    }
    hasRoutingCode(message) {
        const codes = this.extractRoutingCodes(message);
        return codes.length > 0;
    }
    generateRoutingMessage(routingCode) {
        return `BOOK_AT_S${routingCode}`;
    }
    getRoutingPatterns() {
        return [
            'BOOK_AT_S{code}',
            'BOOK_S{code}',
            'APPOINTMENT_S{code}',
            'APPT_S{code}',
            'S{code}',
            'SALON_S{code}',
            'VISIT_S{code}'
        ];
    }
    isValidRoutingCode(code) {
        const codeRegex = /^[1-9][0-9]{3}$/;
        const numericCode = parseInt(code);
        return codeRegex.test(code) && numericCode >= 1000 && numericCode <= 9999;
    }
    extractRoutingCodes(message) {
        const codes = [];
        const normalizedMessage = message.toUpperCase().replace(/\s+/g, ' ');
        const primaryPatterns = [
            /BOOK[_\s]*AT[_\s]*S(\d{4})/g,
            /BOOK[_\s]*S(\d{4})/g,
            /APPOINTMENT[_\s]*S(\d{4})/g,
            /APPT[_\s]*S(\d{4})/g,
            /SALON[_\s]*S(\d{4})/g,
            /VISIT[_\s]*S(\d{4})/g
        ];
        for (const pattern of primaryPatterns) {
            let match;
            while ((match = pattern.exec(normalizedMessage)) !== null) {
                const code = match[1];
                if (this.isValidRoutingCode(code) && !codes.includes(code)) {
                    codes.push(code);
                }
            }
        }
        if (codes.length === 0) {
            const standalonePattern = /\bS(\d{4})\b/g;
            let match;
            while ((match = standalonePattern.exec(normalizedMessage)) !== null) {
                const code = match[1];
                if (this.isValidRoutingCode(code) && !codes.includes(code)) {
                    codes.push(code);
                }
            }
        }
        if (codes.length === 0) {
            const numberPattern = /\b(\d{4})\b/g;
            let match;
            while ((match = numberPattern.exec(normalizedMessage)) !== null) {
                const code = match[1];
                if (this.isValidRoutingCode(code) && !codes.includes(code)) {
                    codes.push(code);
                }
            }
        }
        this.logger.debug(`Extracted routing codes from "${message}": [${codes.join(', ')}]`);
        return codes;
    }
    async createBusinessRoutingMessage(routingCode) {
        try {
            const business = await this.businessService.findBusinessByRoutingCode(routingCode);
            const businessInfo = {
                id: business.id,
                name: business.name,
                address: business.address,
                phoneNumber: business.phoneNumber,
                routingCode: business.routingCode,
                hoursOfOperation: business.hoursOfOperation
            };
            return {
                routingCode,
                business: businessInfo,
                isValid: true
            };
        }
        catch (error) {
            return {
                routingCode,
                business: {},
                isValid: false
            };
        }
    }
};
exports.MessageRoutingService = MessageRoutingService;
exports.MessageRoutingService = MessageRoutingService = MessageRoutingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        business_service_1.BusinessService])
], MessageRoutingService);
//# sourceMappingURL=message-routing.service.js.map