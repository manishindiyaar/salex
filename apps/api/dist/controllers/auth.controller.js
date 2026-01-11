"use strict";
/**
 * Auth Controller
 *
 * Handles HTTP layer for authentication endpoints.
 * Follows Service-Controller-Route pattern.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const services_1 = require("../services");
const shared_types_1 = require("@salex/shared-types");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
class AuthController {
    /**
     * POST /v1/auth/otp/request
     * Request OTP for phone number
     */
    async requestOtp(req, res, next) {
        try {
            // Validate request body
            const parseResult = shared_types_1.otpRequestSchema.safeParse(req.body);
            if (!parseResult.success) {
                throw new errors_1.ValidationError('Invalid request', parseResult.error);
            }
            const { phone } = parseResult.data;
            logger_1.logger.info({ phone }, 'OTP request received');
            const result = await services_1.authService.requestOtp(phone);
            res.status(200).json({
                success: true,
                data: {
                    message: result.message,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /v1/auth/otp/verify
     * Verify OTP and return JWT token
     */
    async verifyOtp(req, res, next) {
        try {
            // Validate request body
            const parseResult = shared_types_1.otpVerifySchema.safeParse(req.body);
            if (!parseResult.success) {
                throw new errors_1.ValidationError('Invalid request', parseResult.error);
            }
            const { phone, otp } = parseResult.data;
            logger_1.logger.info({ phone }, 'OTP verification received');
            const result = await services_1.authService.verifyOtp(phone, otp);
            if (!result.success) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_OTP',
                        message: result.message,
                    },
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: {
                    token: result.token,
                    user: result.user,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /v1/auth/me
     * Get current authenticated user
     */
    async getCurrentUser(req, res, next) {
        try {
            if (!req.auth) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    },
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: {
                    user: {
                        id: req.auth.userId,
                        phone: req.auth.phone,
                        role: req.auth.role,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /v1/auth/refresh
     * Refresh JWT token
     */
    async refreshToken(req, res, next) {
        try {
            if (!req.auth) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    },
                });
                return;
            }
            const result = await services_1.authService.refreshToken(req.auth.userId);
            res.status(200).json({
                success: true,
                data: {
                    token: result.token,
                    user: result.user,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map