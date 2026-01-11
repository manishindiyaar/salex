"use strict";
/**
 * Admin Authentication Routes
 *
 * Routes for admin login, logout, and session management.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuthRoutes = void 0;
const express_1 = require("express");
const admin_auth_controller_1 = require("../controllers/admin-auth.controller");
const admin_auth_middleware_1 = require("../middlewares/admin-auth.middleware");
const async_handler_1 = require("../utils/async-handler");
const router = (0, express_1.Router)();
exports.adminAuthRoutes = router;
/**
 * POST /v1/admin/auth/login
 * Admin login with email/password
 */
router.post('/login', (0, async_handler_1.asyncHandler)(admin_auth_controller_1.adminAuthController.login.bind(admin_auth_controller_1.adminAuthController)));
/**
 * POST /v1/admin/auth/logout
 * Admin logout (requires authentication)
 */
router.post('/logout', admin_auth_middleware_1.adminAuthMiddleware, (0, async_handler_1.asyncHandler)(admin_auth_controller_1.adminAuthController.logout.bind(admin_auth_controller_1.adminAuthController)));
/**
 * GET /v1/admin/auth/me
 * Get current admin user info (requires authentication)
 */
router.get('/me', admin_auth_middleware_1.adminAuthMiddleware, (0, async_handler_1.asyncHandler)(admin_auth_controller_1.adminAuthController.me.bind(admin_auth_controller_1.adminAuthController)));
//# sourceMappingURL=admin-auth.routes.js.map