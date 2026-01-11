"use strict";
/**
 * Admin Business Management Routes
 *
 * Routes for admin business operations including listing, details, status toggle, and plan changes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminBusinessRoutes = void 0;
const express_1 = require("express");
const admin_business_controller_1 = require("../controllers/admin-business.controller");
const admin_payment_controller_1 = require("../controllers/admin-payment.controller");
const admin_module_controller_1 = require("../controllers/admin-module.controller");
const admin_auth_middleware_1 = require("../middlewares/admin-auth.middleware");
const async_handler_1 = require("../utils/async-handler");
const router = (0, express_1.Router)();
exports.adminBusinessRoutes = router;
// All admin business routes require authentication
router.use(admin_auth_middleware_1.adminAuthMiddleware);
/**
 * GET /v1/admin/businesses
 * List all businesses with pagination, search, and filters
 * Requires: SUPPORT role or higher
 */
router.get('/', (0, admin_auth_middleware_1.requireAdminRole)('SUPPORT'), (0, async_handler_1.asyncHandler)(admin_business_controller_1.adminBusinessController.listBusinesses.bind(admin_business_controller_1.adminBusinessController)));
/**
 * GET /v1/admin/businesses/:id
 * Get detailed business information with analytics
 * Requires: SUPPORT role or higher
 */
router.get('/:id', (0, admin_auth_middleware_1.requireAdminRole)('SUPPORT'), (0, async_handler_1.asyncHandler)(admin_business_controller_1.adminBusinessController.getBusinessDetails.bind(admin_business_controller_1.adminBusinessController)));
/**
 * POST /v1/admin/businesses/:id/toggle
 * Toggle business active status (activate/deactivate)
 * Requires: ADMIN role or higher
 */
router.post('/:id/toggle', (0, admin_auth_middleware_1.requireAdminRole)('ADMIN'), (0, async_handler_1.asyncHandler)(admin_business_controller_1.adminBusinessController.toggleBusinessStatus.bind(admin_business_controller_1.adminBusinessController)));
/**
 * PATCH /v1/admin/businesses/:id/plan
 * Change business subscription plan
 * Requires: ADMIN role or higher
 */
router.patch('/:id/plan', (0, admin_auth_middleware_1.requireAdminRole)('ADMIN'), (0, async_handler_1.asyncHandler)(admin_business_controller_1.adminBusinessController.changeSubscriptionPlan.bind(admin_business_controller_1.adminBusinessController)));
/**
 * GET /v1/admin/businesses/:id/payments
 * Get payment history for a specific business
 * Requires: SUPPORT role or higher
 */
router.get('/:id/payments', (0, admin_auth_middleware_1.requireAdminRole)('SUPPORT'), (0, async_handler_1.asyncHandler)(admin_payment_controller_1.adminPaymentController.getBusinessPayments.bind(admin_payment_controller_1.adminPaymentController)));
/**
 * GET /v1/admin/businesses/:id/modules
 * Get business module configurations
 * Requires: SUPPORT role or higher
 */
router.get('/:id/modules', (0, admin_auth_middleware_1.requireAdminRole)('SUPPORT'), (0, async_handler_1.asyncHandler)(admin_module_controller_1.adminModuleController.getBusinessModules.bind(admin_module_controller_1.adminModuleController)));
/**
 * PATCH /v1/admin/businesses/:id/modules
 * Update business module configurations
 * Requires: ADMIN role or higher
 */
router.patch('/:id/modules', (0, admin_auth_middleware_1.requireAdminRole)('ADMIN'), (0, async_handler_1.asyncHandler)(admin_module_controller_1.adminModuleController.updateBusinessModules.bind(admin_module_controller_1.adminModuleController)));
//# sourceMappingURL=admin-business.routes.js.map