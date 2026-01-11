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

import { Router, IRouter } from 'express';
import { staffController } from '../controllers/staff.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router: IRouter = Router({ mergeParams: true });

// All routes require authentication
router.use(authMiddleware);

// Staff CRUD
router.post('/', staffController.create);
router.get('/', staffController.list);
router.get('/:id', staffController.getById);
router.patch('/:id', staffController.update);

// Activation management
router.post('/:id/deactivate', staffController.deactivate);
router.post('/:id/reactivate', staffController.reactivate);

// Resource linking
router.post('/:id/link-resource', staffController.linkResource);
router.delete('/:id/link-resource/:resourceId', staffController.unlinkResource);
router.get('/:id/linked-resources', staffController.getLinkedResources);

export default router;
