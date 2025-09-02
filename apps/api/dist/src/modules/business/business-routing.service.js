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
var BusinessRoutingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRoutingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma.service");
let BusinessRoutingService = BusinessRoutingService_1 = class BusinessRoutingService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(BusinessRoutingService_1.name);
    }
    async isCodeAvailable(code) {
        this.logger.debug(`Checking availability for code: ${code}`);
        if (!this.isValidCode(code)) {
            return false;
        }
        const existing = await this.prisma.business.findUnique({
            where: { routingCode: code },
            select: { id: true }
        });
        return !existing;
    }
    async checkCodeAvailability(code) {
        this.logger.debug(`Checking code availability: ${code}`);
        if (!this.isValidCode(code)) {
            throw new common_1.BadRequestException('Routing code must be exactly 4 digits between 1000-9999');
        }
        const available = await this.isCodeAvailable(code);
        if (available) {
            return { available: true };
        }
        else {
            const suggestions = await this.suggestSimilarCodes(code, 5);
            return {
                available: false,
                suggestions
            };
        }
    }
    async suggestSimilarCodes(preferredCode, limit = 5) {
        this.logger.debug(`Generating suggestions for taken code: ${preferredCode}`);
        const suggestions = [];
        const base = parseInt(preferredCode);
        for (let i = 1; i <= 10 && suggestions.length < limit; i++) {
            const candidates = [
                this.formatCode(base + i),
                this.formatCode(base - i),
            ];
            for (const candidate of candidates) {
                if (this.isValidCode(candidate) && await this.isCodeAvailable(candidate) && suggestions.length < limit) {
                    suggestions.push(candidate);
                }
            }
        }
        if (suggestions.length < limit) {
            const prefix = preferredCode.substring(0, 2);
            for (let i = 0; i < 100 && suggestions.length < limit; i++) {
                const candidate = prefix + i.toString().padStart(2, '0');
                if (candidate !== preferredCode && this.isValidCode(candidate) && await this.isCodeAvailable(candidate)) {
                    suggestions.push(candidate);
                }
            }
        }
        if (suggestions.length < limit) {
            const rangeStart = Math.max(1000, base - 100);
            const rangeEnd = Math.min(9999, base + 100);
            for (let i = 0; i < 50 && suggestions.length < limit; i++) {
                const randomCode = this.formatCode(Math.floor(Math.random() * (rangeEnd - rangeStart)) + rangeStart);
                if (this.isValidCode(randomCode) && await this.isCodeAvailable(randomCode)) {
                    suggestions.push(randomCode);
                }
            }
        }
        this.logger.debug(`Generated ${suggestions.length} suggestions: ${suggestions.join(', ')}`);
        return suggestions;
    }
    async setBusinessRoutingCode(businessId, routingCode, userId) {
        this.logger.debug(`Setting routing code ${routingCode} for business: ${businessId}`);
        if (!this.isValidCode(routingCode)) {
            throw new common_1.BadRequestException('Routing code must be exactly 4 digits between 1000-9999');
        }
        const business = await this.prisma.business.findUnique({
            where: { id: businessId },
            select: { id: true, ownerId: true, routingCode: true }
        });
        if (!business) {
            throw new common_1.NotFoundException('Business not found');
        }
        if (business.ownerId !== userId) {
            throw new common_1.BadRequestException('You do not have permission to modify this business');
        }
        if (business.routingCode) {
            throw new common_1.ConflictException('Business already has a routing code. Routing codes cannot be changed once set.');
        }
        if (!await this.isCodeAvailable(routingCode)) {
            throw new common_1.ConflictException(`Routing code ${routingCode} is already taken`);
        }
        try {
            await this.prisma.business.update({
                where: { id: businessId },
                data: { routingCode }
            });
            this.logger.log(`Successfully assigned routing code ${routingCode} to business ${businessId}`);
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException(`Routing code ${routingCode} is already taken`);
            }
            throw error;
        }
    }
    async findBusinessByRoutingCode(code) {
        this.logger.debug(`Looking up business by routing code: ${code}`);
        if (!this.isValidCode(code)) {
            throw new common_1.BadRequestException('Invalid routing code format');
        }
        const business = await this.prisma.business.findUnique({
            where: { routingCode: code },
            select: {
                id: true,
                name: true,
                address: true,
                phoneNumber: true,
                routingCode: true,
                hoursOfOperation: true
            }
        });
        if (!business) {
            throw new common_1.NotFoundException(`No business found with routing code S${code}`);
        }
        return business;
    }
    async generateAvailableCode() {
        this.logger.debug('Generating next available routing code');
        for (let code = 1000; code <= 9999; code++) {
            const codeStr = this.formatCode(code);
            if (await this.isCodeAvailable(codeStr)) {
                return codeStr;
            }
        }
        throw new common_1.ConflictException('No routing codes available. All codes from 1000-9999 are taken.');
    }
    async getCodeStatistics() {
        const totalAssigned = await this.prisma.business.count({
            where: {
                routingCode: {
                    not: null
                }
            }
        });
        const totalPossible = 9000;
        const totalAvailable = totalPossible - totalAssigned;
        const utilizationPercentage = (totalAssigned / totalPossible) * 100;
        return {
            totalAssigned,
            totalAvailable,
            utilizationPercentage: Math.round(utilizationPercentage * 100) / 100
        };
    }
    isValidCode(code) {
        const codeNum = parseInt(code);
        return /^\d{4}$/.test(code) && codeNum >= 1000 && codeNum <= 9999;
    }
    formatCode(num) {
        return num.toString().padStart(4, '0');
    }
};
exports.BusinessRoutingService = BusinessRoutingService;
exports.BusinessRoutingService = BusinessRoutingService = BusinessRoutingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BusinessRoutingService);
//# sourceMappingURL=business-routing.service.js.map