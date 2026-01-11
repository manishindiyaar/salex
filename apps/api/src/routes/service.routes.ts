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

import { Router, IRouter } from 'express';
import { serviceController } from '../controllers/service.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

// Routes under /v1/businesses/:businessId/services
export const businessServiceRoutes: IRouter = Router({ mergeParams: true });

businessServiceRoutes.post('/', authMiddleware, serviceController.create);
businessServiceRoutes.get('/', authMiddleware, serviceController.list);

// Routes under /v1/services
export const serviceRoutes: IRouter = Router();

serviceRoutes.get('/:id', authMiddleware, serviceController.getById);
serviceRoutes.patch('/:id', authMiddleware, serviceController.update);
serviceRoutes.delete('/:id', authMiddleware, serviceController.delete);

export default serviceRoutes;
