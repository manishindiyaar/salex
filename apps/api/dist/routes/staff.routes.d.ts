/**
 * Staff Routes
 *
 * Routes for staff management:
 * - POST /v1/businesses/:businessId/staff - Create staff
 * - GET /v1/businesses/:businessId/staff - List staff
 * - GET /v1/businesses/:businessId/staff/:id - Get staff
 * - PATCH /v1/businesses/:businessId/staff/:id - Update staff
 * - POST /v1/businesses/:businessId/staff/:id/deactivate - Deactivate
 * - POST /v1/businesses/:businessId/staff/:id/reactivate - Reactivate
 * - POST /v1/businesses/:businessId/staff/:id/link-resource - Link to resource
 * - DELETE /v1/businesses/:businessId/staff/:id/link-resource/:resourceId - Unlink
 * - GET /v1/businesses/:businessId/staff/:id/linked-resources - Get linked resources
 */
import { IRouter } from 'express';
declare const router: IRouter;
export default router;
//# sourceMappingURL=staff.routes.d.ts.map