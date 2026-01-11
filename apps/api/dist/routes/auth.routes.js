"use strict";
/**
 * Auth Routes
 *
 * POST /v1/auth/otp/request  - Request OTP
 * POST /v1/auth/otp/verify   - Verify OTP and get token
 * GET  /v1/auth/me           - Get current user (protected)
 * POST /v1/auth/refresh      - Refresh token (protected)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const middlewares_1 = require("../middlewares");
const router = (0, express_1.Router)();
// Public routes
router.post('/otp/request', (req, res, next) => controllers_1.authController.requestOtp(req, res, next));
router.post('/otp/verify', (req, res, next) => controllers_1.authController.verifyOtp(req, res, next));
// Protected routes
router.get('/me', middlewares_1.authMiddleware, (req, res, next) => controllers_1.authController.getCurrentUser(req, res, next));
router.post('/refresh', middlewares_1.authMiddleware, (req, res, next) => controllers_1.authController.refreshToken(req, res, next));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map