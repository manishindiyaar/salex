/**
 * Admin Business Management Controller
 *
 * Handles admin operations for business management including:
 * - Listing and searching businesses
 * - Viewing business details with analytics
 * - Toggling business active status
 * - Changing subscription plans
 */
import { Response } from 'express';
import { AdminRequest } from '../middlewares/admin-auth.middleware';
declare class AdminBusinessController {
    /**
     * GET /v1/admin/businesses
     * List all businesses with pagination, search, and filters
     */
    listBusinesses(req: AdminRequest, res: Response): Promise<void>;
    /**
     * GET /v1/admin/businesses/:id
     * Get detailed business information with analytics
     */
    getBusinessDetails(req: AdminRequest, res: Response): Promise<void>;
    /**
     * POST /v1/admin/businesses/:id/toggle
     * Toggle business active status
     */
    toggleBusinessStatus(req: AdminRequest, res: Response): Promise<void>;
    /**
     * PATCH /v1/admin/businesses/:id/plan
     * Change business subscription plan
     */
    changeSubscriptionPlan(req: AdminRequest, res: Response): Promise<void>;
    /**
     * Calculate business analytics
     */
    private calculateBusinessAnalytics;
}
export declare const adminBusinessController: AdminBusinessController;
export {};
//# sourceMappingURL=admin-business.controller.d.ts.map