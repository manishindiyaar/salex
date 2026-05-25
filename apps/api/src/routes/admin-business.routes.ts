/**
 * Admin Business Management Routes
 * 
 * Routes for admin business operations including listing, details, status toggle, and plan changes.
 */

import { Router } from 'express';
import { adminBusinessController } from '../controllers/admin-business.controller';
import { adminPaymentController } from '../controllers/admin-payment.controller';
import { adminAuthMiddleware, requireAdminRole } from '../middlewares/admin-auth.middleware';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

// All admin business routes require authentication
router.use(adminAuthMiddleware);

/**
 * GET /v1/admin/businesses
 * List all businesses with pagination, search, and filters
 * Requires: ADMIN role or higher
 */
router.get('/', 
  requireAdminRole('ADMIN'),
  asyncHandler(adminBusinessController.listBusinesses.bind(adminBusinessController))
);

/**
 * GET /v1/admin/businesses/:id
 * Get detailed business information with analytics
 * Requires: ADMIN role or higher
 */
router.get('/:id', 
  requireAdminRole('ADMIN'),
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
 * Requires: ADMIN role or higher
 */
router.get('/:id/payments', 
  requireAdminRole('ADMIN'),
  asyncHandler(adminPaymentController.getBusinessPayments.bind(adminPaymentController))
);

router.get('/:id/diagnostics/bookings',
  requireAdminRole('ADMIN'),
  asyncHandler(adminBusinessController.getBookingDiagnostics.bind(adminBusinessController))
);

router.get('/:id/diagnostics/whatsapp',
  requireAdminRole('ADMIN'),
  asyncHandler(adminBusinessController.getWhatsAppAudit.bind(adminBusinessController))
);

router.get('/:id/support-notes',
  requireAdminRole('ADMIN'),
  asyncHandler(adminBusinessController.listSupportNotes.bind(adminBusinessController))
);

router.post('/:id/support-notes',
  requireAdminRole('ADMIN'),
  asyncHandler(adminBusinessController.createSupportNote.bind(adminBusinessController))
);

router.patch('/:id/support-notes/:noteId',
  requireAdminRole('ADMIN'),
  asyncHandler(adminBusinessController.updateSupportNoteStatus.bind(adminBusinessController))
);

export { router as adminBusinessRoutes };
