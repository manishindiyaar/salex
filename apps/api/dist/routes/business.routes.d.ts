/**
 * Business Routes
 *
 * Routes for business management:
 * - POST /v1/businesses - Create business (protected)
 * - GET /v1/businesses/me - Get current user's business (protected)
 * - PATCH /v1/businesses/:id - Update business (protected)
 * - GET /v1/businesses/routing/:code - Get by routing code (public)
 */
import { IRouter } from 'express';
declare const router: IRouter;
export default router;
//# sourceMappingURL=business.routes.d.ts.map