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
import { Request, Response, NextFunction } from 'express';
declare class ServiceController {
    /**
     * Create a new service
     * POST /v1/businesses/:businessId/services
     */
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * List services for a business
     * GET /v1/businesses/:businessId/services
     */
    list(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get a single service
     * GET /v1/services/:id
     */
    getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update a service
     * PATCH /v1/services/:id
     */
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Soft delete a service (set isActive = false)
     * DELETE /v1/services/:id
     */
    delete(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const serviceController: ServiceController;
export {};
//# sourceMappingURL=service.controller.d.ts.map