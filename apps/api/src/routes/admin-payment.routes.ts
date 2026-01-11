/**
 * Admin Payment Management Routes
 * 
 * Routes for admin payment operations including recording payments, listing, and analytics.
 */

import { Router } from 'express';
import { adminPaymentController } from '../controllers/admin-payment.controller';
import { adminAuthMiddleware, requireAdminRole } from '../middlewares/admin-auth.middleware';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

// All admin payment routes require authentication
router.use(adminAuthMiddleware);

/**
 * POST /v1/admin/payments
 * Record manual payment for a subscription
 * Requires: ADMIN role or higher
 */
router.post('/', 
  requireAdminRole('ADMIN'),
  asyncHandler(adminPaymentController.recordPayment.bind(adminPaymentController))
);

/**
 * GET /v1/admin/payments
 * List all payments with pagination and filters
 * Requires: SUPPORT role or higher
 */
router.get('/', 
  requireAdminRole('SUPPORT'),
  asyncHandler(adminPaymentController.listPayments.bind(adminPaymentController))
);

/**
 * GET /v1/admin/payments/analytics
 * Get payment analytics and revenue metrics
 * Requires: SUPPORT role or higher
 */
router.get('/analytics', 
  requireAdminRole('SUPPORT'),
  asyncHandler(adminPaymentController.getPaymentAnalytics.bind(adminPaymentController))
);

export { router as adminPaymentRoutes };