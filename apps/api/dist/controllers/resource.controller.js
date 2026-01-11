"use strict";
/**
 * Resource Controller
 *
 * HTTP handlers for resource management endpoints.
 *
 * Endpoints:
 * - POST /v1/businesses/:businessId/resources - Create resource
 * - POST /v1/businesses/:businessId/resources/bulk - Bulk create resources
 * - GET /v1/businesses/:businessId/resources - List resources
 * - GET /v1/businesses/:businessId/resources/:id - Get resource
 * - PATCH /v1/businesses/:businessId/resources/:id - Update resource
 * - POST /v1/businesses/:businessId/resources/:id/deactivate - Deactivate resource
 * - POST /v1/businesses/:businessId/resources/:id/reactivate - Reactivate resource
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resourceController = void 0;
const resource_service_1 = require("../services/resource.service");
const shared_types_1 = require("@salex/shared-types");
const logger_1 = require("../utils/logger");
class ResourceController {
    /**
     * Create a new resource
     * POST /v1/businesses/:businessId/resources
     */
    async create(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { businessId } = req.params;
            logger_1.logger.info({ userId, businessId }, 'Resource creation request');
            const data = shared_types_1.createResourceSchema.parse(req.body);
            const resource = await resource_service_1.resourceService.create(businessId, userId, data);
            res.status(201).json({
                success: true,
                data: { resource },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Bulk create resources
     * POST /v1/businesses/:businessId/resources/bulk
     */
    async createBulk(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { businessId } = req.params;
            logger_1.logger.info({ userId, businessId }, 'Bulk resource creation request');
            const data = shared_types_1.bulkCreateResourceSchema.parse(req.body);
            const resources = await resource_service_1.resourceService.createBulk(businessId, userId, data);
            res.status(201).json({
                success: true,
                data: { resources },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * List resources for a business
     * GET /v1/businesses/:businessId/resources
     */
    async list(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { businessId } = req.params;
            const includeInactive = req.query.includeInactive === 'true';
            const resources = await resource_service_1.resourceService.list(businessId, userId, includeInactive);
            res.json({
                success: true,
                data: { resources },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get a single resource
     * GET /v1/businesses/:businessId/resources/:id
     */
    async getById(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { businessId, id } = req.params;
            const resource = await resource_service_1.resourceService.getById(id, businessId, userId);
            res.json({
                success: true,
                data: { resource },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update a resource
     * PATCH /v1/businesses/:businessId/resources/:id
     */
    async update(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { businessId, id } = req.params;
            logger_1.logger.info({ userId, businessId, resourceId: id }, 'Resource update request');
            const data = shared_types_1.updateResourceSchema.parse(req.body);
            const resource = await resource_service_1.resourceService.update(id, businessId, userId, data);
            res.json({
                success: true,
                data: { resource },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Deactivate a resource
     * POST /v1/businesses/:businessId/resources/:id/deactivate
     */
    async deactivate(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { businessId, id } = req.params;
            logger_1.logger.info({ userId, businessId, resourceId: id }, 'Resource deactivation request');
            const resource = await resource_service_1.resourceService.deactivate(id, businessId, userId);
            res.json({
                success: true,
                data: { resource },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Reactivate a resource
     * POST /v1/businesses/:businessId/resources/:id/reactivate
     */
    async reactivate(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { businessId, id } = req.params;
            logger_1.logger.info({ userId, businessId, resourceId: id }, 'Resource reactivation request');
            const resource = await resource_service_1.resourceService.reactivate(id, businessId, userId);
            res.json({
                success: true,
                data: { resource },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.resourceController = new ResourceController();
//# sourceMappingURL=resource.controller.js.map