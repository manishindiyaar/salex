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
import { Request, Response, NextFunction } from 'express';
declare class ResourceController {
    /**
     * Create a new resource
     * POST /v1/businesses/:businessId/resources
     */
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Bulk create resources
     * POST /v1/businesses/:businessId/resources/bulk
     */
    createBulk(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * List resources for a business
     * GET /v1/businesses/:businessId/resources
     */
    list(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get a single resource
     * GET /v1/businesses/:businessId/resources/:id
     */
    getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update a resource
     * PATCH /v1/businesses/:businessId/resources/:id
     */
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Deactivate a resource
     * POST /v1/businesses/:businessId/resources/:id/deactivate
     */
    deactivate(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Reactivate a resource
     * POST /v1/businesses/:businessId/resources/:id/reactivate
     */
    reactivate(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const resourceController: ResourceController;
export {};
//# sourceMappingURL=resource.controller.d.ts.map