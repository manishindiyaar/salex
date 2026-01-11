/**
 * Resource Routes
 *
 * Routes for resource management:
 * - POST /v1/businesses/:businessId/resources - Create resource
 * - POST /v1/businesses/:businessId/resources/bulk - Bulk create resources
 * - GET /v1/businesses/:businessId/resources - List resources
 * - GET /v1/businesses/:businessId/resources/:id - Get resource
 * - PATCH /v1/businesses/:businessId/resources/:id - Update resource
 * - POST /v1/businesses/:businessId/resources/:id/deactivate - Deactivate
 * - POST /v1/businesses/:businessId/resources/:id/reactivate - Reactivate
 */
import { IRouter } from 'express';
declare const router: IRouter;
export default router;
//# sourceMappingURL=resource.routes.d.ts.map