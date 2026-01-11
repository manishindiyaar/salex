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
import { Request, Response, NextFunction } from 'express';
declare class StaffController {
    /**
     * Create a new staff member
     * POST /v1/businesses/:businessId/staff
     */
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * List staff for a business
     * GET /v1/businesses/:businessId/staff
     */
    list(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get a single staff member
     * GET /v1/businesses/:businessId/staff/:id
     */
    getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update a staff member
     * PATCH /v1/businesses/:businessId/staff/:id
     */
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Deactivate a staff member
     * POST /v1/businesses/:businessId/staff/:id/deactivate
     */
    deactivate(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Reactivate a staff member
     * POST /v1/businesses/:businessId/staff/:id/reactivate
     */
    reactivate(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Link staff to a resource
     * POST /v1/businesses/:businessId/staff/:id/link-resource
     */
    linkResource(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Unlink staff from a resource
     * DELETE /v1/businesses/:businessId/staff/:id/link-resource/:resourceId
     */
    unlinkResource(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get linked resources for a staff member
     * GET /v1/businesses/:businessId/staff/:id/linked-resources
     */
    getLinkedResources(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const staffController: StaffController;
export {};
//# sourceMappingURL=staff.controller.d.ts.map