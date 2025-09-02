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
var BusinessController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const conditional_auth_guard_1 = require("../auth/conditional-auth.guard");
const user_service_1 = require("../auth/user.service");
const business_service_1 = require("./business.service");
const business_routing_service_1 = require("./business-routing.service");
const qr_code_service_1 = require("./qr-code.service");
const business_dto_1 = require("./dto/business.dto");
const update_business_hours_dto_1 = require("./dto/update-business-hours.dto");
let BusinessController = BusinessController_1 = class BusinessController {
    constructor(configService, userService, businessService, businessRoutingService, qrCodeService) {
        this.configService = configService;
        this.userService = userService;
        this.businessService = businessService;
        this.businessRoutingService = businessRoutingService;
        this.qrCodeService = qrCodeService;
        this.logger = new common_1.Logger(BusinessController_1.name);
    }
    async ensureMockUserExists(userId, phoneNumber) {
        const isAuthEnabled = this.configService.get('ENABLE_AUTH') === 'true';
        if (!isAuthEnabled && userId === 'test-user-id') {
            try {
                let user = await this.userService.findById(userId);
                if (!user) {
                    this.logger.debug('Creating mock user for development/testing');
                    await this.userService.createUser({
                        firebaseUid: 'test-firebase-uid',
                        phoneNumber: phoneNumber,
                    });
                    this.logger.log('Mock user created successfully');
                }
            }
            catch (error) {
                if (error.message === 'User already exists') {
                    this.logger.debug('Mock user already exists');
                }
                else {
                    this.logger.error(`Failed to create mock user: ${error.message}`, error.stack);
                    throw error;
                }
            }
        }
    }
    async createBusiness(req, createData) {
        this.logger.debug(`Creating business for user: ${req.user.id}`);
        try {
            await this.ensureMockUserExists(req.user.id, req.user.phoneNumber);
            const business = await this.businessService.createBusiness(req.user.id, createData);
            return {
                success: true,
                data: business,
                message: 'Business created successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to create business: ${error.message}`, error.stack);
            if (error.code === 'P2002') {
                throw new common_1.HttpException('Business with this information already exists', common_1.HttpStatus.CONFLICT);
            }
            throw new common_1.HttpException('Failed to create business', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getCurrentUserBusiness(req) {
        this.logger.debug(`Getting business for current user: ${req.user.id}`);
        try {
            const business = await this.businessService.getUserPrimaryBusiness(req.user.id);
            return {
                success: true,
                data: business,
                message: business
                    ? 'Business retrieved successfully'
                    : 'No business found for current user',
            };
        }
        catch (error) {
            this.logger.error(`Failed to get user business: ${error.message}`, error.stack);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async getBusiness(businessId) {
        this.logger.debug(`Getting business: ${businessId} (public access)`);
        try {
            const business = await this.businessService.getBusinessByIdPublic(businessId);
            return {
                success: true,
                data: business,
                message: 'Business retrieved successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to get business: ${error.message}`, error.stack);
            if (error.message === 'Business not found') {
                throw new common_1.HttpException('Business not found', common_1.HttpStatus.NOT_FOUND);
            }
            if (error.message === 'You do not have access to this business') {
                throw new common_1.HttpException('You do not have access to this business', common_1.HttpStatus.FORBIDDEN);
            }
            throw new common_1.HttpException('Failed to get business', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateBusiness(req, businessId, updateData) {
        this.logger.debug(`Updating business: ${businessId} for user: ${req.user.id}`);
        try {
            const business = await this.businessService.updateBusiness(businessId, req.user.id, updateData);
            return {
                success: true,
                data: business,
                message: 'Business updated successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to update business: ${error.message}`, error.stack);
            if (error.message === 'Business not found') {
                throw new common_1.HttpException('Business not found', common_1.HttpStatus.NOT_FOUND);
            }
            if (error.message === 'You do not have access to this business') {
                throw new common_1.HttpException('You do not have access to this business', common_1.HttpStatus.FORBIDDEN);
            }
            throw new common_1.HttpException('Failed to update business', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getBusinessBookings(req, businessId) {
        this.logger.debug(`Getting bookings for business: ${businessId}`);
        try {
            const bookings = await this.businessService.getBusinessBookings(businessId, req.user.id);
            return {
                success: true,
                data: bookings,
                message: 'Bookings retrieved successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to get bookings: ${error.message}`, error.stack);
            if (error.message === 'Business not found') {
                throw new common_1.HttpException('Business not found', common_1.HttpStatus.NOT_FOUND);
            }
            if (error.message === 'You do not have access to this business') {
                throw new common_1.HttpException('You do not have access to this business', common_1.HttpStatus.FORBIDDEN);
            }
            throw new common_1.HttpException('Failed to get bookings', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateBusinessHours(req, businessId, hoursData) {
        this.logger.debug(`Updating hours for business: ${businessId} by user: ${req.user.id}`);
        try {
            const business = await this.businessService.updateBusinessHours(businessId, req.user.id, hoursData.hoursOfOperation);
            return {
                success: true,
                data: business,
                message: 'Business hours updated successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to update business hours: ${error.message}`, error.stack);
            if (error.message === 'Business not found') {
                throw new common_1.HttpException('Business not found', common_1.HttpStatus.NOT_FOUND);
            }
            if (error.message === 'You do not have access to this business') {
                throw new common_1.HttpException('You do not have access to this business', common_1.HttpStatus.FORBIDDEN);
            }
            if (error instanceof common_1.BadRequestException) {
                throw new common_1.HttpException(error.message, common_1.HttpStatus.BAD_REQUEST);
            }
            throw new common_1.HttpException('Failed to update business hours', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getBusinessHours(businessId) {
        this.logger.debug(`Getting hours for business: ${businessId} (public access)`);
        try {
            const hours = await this.businessService.getBusinessHoursPublic(businessId);
            return {
                success: true,
                data: hours,
                message: 'Business hours retrieved successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to get business hours: ${error.message}`, error.stack);
            if (error.message === 'Business not found') {
                throw new common_1.HttpException('Business not found', common_1.HttpStatus.NOT_FOUND);
            }
            throw new common_1.HttpException('Failed to get business hours', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getBusinessOpenStatus(businessId) {
        this.logger.debug(`Checking open status for business: ${businessId} (public access)`);
        try {
            const currentTime = new Date();
            const isOpen = await this.businessService.isBusinessOpen(businessId, currentTime);
            return {
                success: true,
                data: {
                    isOpen,
                    currentTime: currentTime.toISOString(),
                },
                message: `Business is currently ${isOpen ? 'open' : 'closed'}`,
            };
        }
        catch (error) {
            this.logger.error(`Failed to check business open status: ${error.message}`, error.stack);
            if (error.message === 'Business not found') {
                throw new common_1.HttpException('Business not found', common_1.HttpStatus.NOT_FOUND);
            }
            throw new common_1.HttpException('Failed to check business open status', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async setBusinessRoutingCode(req, businessId, { routingCode }) {
        this.logger.debug(`Setting routing code ${routingCode} for business: ${businessId} by user: ${req.user.id}`);
        try {
            await this.businessRoutingService.setBusinessRoutingCode(businessId, routingCode, req.user.id);
            return {
                success: true,
                data: { routingCode },
                message: 'Routing code set successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to set routing code: ${error.message}`, error.stack);
            if (error.message === 'Business not found') {
                throw new common_1.HttpException('Business not found', common_1.HttpStatus.NOT_FOUND);
            }
            if (error.message === 'You do not have permission to modify this business') {
                throw new common_1.HttpException('You do not have permission to modify this business', common_1.HttpStatus.FORBIDDEN);
            }
            if (error.message.includes('already has a routing code')) {
                throw new common_1.HttpException('Business already has a routing code. Codes cannot be changed once set.', common_1.HttpStatus.CONFLICT);
            }
            if (error.message.includes('already taken')) {
                try {
                    const availability = await this.businessRoutingService.checkCodeAvailability(routingCode);
                    return {
                        success: false,
                        error: `Code ${routingCode} is already taken`,
                        data: { routingCode, suggestions: availability.suggestions },
                        message: 'Please choose from the suggested alternatives'
                    };
                }
                catch (suggestionError) {
                    throw new common_1.HttpException(`Code ${routingCode} is already taken`, common_1.HttpStatus.CONFLICT);
                }
            }
            if (error instanceof common_1.BadRequestException) {
                throw new common_1.HttpException(error.message, common_1.HttpStatus.BAD_REQUEST);
            }
            throw new common_1.HttpException('Failed to set routing code', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getCodeStatistics(req) {
        this.logger.debug(`Getting routing code statistics for user: ${req.user.id}`);
        try {
            const stats = await this.businessRoutingService.getCodeStatistics();
            return {
                success: true,
                data: stats,
                message: 'Statistics retrieved successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to get code statistics: ${error.message}`, error.stack);
            throw new common_1.HttpException('Failed to get statistics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async generateWhatsAppQR(req, businessId, customMessage) {
        this.logger.debug(`Generating WhatsApp QR for business: ${businessId}`);
        try {
            const qrData = await this.qrCodeService.generateBusinessQR(businessId, req.user.id, customMessage);
            return {
                success: true,
                data: qrData,
                message: 'WhatsApp QR code generated successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to generate QR code: ${error.message}`, error.stack);
            if (error.message.includes('routing code')) {
                throw new common_1.HttpException('Business must have a routing code to generate QR', common_1.HttpStatus.BAD_REQUEST);
            }
            if (error.message === 'Business not found') {
                throw new common_1.HttpException('Business not found', common_1.HttpStatus.NOT_FOUND);
            }
            if (error.message === 'You do not have access to this business') {
                throw new common_1.HttpException('You do not have access to this business', common_1.HttpStatus.FORBIDDEN);
            }
            throw new common_1.HttpException('Failed to generate QR code', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getQRVariations(req, businessId) {
        this.logger.debug(`Getting QR variations for business: ${businessId}`);
        try {
            const variations = await this.qrCodeService.generateBusinessQRVariations(businessId, req.user.id);
            return {
                success: true,
                data: variations,
                message: 'QR code variations generated successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to generate QR variations: ${error.message}`, error.stack);
            if (error.message.includes('routing code')) {
                throw new common_1.HttpException('Business must have a routing code to generate QR', common_1.HttpStatus.BAD_REQUEST);
            }
            throw new common_1.HttpException('Failed to generate QR variations', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getMarketingMaterials(req, businessId) {
        this.logger.debug(`Getting marketing materials for business: ${businessId}`);
        try {
            const materials = await this.qrCodeService.generateMarketingMaterials(businessId, req.user.id);
            return {
                success: true,
                data: materials,
                message: 'Marketing materials generated successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to generate marketing materials: ${error.message}`, error.stack);
            if (error.message.includes('routing code')) {
                throw new common_1.HttpException('Business must have a routing code for marketing materials', common_1.HttpStatus.BAD_REQUEST);
            }
            throw new common_1.HttpException('Failed to generate marketing materials', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.BusinessController = BusinessController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(conditional_auth_guard_1.ConditionalAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, business_dto_1.CreateBusinessDto]),
    __metadata("design:returntype", Promise)
], BusinessController.prototype, "createBusiness", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(conditional_auth_guard_1.ConditionalAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BusinessController.prototype, "getCurrentUserBusiness", null);
__decorate([
    (0, common_1.Get)(':businessId'),
    __param(0, (0, common_1.Param)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BusinessController.prototype, "getBusiness", null);
__decorate([
    (0, common_1.Put)(':businessId'),
    (0, common_1.UseGuards)(conditional_auth_guard_1.ConditionalAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('businessId')),
    __param(2, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, business_dto_1.UpdateBusinessDto]),
    __metadata("design:returntype", Promise)
], BusinessController.prototype, "updateBusiness", null);
__decorate([
    (0, common_1.Get)(':businessId/bookings'),
    (0, common_1.UseGuards)(conditional_auth_guard_1.ConditionalAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BusinessController.prototype, "getBusinessBookings", null);
__decorate([
    (0, common_1.Put)(':businessId/hours'),
    (0, common_1.UseGuards)(conditional_auth_guard_1.ConditionalAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('businessId')),
    __param(2, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_business_hours_dto_1.UpdateBusinessHoursRequestDto]),
    __metadata("design:returntype", Promise)
], BusinessController.prototype, "updateBusinessHours", null);
__decorate([
    (0, common_1.Get)(':businessId/hours'),
    __param(0, (0, common_1.Param)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BusinessController.prototype, "getBusinessHours", null);
__decorate([
    (0, common_1.Get)(':businessId/open-status'),
    __param(0, (0, common_1.Param)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BusinessController.prototype, "getBusinessOpenStatus", null);
__decorate([
    (0, common_1.Put)(':businessId/routing-code'),
    (0, common_1.UseGuards)(conditional_auth_guard_1.ConditionalAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('businessId')),
    __param(2, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], BusinessController.prototype, "setBusinessRoutingCode", null);
__decorate([
    (0, common_1.Get)('/routing-codes/statistics'),
    (0, common_1.UseGuards)(conditional_auth_guard_1.ConditionalAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BusinessController.prototype, "getCodeStatistics", null);
__decorate([
    (0, common_1.Get)(':businessId/whatsapp-qr'),
    (0, common_1.UseGuards)(conditional_auth_guard_1.ConditionalAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('businessId')),
    __param(2, (0, common_1.Query)('message')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], BusinessController.prototype, "generateWhatsAppQR", null);
__decorate([
    (0, common_1.Get)(':businessId/whatsapp-qr/variations'),
    (0, common_1.UseGuards)(conditional_auth_guard_1.ConditionalAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BusinessController.prototype, "getQRVariations", null);
__decorate([
    (0, common_1.Get)(':businessId/marketing-materials'),
    (0, common_1.UseGuards)(conditional_auth_guard_1.ConditionalAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BusinessController.prototype, "getMarketingMaterials", null);
exports.BusinessController = BusinessController = BusinessController_1 = __decorate([
    (0, common_1.Controller)('api/v1/businesses'),
    __metadata("design:paramtypes", [config_1.ConfigService,
        user_service_1.UserService,
        business_service_1.BusinessService,
        business_routing_service_1.BusinessRoutingService,
        qr_code_service_1.QRCodeService])
], BusinessController);
//# sourceMappingURL=business.controller.js.map