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
var PublicRoutingController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicRoutingController = void 0;
const common_1 = require("@nestjs/common");
const business_routing_service_1 = require("./business-routing.service");
let PublicRoutingController = PublicRoutingController_1 = class PublicRoutingController {
    constructor(businessRoutingService) {
        this.businessRoutingService = businessRoutingService;
        this.logger = new common_1.Logger(PublicRoutingController_1.name);
    }
    async checkCodeAvailability(code) {
        this.logger.debug(`Public: Checking availability for routing code: ${code}`);
        try {
            const availability = await this.businessRoutingService.checkCodeAvailability(code);
            return {
                success: true,
                data: availability,
                message: availability.available
                    ? 'Code is available'
                    : 'Code is taken, here are alternatives',
            };
        }
        catch (error) {
            this.logger.error(`Failed to check code availability: ${error.message}`, error.stack);
            if (error instanceof common_1.BadRequestException) {
                throw new common_1.HttpException(error.message, common_1.HttpStatus.BAD_REQUEST);
            }
            throw new common_1.HttpException('Failed to check code availability', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getBusinessByCode(code) {
        this.logger.debug(`Public: Looking up business by routing code: ${code}`);
        try {
            const business = await this.businessRoutingService.findBusinessByRoutingCode(code);
            const publicInfo = {
                id: business.id,
                name: business.name,
                address: business.address,
                phoneNumber: business.phoneNumber,
                routingCode: business.routingCode,
                hoursOfOperation: business.hoursOfOperation
            };
            return {
                success: true,
                data: publicInfo,
                message: 'Business found successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to find business by code: ${error.message}`, error.stack);
            if (error.message === 'Invalid routing code format') {
                throw new common_1.HttpException('Invalid routing code format', common_1.HttpStatus.BAD_REQUEST);
            }
            if (error.message.includes('No business found')) {
                throw new common_1.HttpException(`No business found with code S${code}`, common_1.HttpStatus.NOT_FOUND);
            }
            throw new common_1.HttpException('Failed to find business', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.PublicRoutingController = PublicRoutingController;
__decorate([
    (0, common_1.Get)('routing-codes/:code/availability'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicRoutingController.prototype, "checkCodeAvailability", null);
__decorate([
    (0, common_1.Get)('by-code/:code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicRoutingController.prototype, "getBusinessByCode", null);
exports.PublicRoutingController = PublicRoutingController = PublicRoutingController_1 = __decorate([
    (0, common_1.Controller)('api/v1/public/businesses'),
    __metadata("design:paramtypes", [business_routing_service_1.BusinessRoutingService])
], PublicRoutingController);
//# sourceMappingURL=public-routing.controller.js.map