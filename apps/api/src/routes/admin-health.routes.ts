/**
 * Admin Health and Statistics Routes
 * 
 * Routes for system health monitoring and platform statistics.
 */

import { Router } from 'express';
import { adminHealthController } from '../controllers/admin-health.controller';
import { adminAuthMiddleware, requireAdminRole } from '../middlewares/admin-auth.middleware';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

// All admin health routes require authentication
router.use(adminAuthMiddleware);

/**
 * GET /v1/admin/health
 * Check system health status
 * Requires: SUPPORT role or higher
 */
router.get('/', 
  requireAdminRole('SUPPORT'),
  asyncHandler(adminHealthController.getSystemHealth.bind(adminHealthController))
);

/**
 * GET /v1/admin/stats
 * Get platform statistics
 * Requires: SUPPORT role or higher
 */
router.get('/stats', 
  requireAdminRole('SUPPORT'),
  asyncHandler(adminHealthController.getPlatformStats.bind(adminHealthController))
);

export { router as adminHealthRoutes };