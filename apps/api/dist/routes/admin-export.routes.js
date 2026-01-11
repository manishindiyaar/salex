"use strict";
/**
 * Admin Data Export Routes
 *
 * Routes for exporting platform data to CSV format.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminExportRoutes = void 0;
const express_1 = require("express");
const admin_export_controller_1 = require("../controllers/admin-export.controller");
const admin_auth_middleware_1 = require("../middlewares/admin-auth.middleware");
const async_handler_1 = require("../utils/async-handler");
const router = (0, express_1.Router)();
exports.adminExportRoutes = router;
// All admin export routes require authentication
router.use(admin_auth_middleware_1.adminAuthMiddleware);
/**
 * GET /v1/admin/export/businesses
 * Export businesses to CSV
 * Requires: ADMIN role or higher
 */
router.get('/businesses', (0, admin_auth_middleware_1.requireAdminRole)('ADMIN'), (0, async_handler_1.asyncHandler)(admin_export_controller_1.adminExportController.exportBusinesses.bind(admin_export_controller_1.adminExportController)));
/**
 * GET /v1/admin/export/payments
 * Export payments to CSV
 * Requires: ADMIN role or higher
 */
router.get('/payments', (0, admin_auth_middleware_1.requireAdminRole)('ADMIN'), (0, async_handler_1.asyncHandler)(admin_export_controller_1.adminExportController.exportPayments.bind(admin_export_controller_1.adminExportController)));
//# sourceMappingURL=admin-export.routes.js.map