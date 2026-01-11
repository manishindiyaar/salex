/**
 * Availability Controller
 *
 * HTTP handlers for availability and capacity endpoints.
 *
 * Endpoints:
 * - GET /v1/businesses/:businessId/availability - Check availability
 * - GET /v1/businesses/:businessId/capacity - Get capacity info
 */
import { Request, Response, NextFunction } from 'express';
declare class AvailabilityController {
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
    checkAvailability(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get capacity info for a business
     * GET /v1/businesses/:businessId/capacity
     */
    getCapacity(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get available resources for a time slot
     * GET /v1/businesses/:businessId/availability/resources
     */
    getAvailableResources(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get available staff for a time slot
     * GET /v1/businesses/:businessId/availability/staff
     */
    getAvailableStaff(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const availabilityController: AvailabilityController;
export {};
//# sourceMappingURL=availability.controller.d.ts.map