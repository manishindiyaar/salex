"use strict";
/**
 * Admin Payment Management Routes
 *
 * Routes for admin payment operations including recording payments, listing, and analytics.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPaymentRoutes = void 0;
const express_1 = require("express");
const admin_payment_controller_1 = require("../controllers/admin-payment.controller");
const admin_auth_middleware_1 = require("../middlewares/admin-auth.middleware");
const async_handler_1 = require("../utils/async-handler");
const router = (0, express_1.Router)();
exports.adminPaymentRoutes = router;
// All admin payment routes require authentication
router.use(admin_auth_middleware_1.adminAuthMiddleware);
/**
 * POST /v1/admin/payments
 * Record manual payment for a subscription
 * Requires: ADMIN role or higher
 */
router.post('/', (0, admin_auth_middleware_1.requireAdminRole)('ADMIN'), (0, async_handler_1.asyncHandler)(admin_payment_controller_1.adminPaymentController.recordPayment.bind(admin_payment_controller_1.adminPaymentController)));
/**
 * GET /v1/admin/payments
 * List all payments with pagination and filters
 * Requires: SUPPORT role or higher
 */
router.get('/', (0, admin_auth_middleware_1.requireAdminRole)('SUPPORT'), (0, async_handler_1.asyncHandler)(admin_payment_controller_1.adminPaymentController.listPayments.bind(admin_payment_controller_1.adminPaymentController)));
/**
 * GET /v1/admin/payments/analytics
 * Get payment analytics and revenue metrics
 * Requires: SUPPORT role or higher
 */
router.get('/analytics', (0, admin_auth_middleware_1.requireAdminRole)('SUPPORT'), (0, async_handler_1.asyncHandler)(admin_payment_controller_1.adminPaymentController.getPaymentAnalytics.bind(admin_payment_controller_1.adminPaymentController)));
//# sourceMappingURL=admin-payment.routes.js.map