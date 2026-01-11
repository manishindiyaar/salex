/**
 * Admin Module Management Controller
 *
 * Handles admin operations for business module configuration including:
 * - Getting business module configurations
 * - Updating module enablement for businesses
 * - Logging module changes for audit
 */
import { Response } from 'express';
import { AdminRequest } from '../middlewares/admin-auth.middleware';
declare class AdminModuleController {
    /**
     * GET /v1/admin/businesses/:id/modules
     * Get business module configurations
     */
    getBusinessModules(req: AdminRequest, res: Response): Promise<void>;
    /**
     * PATCH /v1/admin/businesses/:id/modules
     * Update business module configurations
     */
    updateBusinessModules(req: AdminRequest, res: Response): Promise<void>;
    /**
     * GET /v1/admin/modules
     * Get all available feature modules
     */
    getAllModules(req: AdminRequest, res: Response): Promise<void>;
    /**
     * GET /v1/admin/modules/:code/businesses
     * Get businesses that have a specific module enabled
     */
    getModuleBusinesses(req: AdminRequest, res: Response): Promise<void>;
}
export declare const adminModuleController: AdminModuleController;
export {};
//# sourceMappingURL=admin-module.controller.d.ts.map