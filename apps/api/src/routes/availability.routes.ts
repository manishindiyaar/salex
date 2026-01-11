/**
 * Availability Routes
 * 
 * Routes for availability and capacity:
 * - GET /v1/businesses/:businessId/availability - Check availability
 * - GET /v1/businesses/:businessId/availability/resources - Available resources
 * - GET /v1/businesses/:businessId/availability/staff - Available staff
 * - GET /v1/businesses/:businessId/capacity - Get capacity info
 */

import { Router, IRouter } from 'express';
import { availabilityController } from '../controllers/availability.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router: IRouter = Router({ mergeParams: true });

// All routes require authentication
router.use(authMiddleware);

// Availability endpoints
router.get('/', availabilityController.checkAvailability);
router.get('/resources', availabilityController.getAvailableResources);
router.get('/staff', availabilityController.getAvailableStaff);

export default router;
