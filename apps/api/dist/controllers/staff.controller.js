"use strict";
/**
 * Staff Controller
 *
 * HTTP handlers for staff management endpoints.
 *
 * Endpoints:
 * - POST /v1/businesses/:businessId/staff - Create staff
 * - GET /v1/businesses/:businessId/staff - List staff
 * - GET /v1/businesses/:businessId/staff/:id - Get staff
 * - PATCH /v1/businesses/:businessId/staff/:id - Update staff
 * - POST /v1/businesses/:businessId/staff/:id/deactivate - Deactivate staff
 * - POST /v1/businesses/:businessId/staff/:id/reactivate - Reactivate staff
 * - POST /v1/businesses/:businessId/staff/:id/link-resource - Link to resource
 * - DELETE /v1/businesses/:businessId/staff/:id/link-resource/:resourceId - Unlink
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffController = void 0;
const staff_service_1 = require("../services/staff.service");
const shared_types_1 = require("@salex/shared-types");
const logger_1 = require("../utils/logger");
class StaffController {
    /**
     * Create a new staff member
     * POST /v1/businesses/:businessId/staff
     */
    async create(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { businessId } = req.params;
            logger_1.logger.info({ userId, businessId }, 'Staff creation request');
            const data = shared_types_1.createStaffSchema.parse(req.body);
            const staff = await staff_service_1.staffService.create(businessId, userId, data);
            res.status(201).json({
                success: true,
                data: { staff },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * List staff for a business
     * GET /v1/businesses/:businessId/staff
     */
    async list(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { businessId } = req.params;
            const includeInactive = req.query.includeInactive === 'true';
            const staff = await staff_service_1.staffService.list(businessId, userId, includeInactive);
            res.json({
                success: true,
                data: { staff },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get a single staff member
     * GET /v1/businesses/:businessId/staff/:id
     */
    async getById(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { businessId, id } = req.params;
            const staff = await staff_service_1.staffService.getById(id, businessId, userId);
            res.json({
                success: true,
                data: { staff },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update a staff member
     * PATCH /v1/businesses/:businessId/staff/:id
     */
    async update(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { businessId, id } = req.params;
            logger_1.logger.info({ userId, businessId, staffId: id }, 'Staff update request');
            const data = shared_types_1.updateStaffSchema.parse(req.body);
            const staff = await staff_service_1.staffService.update(id, businessId, userId, data);
            res.json({
                success: true,
                data: { staff },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Deactivate a staff member
     * POST /v1/businesses/:businessId/staff/:id/deactivate
     */
    async deactivate(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { businessId, id } = req.params;
            logger_1.logger.info({ userId, businessId, staffId: id }, 'Staff deactivation request');
            const staff = await staff_service_1.staffService.deactivate(id, businessId, userId);
            res.json({
                success: true,
                data: { staff },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Reactivate a staff member
     * POST /v1/businesses/:businessId/staff/:id/reactivate
     */
    async reactivate(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { businessId, id } = req.params;
            logger_1.logger.info({ userId, businessId, staffId: id }, 'Staff reactivation request');
            const staff = await staff_service_1.staffService.reactivate(id, businessId, userId);
            res.json({
                success: true,
                data: { staff },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Link staff to a resource
     * POST /v1/businesses/:businessId/staff/:id/link-resource
     */
    async linkResource(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { businessId, id } = req.params;
            logger_1.logger.info({ userId, businessId, staffId: id }, 'Staff link resource request');
            const data = shared_types_1.linkResourceSchema.parse(req.body);
            const link = await staff_service_1.staffService.linkToResource(id, businessId, userId, data);
            res.status(201).json({
                success: true,
                data: { link },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Unlink staff from a resource
     * DELETE /v1/businesses/:businessId/staff/:id/link-resource/:resourceId
     */
    async unlinkResource(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { businessId, id, resourceId } = req.params;
            logger_1.logger.info({ userId, businessId, staffId: id, resourceId }, 'Staff unlink resource request');
            await staff_service_1.staffService.unlinkFromResource(id, resourceId, businessId, userId);
            res.json({
                success: true,
                data: { message: 'Resource unlinked successfully' },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get linked resources for a staff member
     * GET /v1/businesses/:businessId/staff/:id/linked-resources
     */
    async getLinkedResources(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { businessId, id } = req.params;
            const linkedResources = await staff_service_1.staffService.getLinkedResources(id, businessId, userId);
            res.json({
                success: true,
                data: { linkedResources },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.staffController = new StaffController();
//# sourceMappingURL=staff.controller.js.map