/**
 * Admin Authentication Routes
 * 
 * Routes for admin login, logout, and session management.
 */

import { Router } from 'express';
import { adminAuthController } from '../controllers/admin-auth.controller';
import { adminAuthMiddleware } from '../middlewares/admin-auth.middleware';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

/**
 * POST /v1/admin/auth/login
 * Admin login with email/password
 */
router.post('/login', asyncHandler(adminAuthController.login.bind(adminAuthController)));

/**
 * POST /v1/admin/auth/logout
 * Admin logout (requires authentication)
 */
router.post('/logout', 
  adminAuthMiddleware,
  asyncHandler(adminAuthController.logout.bind(adminAuthController))
);

/**
 * GET /v1/admin/auth/me
 * Get current admin user info (requires authentication)
 */
router.get('/me', 
  adminAuthMiddleware,
  asyncHandler(adminAuthController.me.bind(adminAuthController))
);

export { router as adminAuthRoutes };