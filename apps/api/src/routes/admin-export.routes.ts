/**
 * Admin Data Export Routes
 * 
 * Routes for exporting platform data to CSV format.
 */

import { Router } from 'express';
import { adminExportController } from '../controllers/admin-export.controller';
import { adminAuthMiddleware, requireAdminRole } from '../middlewares/admin-auth.middleware';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

// All admin export routes require authentication
router.use(adminAuthMiddleware);

/**
 * GET /v1/admin/export/businesses
 * Export businesses to CSV
 * Requires: ADMIN role or higher
 */
router.get('/businesses', 
  requireAdminRole('ADMIN'),
  asyncHandler(adminExportController.exportBusinesses.bind(adminExportController))
);

/**
 * GET /v1/admin/export/payments
 * Export payments to CSV
 * Requires: ADMIN role or higher
 */
router.get('/payments', 
  requireAdminRole('ADMIN'),
  asyncHandler(adminExportController.exportPayments.bind(adminExportController))
);

export { router as adminExportRoutes };