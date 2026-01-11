"use strict";
/**
 * Admin Module Management Routes
 *
 * Routes for admin module operations including viewing and updating business module configurations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminModuleRoutes = void 0;
const express_1 = require("express");
const admin_module_controller_1 = require("../controllers/admin-module.controller");
const admin_auth_middleware_1 = require("../middlewares/admin-auth.middleware");
const async_handler_1 = require("../utils/async-handler");
const router = (0, express_1.Router)();
exports.adminModuleRoutes = router;
// All admin module routes require authentication
router.use(admin_auth_middleware_1.adminAuthMiddleware);
/**
 * GET /v1/admin/modules
 * Get all available feature modules with usage statistics
 * Requires: SUPPORT role or higher
 */
router.get('/', (0, admin_auth_middleware_1.requireAdminRole)('SUPPORT'), (0, async_handler_1.asyncHandler)(admin_module_controller_1.adminModuleController.getAllModules.bind(admin_module_controller_1.adminModuleController)));
/**
 * GET /v1/admin/modules/:code/businesses
 * Get businesses that have a specific module enabled
 * Requires: SUPPORT role or higher
 */
router.get('/:code/businesses', (0, admin_auth_middleware_1.requireAdminRole)('SUPPORT'), (0, async_handler_1.asyncHandler)(admin_module_controller_1.adminModuleController.getModuleBusinesses.bind(admin_module_controller_1.adminModuleController)));
//# sourceMappingURL=admin-module.routes.js.map