/**
 * Admin Template Management Controller
 *
 * Handles admin operations for niche template management including:
 * - Listing all templates
 * - Getting template details
 * - Creating new templates
 * - Updating existing templates
 * - Deleting templates
 */
import { Response } from 'express';
import { AdminRequest } from '../middlewares/admin-auth.middleware';
declare class AdminTemplateController {
    /**
     * GET /v1/admin/templates
     * List all niche templates
     */
    listTemplates(req: AdminRequest, res: Response): Promise<void>;
    /**
     * GET /v1/admin/templates/:code
     * Get template by code
     */
    getTemplate(req: AdminRequest, res: Response): Promise<void>;
    /**
     * POST /v1/admin/templates
     * Create new template
     */
    createTemplate(req: AdminRequest, res: Response): Promise<void>;
    /**
     * PATCH /v1/admin/templates/:code
     * Update template
     */
    updateTemplate(req: AdminRequest, res: Response): Promise<void>;
    /**
     * DELETE /v1/admin/templates/:code
     * Delete template (soft delete)
     */
    deleteTemplate(req: AdminRequest, res: Response): Promise<void>;
    /**
     * GET /v1/admin/templates/stats
     * Get template usage statistics
     */
    getTemplateStats(req: AdminRequest, res: Response): Promise<void>;
}
export declare const adminTemplateController: AdminTemplateController;
export {};
//# sourceMappingURL=admin-template.controller.d.ts.map