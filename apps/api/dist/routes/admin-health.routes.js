"use strict";
/**
 * Admin Health and Statistics Routes
 *
 * Routes for system health monitoring and platform statistics.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminHealthRoutes = void 0;
const express_1 = require("express");
const admin_health_controller_1 = require("../controllers/admin-health.controller");
const admin_auth_middleware_1 = require("../middlewares/admin-auth.middleware");
const async_handler_1 = require("../utils/async-handler");
const router = (0, express_1.Router)();
exports.adminHealthRoutes = router;
// All admin health routes require authentication
router.use(admin_auth_middleware_1.adminAuthMiddleware);
/**
 * GET /v1/admin/health
 * Check system health status
 * Requires: SUPPORT role or higher
 */
router.get('/', (0, admin_auth_middleware_1.requireAdminRole)('SUPPORT'), (0, async_handler_1.asyncHandler)(admin_health_controller_1.adminHealthController.getSystemHealth.bind(admin_health_controller_1.adminHealthController)));
/**
 * GET /v1/admin/stats
 * Get platform statistics
 * Requires: SUPPORT role or higher
 */
router.get('/stats', (0, admin_auth_middleware_1.requireAdminRole)('SUPPORT'), (0, async_handler_1.asyncHandler)(admin_health_controller_1.adminHealthController.getPlatformStats.bind(admin_health_controller_1.adminHealthController)));
//# sourceMappingURL=admin-health.routes.js.map