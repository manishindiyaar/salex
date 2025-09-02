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
var ServiceController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceController = void 0;
const common_1 = require("@nestjs/common");
const conditional_auth_guard_1 = require("../auth/conditional-auth.guard");
const service_service_1 = require("./service.service");
const create_service_dto_1 = require("./dto/create-service.dto");
const update_service_dto_1 = require("./dto/update-service.dto");
let ServiceController = ServiceController_1 = class ServiceController {
    constructor(serviceService) {
        this.serviceService = serviceService;
        this.logger = new common_1.Logger(ServiceController_1.name);
    }
    async createService(businessId, createServiceDto, req) {
        const ownerId = req.user.id;
        this.logger.debug(`Creating service for business: ${businessId}, user: ${ownerId}`);
        try {
            const service = await this.serviceService.createService(businessId, ownerId, createServiceDto);
            return {
                success: true,
                data: service,
                message: 'Service created successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to create service: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getBusinessServices(businessId, page, limit) {
        this.logger.debug(`Getting services for business: ${businessId} (public access)`);
        try {
            let pagination;
            if (page && limit) {
                const pageNum = parseInt(page, 10);
                const limitNum = parseInt(limit, 10);
                if (pageNum > 0 && limitNum > 0 && limitNum <= 100) {
                    pagination = { page: pageNum, limit: limitNum };
                }
            }
            const services = await this.serviceService.getBusinessServicesPublic(businessId, pagination);
            return {
                success: true,
                data: services,
                message: 'Services retrieved successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to get services: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getServiceById(businessId, serviceId) {
        this.logger.debug(`Getting service ${serviceId} for business: ${businessId} (public access)`);
        try {
            const service = await this.serviceService.getServiceByIdPublic(businessId, serviceId);
            return {
                success: true,
                data: service,
                message: 'Service retrieved successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to get service: ${error.message}`, error.stack);
            throw error;
        }
    }
    async updateService(businessId, serviceId, updateServiceDto, req) {
        const ownerId = req.user.id;
        this.logger.debug(`Updating service ${serviceId} for business: ${businessId}, user: ${ownerId}`);
        try {
            const service = await this.serviceService.updateService(businessId, serviceId, ownerId, updateServiceDto);
            return {
                success: true,
                data: service,
                message: 'Service updated successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to update service: ${error.message}`, error.stack);
            throw error;
        }
    }
    async deleteService(businessId, serviceId, req) {
        const ownerId = req.user.id;
        this.logger.debug(`Deleting service ${serviceId} for business: ${businessId}, user: ${ownerId}`);
        try {
            await this.serviceService.deleteService(businessId, serviceId, ownerId);
            return {
                success: true,
                data: null,
                message: 'Service deleted successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to delete service: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.ServiceController = ServiceController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(conditional_auth_guard_1.ConditionalAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_service_dto_1.CreateServiceDto, Object]),
    __metadata("design:returntype", Promise)
], ServiceController.prototype, "createService", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ServiceController.prototype, "getBusinessServices", null);
__decorate([
    (0, common_1.Get)(':serviceId'),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Param)('serviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ServiceController.prototype, "getServiceById", null);
__decorate([
    (0, common_1.Put)(':serviceId'),
    (0, common_1.UseGuards)(conditional_auth_guard_1.ConditionalAuthGuard),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Param)('serviceId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_service_dto_1.UpdateServiceDto, Object]),
    __metadata("design:returntype", Promise)
], ServiceController.prototype, "updateService", null);
__decorate([
    (0, common_1.Delete)(':serviceId'),
    (0, common_1.UseGuards)(conditional_auth_guard_1.ConditionalAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Param)('serviceId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ServiceController.prototype, "deleteService", null);
exports.ServiceController = ServiceController = ServiceController_1 = __decorate([
    (0, common_1.Controller)('api/v1/businesses/:businessId/services'),
    __metadata("design:paramtypes", [service_service_1.ServiceService])
], ServiceController);
//# sourceMappingURL=service.controller.js.map