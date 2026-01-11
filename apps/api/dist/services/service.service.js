"use strict";
/**
 * Service Catalog Service
 *
 * Handles CRUD operations for services offered by businesses.
 *
 * Key features:
 * - Create services with business ownership validation
 * - List services with active/inactive filter
 * - Soft delete (set isActive = false)
 * - Deletion protection (check for active bookings)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceService = void 0;
const shared_types_1 = require("@salex/shared-types");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class ServiceService {
    /**
     * Create a new service for a business
     * Validates that the user owns the business
     */
    async create(businessId, ownerId, data) {
        // Verify business ownership
        const business = await shared_types_1.prisma.business.findUnique({
            where: { id: businessId },
        });
        if (!business) {
            throw new errors_1.NotFoundError('Business not found');
        }
        if (business.ownerId !== ownerId) {
            throw new errors_1.BusinessRuleError('You can only add services to your own business');
        }
        // Check for duplicate service name in this business
        const existingService = await shared_types_1.prisma.service.findUnique({
            where: {
                businessId_name: {
                    businessId,
                    name: data.name,
                },
            },
        });
        if (existingService) {
            throw new errors_1.ConflictError(`Service "${data.name}" already exists in this business`);
        }
        const service = await shared_types_1.prisma.service.create({
            data: {
                businessId,
                name: data.name,
                description: data.description || null,
                price: data.price,
                durationMinutes: data.durationMinutes ?? 30,
                isActive: data.isActive ?? true,
            },
        });
        logger_1.logger.info({ serviceId: service.id, businessId }, 'Service created');
        return service;
    }
    /**
     * Get all services for a business
     * Optionally include inactive services
     */
    async listByBusinessId(businessId, includeInactive = false) {
        const services = await shared_types_1.prisma.service.findMany({
            where: {
                businessId,
                ...(includeInactive ? {} : { isActive: true }),
            },
            orderBy: { name: 'asc' },
        });
        return services;
    }
    /**
     * Get a single service by ID
     */
    async getById(id) {
        const service = await shared_types_1.prisma.service.findUnique({
            where: { id },
        });
        if (!service) {
            throw new errors_1.NotFoundError('Service not found');
        }
        return service;
    }
    /**
     * Update a service
     * Validates ownership through business
     */
    async update(id, ownerId, data) {
        // Get service with business
        const service = await shared_types_1.prisma.service.findUnique({
            where: { id },
            include: { business: true },
        });
        if (!service) {
            throw new errors_1.NotFoundError('Service not found');
        }
        if (service.business.ownerId !== ownerId) {
            throw new errors_1.BusinessRuleError('You can only update services in your own business');
        }
        // Check for duplicate name if name is being changed
        if (data.name && data.name !== service.name) {
            const existingService = await shared_types_1.prisma.service.findUnique({
                where: {
                    businessId_name: {
                        businessId: service.businessId,
                        name: data.name,
                    },
                },
            });
            if (existingService) {
                throw new errors_1.ConflictError(`Service "${data.name}" already exists in this business`);
            }
        }
        const updated = await shared_types_1.prisma.service.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.price !== undefined && { price: data.price }),
                ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        });
        logger_1.logger.info({ serviceId: id }, 'Service updated');
        return updated;
    }
    /**
     * Soft delete a service (set isActive = false)
     * Checks for active bookings before deletion
     */
    async softDelete(id, ownerId) {
        // Get service with business
        const service = await shared_types_1.prisma.service.findUnique({
            where: { id },
            include: { business: true },
        });
        if (!service) {
            throw new errors_1.NotFoundError('Service not found');
        }
        if (service.business.ownerId !== ownerId) {
            throw new errors_1.BusinessRuleError('You can only delete services in your own business');
        }
        // Check for active bookings using this service
        const activeBookings = await shared_types_1.prisma.bookingItem.count({
            where: {
                serviceId: id,
                booking: {
                    status: {
                        in: ['PENDING', 'CONFIRMED'],
                    },
                },
            },
        });
        if (activeBookings > 0) {
            throw new errors_1.BusinessRuleError(`Cannot delete service with ${activeBookings} active booking(s). ` +
                'Complete or cancel the bookings first.');
        }
        // Soft delete - set isActive to false
        const deleted = await shared_types_1.prisma.service.update({
            where: { id },
            data: { isActive: false },
        });
        logger_1.logger.info({ serviceId: id }, 'Service soft deleted');
        return deleted;
    }
    /**
     * Hard delete a service (permanent)
     * Only allowed if no bookings reference this service
     */
    async hardDelete(id, ownerId) {
        // Get service with business
        const service = await shared_types_1.prisma.service.findUnique({
            where: { id },
            include: { business: true },
        });
        if (!service) {
            throw new errors_1.NotFoundError('Service not found');
        }
        if (service.business.ownerId !== ownerId) {
            throw new errors_1.BusinessRuleError('You can only delete services in your own business');
        }
        // Check for any bookings (including completed) using this service
        const anyBookings = await shared_types_1.prisma.bookingItem.count({
            where: { serviceId: id },
        });
        if (anyBookings > 0) {
            throw new errors_1.BusinessRuleError('Cannot permanently delete service with booking history. Use soft delete instead.');
        }
        await shared_types_1.prisma.service.delete({
            where: { id },
        });
        logger_1.logger.info({ serviceId: id }, 'Service permanently deleted');
    }
}
exports.serviceService = new ServiceService();
//# sourceMappingURL=service.service.js.map