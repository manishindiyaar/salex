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

import { Router, IRouter } from 'express';
import { resourceController } from '../controllers/resource.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router: IRouter = Router({ mergeParams: true });

// All routes require authentication
router.use(authMiddleware);

// Resource CRUD
router.post('/', resourceController.create);
router.post('/bulk', resourceController.createBulk);
router.get('/', resourceController.list);
router.get('/:id', resourceController.getById);
router.patch('/:id', resourceController.update);

// Activation management
router.post('/:id/deactivate', resourceController.deactivate);
router.post('/:id/reactivate', resourceController.reactivate);

export default router;
