/**
 * Business Controller
 *
 * HTTP handlers for business management endpoints.
 *
 * Endpoints:
 * - POST /v1/businesses - Create business (protected)
 * - GET /v1/businesses/me - Get current user's business (protected)
 * - PATCH /v1/businesses/:id - Update business (protected)
 * - GET /v1/businesses/routing/:code - Get by routing code (public)
 */
import { Request, Response, NextFunction } from 'express';
declare class BusinessController {
    /**
     * Create a new business
     * POST /v1/businesses
     */
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get current user's business
     * GET /v1/businesses/me
     */
    getMyBusiness(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update business
     * PATCH /v1/businesses/:id
     */
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get business by routing code (public - for WhatsApp bot)
     * GET /v1/businesses/routing/:code
     */
    getByRoutingCode(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const businessController: BusinessController;
export {};
//# sourceMappingURL=business.controller.d.ts.map