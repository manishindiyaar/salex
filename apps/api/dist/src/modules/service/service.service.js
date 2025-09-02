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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma.service");
const service_response_dto_1 = require("./dto/service-response.dto");
const business_services_response_dto_1 = require("./dto/business-services-response.dto");
let ServiceService = class ServiceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createService(businessId, ownerId, createServiceDto) {
        await this.validateBusinessOwnership(businessId, ownerId);
        await this.checkDuplicateServiceName(businessId, createServiceDto.name);
        const service = await this.prisma.service.create({
            data: {
                ...createServiceDto,
                businessId,
            },
        });
        return service_response_dto_1.ServiceResponseDto.fromEntity(service);
    }
    async getBusinessServices(businessId, ownerId, pagination) {
        await this.validateBusinessOwnership(businessId, ownerId);
        const skip = pagination ? (pagination.page - 1) * pagination.limit : 0;
        const take = pagination?.limit;
        const services = await this.prisma.service.findMany({
            where: { businessId },
            skip,
            take,
            orderBy: { createdAt: 'desc' },
        });
        const summary = await this.calculateServiceSummary(businessId);
        let paginationInfo;
        if (pagination) {
            const total = await this.prisma.service.count({
                where: { businessId },
            });
            paginationInfo = {
                page: pagination.page,
                limit: pagination.limit,
                total,
                totalPages: Math.ceil(total / pagination.limit),
            };
        }
        return business_services_response_dto_1.BusinessServicesResponseDto.create(businessId, services, summary, paginationInfo);
    }
    async getServiceById(businessId, serviceId, ownerId) {
        const service = await this.validateServiceOwnership(businessId, serviceId, ownerId);
        return service_response_dto_1.ServiceResponseDto.fromEntity(service);
    }
    async getBusinessServicesPublic(businessId, pagination) {
        const business = await this.prisma.business.findUnique({
            where: { id: businessId },
            select: { id: true },
        });
        if (!business) {
            throw new common_1.NotFoundException('Business not found');
        }
        const skip = pagination ? (pagination.page - 1) * pagination.limit : 0;
        const take = pagination?.limit;
        const services = await this.prisma.service.findMany({
            where: { businessId },
            skip,
            take,
            orderBy: { createdAt: 'desc' },
        });
        const summary = await this.calculateServiceSummary(businessId);
        let paginationInfo;
        if (pagination) {
            const total = await this.prisma.service.count({
                where: { businessId },
            });
            paginationInfo = {
                page: pagination.page,
                limit: pagination.limit,
                total,
                totalPages: Math.ceil(total / pagination.limit),
            };
        }
        return business_services_response_dto_1.BusinessServicesResponseDto.create(businessId, services, summary, paginationInfo);
    }
    async getServiceByIdPublic(businessId, serviceId) {
        const business = await this.prisma.business.findUnique({
            where: { id: businessId },
            select: { id: true },
        });
        if (!business) {
            throw new common_1.NotFoundException('Business not found');
        }
        const service = await this.prisma.service.findFirst({
            where: { id: serviceId, businessId },
        });
        if (!service) {
            throw new common_1.NotFoundException('Service not found');
        }
        return service_response_dto_1.ServiceResponseDto.fromEntity(service);
    }
    async updateService(businessId, serviceId, ownerId, updateServiceDto) {
        await this.validateServiceOwnership(businessId, serviceId, ownerId);
        if (updateServiceDto.name) {
            await this.checkDuplicateServiceName(businessId, updateServiceDto.name, serviceId);
        }
        const service = await this.prisma.service.update({
            where: { id: serviceId },
            data: updateServiceDto,
        });
        return service_response_dto_1.ServiceResponseDto.fromEntity(service);
    }
    async deleteService(businessId, serviceId, ownerId) {
        await this.validateServiceOwnership(businessId, serviceId, ownerId);
        const hasBookings = await this.checkServiceBookings(serviceId);
        if (hasBookings) {
            throw new common_1.ConflictException('Cannot delete service with existing bookings');
        }
        await this.prisma.service.delete({
            where: { id: serviceId },
        });
    }
    async validateBusinessOwnership(businessId, ownerId) {
        const business = await this.prisma.business.findFirst({
            where: { id: businessId, ownerId },
        });
        if (!business) {
            throw new common_1.ForbiddenException('Access denied: Business not found or not owned by user');
        }
    }
    async validateServiceOwnership(businessId, serviceId, ownerId) {
        await this.validateBusinessOwnership(businessId, ownerId);
        const service = await this.prisma.service.findFirst({
            where: { id: serviceId, businessId },
        });
        if (!service) {
            throw new common_1.NotFoundException('Service not found');
        }
        return service;
    }
    async checkDuplicateServiceName(businessId, name, excludeServiceId) {
        const whereCondition = {
            businessId,
            name: {
                equals: name,
                mode: 'insensitive',
            },
        };
        if (excludeServiceId) {
            whereCondition.id = { not: excludeServiceId };
        }
        const existingService = await this.prisma.service.findFirst({
            where: whereCondition,
        });
        if (existingService) {
            throw new common_1.ConflictException('A service with this name already exists for this business');
        }
    }
    async checkServiceBookings(serviceId) {
        const bookingCount = await this.prisma.booking.count({
            where: {
                serviceId,
                status: {
                    in: ['PENDING', 'CONFIRMED'],
                },
            },
        });
        return bookingCount > 0;
    }
    async calculateServiceSummary(businessId) {
        const services = await this.prisma.service.findMany({
            where: { businessId },
            select: {
                price: true,
                durationMinutes: true,
            },
        });
        if (services.length === 0) {
            return {
                totalServices: 0,
                averagePrice: 0,
                totalPotentialRevenue: 0,
                shortestService: 0,
                longestService: 0,
            };
        }
        const prices = services.map(s => parseFloat(s.price.toString()));
        const durations = services.map(s => s.durationMinutes);
        return {
            totalServices: services.length,
            averagePrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
            totalPotentialRevenue: prices.reduce((sum, price) => sum + price, 0),
            shortestService: Math.min(...durations),
            longestService: Math.max(...durations),
        };
    }
};
exports.ServiceService = ServiceService;
exports.ServiceService = ServiceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ServiceService);
//# sourceMappingURL=service.service.js.map