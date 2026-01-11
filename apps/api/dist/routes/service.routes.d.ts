/**
 * Service Routes
 *
 * Routes for service catalog management:
 * - POST /v1/businesses/:businessId/services - Create service (protected)
 * - GET /v1/businesses/:businessId/services - List services (protected)
 * - GET /v1/services/:id - Get single service (protected)
 * - PATCH /v1/services/:id - Update service (protected)
 * - DELETE /v1/services/:id - Soft delete service (protected)
 */
import { IRouter } from 'express';
export declare const businessServiceRoutes: IRouter;
export declare const serviceRoutes: IRouter;
export default serviceRoutes;
//# sourceMappingURL=service.routes.d.ts.map