/**
 * Business Routes
 * 
 * Routes for business management:
 * - POST /v1/businesses - Create business (protected)
 * - GET /v1/businesses/me - Get current user's business (protected)
 * - PATCH /v1/businesses/:id - Update business (protected)
 * - GET /v1/businesses/routing/:code - Get by routing code (public)
 */

import { Router, IRouter } from 'express';
import { businessController } from '../controllers/business.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router: IRouter = Router();

// Public route - WhatsApp bot uses this to look up businesses
router.get('/routing/:code', businessController.getByRoutingCode);

// Protected routes - require authentication
router.post('/', authMiddleware, businessController.create);
router.get('/me', authMiddleware, businessController.getMyBusiness);
router.patch('/:id', authMiddleware, businessController.update);

export default router;
