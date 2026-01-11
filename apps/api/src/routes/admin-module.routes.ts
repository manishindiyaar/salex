/**
 * Admin Module Management Routes
 * 
 * Routes for admin module operations including viewing and updating business module configurations.
 */

import { Router } from 'express';
import { adminModuleController } from '../controllers/admin-module.controller';
import { adminAuthMiddleware, requireAdminRole } from '../middlewares/admin-auth.middleware';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

// All admin module routes require authentication
router.use(adminAuthMiddleware);

/**
 * GET /v1/admin/modules
 * Get all available feature modules with usage statistics
 * Requires: SUPPORT role or higher
 */
router.get('/', 
  requireAdminRole('SUPPORT'),
  asyncHandler(adminModuleController.getAllModules.bind(adminModuleController))
);

/**
 * GET /v1/admin/modules/:code/businesses
 * Get businesses that have a specific module enabled
 * Requires: SUPPORT role or higher
 */
router.get('/:code/businesses', 
  requireAdminRole('SUPPORT'),
  asyncHandler(adminModuleController.getModuleBusinesses.bind(adminModuleController))
);

export { router as adminModuleRoutes };