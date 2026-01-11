/**
 * Admin Business Management Routes
 * 
 * Routes for admin business operations including listing, details, status toggle, and plan changes.
 */

import { Router } from 'express';
import { adminBusinessController } from '../controllers/admin-business.controller';
import { adminPaymentController } from '../controllers/admin-payment.controller';
import { adminModuleController } from '../controllers/admin-module.controller';
import { adminAuthMiddleware, requireAdminRole } from '../middlewares/admin-auth.middleware';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

// All admin business routes require authentication
router.use(adminAuthMiddleware);

/**
 * GET /v1/admin/businesses
 * List all businesses with pagination, search, and filters
 * Requires: SUPPORT role or higher
 */
router.get('/', 
  requireAdminRole('SUPPORT'),
  asyncHandler(adminBusinessController.listBusinesses.bind(adminBusinessController))
);

/**
 * GET /v1/admin/businesses/:id
 * Get detailed business information with analytics
 * Requires: SUPPORT role or higher
 */
router.get('/:id', 
  requireAdminRole('SUPPORT'),
  asyncHandler(adminBusinessController.getBusinessDetails.bind(adminBusinessController))
);

/**
 * POST /v1/admin/businesses/:id/toggle
 * Toggle business active status (activate/deactivate)
 * Requires: ADMIN role or higher
 */
router.post('/:id/toggle', 
  requireAdminRole('ADMIN'),
  asyncHandler(adminBusinessController.toggleBusinessStatus.bind(adminBusinessController))
);

/**
 * PATCH /v1/admin/businesses/:id/plan
 * Change business subscription plan
 * Requires: ADMIN role or higher
 */
router.patch('/:id/plan', 
  requireAdminRole('ADMIN'),
  asyncHandler(adminBusinessController.changeSubscriptionPlan.bind(adminBusinessController))
);

/**
 * GET /v1/admin/businesses/:id/payments
 * Get payment history for a specific business
 * Requires: SUPPORT role or higher
 */
router.get('/:id/payments', 
  requireAdminRole('SUPPORT'),
  asyncHandler(adminPaymentController.getBusinessPayments.bind(adminPaymentController))
);

/**
 * GET /v1/admin/businesses/:id/modules
 * Get business module configurations
 * Requires: SUPPORT role or higher
 */
router.get('/:id/modules', 
  requireAdminRole('SUPPORT'),
  asyncHandler(adminModuleController.getBusinessModules.bind(adminModuleController))
);

/**
 * PATCH /v1/admin/businesses/:id/modules
 * Update business module configurations
 * Requires: ADMIN role or higher
 */
router.patch('/:id/modules', 
  requireAdminRole('ADMIN'),
  asyncHandler(adminModuleController.updateBusinessModules.bind(adminModuleController))
);

export { router as adminBusinessRoutes };