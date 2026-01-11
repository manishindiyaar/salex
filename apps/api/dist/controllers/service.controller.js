"use strict";
/**
 * Service Controller
 *
 * HTTP handlers for service catalog endpoints.
 *
 * Endpoints:
 * - POST /v1/businesses/:businessId/services - Create service
 * - GET /v1/businesses/:businessId/services - List services
 * - PATCH /v1/services/:id - Update service
 * - DELETE /v1/services/:id - Soft delete service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceController = void 0;
const service_service_1 = require("../services/service.service");
const shared_types_1 = require("@salex/shared-types");
const logger_1 = require("../utils/logger");
class ServiceController {
    /**
     * Create a new service
     * POST /v1/businesses/:businessId/services
     */
    async create(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { businessId } = req.params;
            logger_1.logger.info({ userId, businessId }, 'Service creation request');
            // Validate input
            const data = shared_types_1.createServiceSchema.parse(req.body);
            // Create service
            const service = await service_service_1.serviceService.create(businessId, userId, data);
            res.status(201).json({
                success: true,
                data: {
                    service: {
                        id: service.id,
                        businessId: service.businessId,
                        name: service.name,
                        description: service.description,
                        price: service.price,
                        durationMinutes: service.durationMinutes,
                        isActive: service.isActive,
                        createdAt: service.createdAt,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * List services for a business
     * GET /v1/businesses/:businessId/services
     */
    async list(req, res, next) {
        try {
            const { businessId } = req.params;
            const includeInactive = req.query.includeInactive === 'true';
            const services = await service_service_1.serviceService.listByBusinessId(businessId, includeInactive);
            res.json({
                success: true,
                data: {
                    services: services.map(service => ({
                        id: service.id,
                        businessId: service.businessId,
                        name: service.name,
                        description: service.description,
                        price: service.price,
                        durationMinutes: service.durationMinutes,
                        isActive: service.isActive,
                        createdAt: service.createdAt,
                        updatedAt: service.updatedAt,
                    })),
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get a single service
     * GET /v1/services/:id
     */
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const service = await service_service_1.serviceService.getById(id);
            res.json({
                success: true,
                data: {
                    service: {
                        id: service.id,
                        businessId: service.businessId,
                        name: service.name,
                        description: service.description,
                        price: service.price,
                        durationMinutes: service.durationMinutes,
                        isActive: service.isActive,
                        createdAt: service.createdAt,
                        updatedAt: service.updatedAt,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update a service
     * PATCH /v1/services/:id
     */
    async update(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { id } = req.params;
            logger_1.logger.info({ userId, serviceId: id }, 'Service update request');
            // Validate input
            const data = shared_types_1.updateServiceSchema.parse(req.body);
            // Update service
            const service = await service_service_1.serviceService.update(id, userId, data);
            res.json({
                success: true,
                data: {
                    service: {
                        id: service.id,
                        businessId: service.businessId,
                        name: service.name,
                        description: service.description,
                        price: service.price,
                        durationMinutes: service.durationMinutes,
                        isActive: service.isActive,
                        updatedAt: service.updatedAt,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Soft delete a service (set isActive = false)
     * DELETE /v1/services/:id
     */
    async delete(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { id } = req.params;
            logger_1.logger.info({ userId, serviceId: id }, 'Service delete request');
            await service_service_1.serviceService.softDelete(id, userId);
            res.json({
                success: true,
                data: {
                    message: 'Service deleted successfully',
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.serviceController = new ServiceController();
//# sourceMappingURL=service.controller.js.map