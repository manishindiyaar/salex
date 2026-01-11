"use strict";
/**
 * Availability Controller
 *
 * HTTP handlers for availability and capacity endpoints.
 *
 * Endpoints:
 * - GET /v1/businesses/:businessId/availability - Check availability
 * - GET /v1/businesses/:businessId/capacity - Get capacity info
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.availabilityController = void 0;
const availability_service_1 = require("../services/availability.service");
class AvailabilityController {
    /**
     * Check availability for a time slot
     * GET /v1/businesses/:businessId/availability
     *
     * Query params:
     * - scheduledAt: ISO datetime string
     * - endAt: ISO datetime string (optional)
     * - durationMinutes: number (optional, used if endAt not provided)
     * - resourceId: string (optional, filter by specific resource)
     * - staffId: string (optional, filter by specific staff)
     * - preferredStaffId: string (optional, customer preference)
     */
    async checkAvailability(req, res, next) {
        try {
            const { businessId } = req.params;
            const { scheduledAt, endAt, durationMinutes, resourceId, staffId, preferredStaffId } = req.query;
            if (!scheduledAt) {
                res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'scheduledAt is required' },
                });
                return;
            }
            const requestedStart = new Date(scheduledAt);
            let requestedEnd;
            if (endAt) {
                requestedEnd = new Date(endAt);
            }
            else if (durationMinutes) {
                requestedEnd = availability_service_1.availabilityService.calculateEndTime(requestedStart, parseInt(durationMinutes, 10));
            }
            else {
                // Default to 30 minutes
                requestedEnd = availability_service_1.availabilityService.calculateEndTime(requestedStart, 30);
            }
            const availability = await availability_service_1.availabilityService.getAvailabilityWithSuggestions(businessId, requestedStart, requestedEnd, preferredStaffId);
            // Filter by specific resource if requested
            if (resourceId) {
                availability.availableResources = availability.availableResources.filter(r => r.id === resourceId);
            }
            // Filter by specific staff if requested
            if (staffId) {
                availability.availableStaff = availability.availableStaff.filter(s => s.id === staffId);
            }
            res.json({
                success: true,
                data: availability,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get capacity info for a business
     * GET /v1/businesses/:businessId/capacity
     */
    async getCapacity(req, res, next) {
        try {
            const { businessId } = req.params;
            const capacity = await availability_service_1.availabilityService.getEffectiveCapacity(businessId);
            res.json({
                success: true,
                data: capacity,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get available resources for a time slot
     * GET /v1/businesses/:businessId/availability/resources
     */
    async getAvailableResources(req, res, next) {
        try {
            const { businessId } = req.params;
            const { scheduledAt, endAt, durationMinutes } = req.query;
            if (!scheduledAt) {
                res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'scheduledAt is required' },
                });
                return;
            }
            const requestedStart = new Date(scheduledAt);
            let requestedEnd;
            if (endAt) {
                requestedEnd = new Date(endAt);
            }
            else if (durationMinutes) {
                requestedEnd = availability_service_1.availabilityService.calculateEndTime(requestedStart, parseInt(durationMinutes, 10));
            }
            else {
                requestedEnd = availability_service_1.availabilityService.calculateEndTime(requestedStart, 30);
            }
            const resources = await availability_service_1.availabilityService.getAvailableResources(businessId, requestedStart, requestedEnd);
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
     * Get available staff for a time slot
     * GET /v1/businesses/:businessId/availability/staff
     */
    async getAvailableStaff(req, res, next) {
        try {
            const { businessId } = req.params;
            const { scheduledAt, endAt, durationMinutes } = req.query;
            if (!scheduledAt) {
                res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'scheduledAt is required' },
                });
                return;
            }
            const requestedStart = new Date(scheduledAt);
            let requestedEnd;
            if (endAt) {
                requestedEnd = new Date(endAt);
            }
            else if (durationMinutes) {
                requestedEnd = availability_service_1.availabilityService.calculateEndTime(requestedStart, parseInt(durationMinutes, 10));
            }
            else {
                requestedEnd = availability_service_1.availabilityService.calculateEndTime(requestedStart, 30);
            }
            const staff = await availability_service_1.availabilityService.getAvailableStaff(businessId, requestedStart, requestedEnd);
            res.json({
                success: true,
                data: { staff },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.availabilityController = new AvailabilityController();
//# sourceMappingURL=availability.controller.js.map