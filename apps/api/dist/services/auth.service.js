"use strict";
/**
 * Auth Service
 *
 * Orchestrates the authentication flow:
 * 1. Request OTP -> Store in DB
 * 2. Verify OTP -> Find/Create User -> Mint JWT
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const otp_service_1 = require("./otp.service");
const user_service_1 = require("./user.service");
const token_service_1 = require("./token.service");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class AuthService {
    /**
     * Request OTP for phone number
     */
    async requestOtp(phone) {
        logger_1.logger.info({ phone }, 'OTP request initiated');
        return otp_service_1.otpService.requestOtp(phone);
    }
    /**
     * Verify OTP and return JWT token
     */
    async verifyOtp(phone, code) {
        logger_1.logger.info({ phone }, 'OTP verification initiated');
        // Verify OTP
        const otpResult = await otp_service_1.otpService.verifyOtp(phone, code);
        if (!otpResult.valid) {
            return {
                success: false,
                message: otpResult.message,
            };
        }
        // Find or create user
        const user = await user_service_1.userService.findOrCreate(phone);
        // Mint JWT token
        const token = token_service_1.tokenService.mintToken(user.id, user.phone, 'authenticated');
        logger_1.logger.info({ userId: user.id, phone }, 'User authenticated successfully');
        return {
            success: true,
            message: 'Authentication successful',
            token,
            user: {
                id: user.id,
                phone: user.phone,
                role: user.role,
            },
        };
    }
    /**
     * Get current user from token
     */
    async getCurrentUser(token) {
        const payload = token_service_1.tokenService.verifyToken(token);
        if (!payload) {
            return {
                success: false,
                message: 'Invalid or expired token',
            };
        }
        const user = await user_service_1.userService.findById(payload.sub);
        if (!user) {
            return {
                success: false,
                message: 'User not found',
            };
        }
        return {
            success: true,
            message: 'User found',
            user: {
                id: user.id,
                phone: user.phone,
                role: user.role,
            },
        };
    }
    /**
     * Refresh token (issue new token for valid user)
     */
    async refreshToken(userId) {
        const user = await user_service_1.userService.findById(userId);
        if (!user) {
            throw new errors_1.BusinessRuleError('User not found');
        }
        const token = token_service_1.tokenService.mintToken(user.id, user.phone, 'authenticated');
        return {
            success: true,
            message: 'Token refreshed',
            token,
            user: {
                id: user.id,
                phone: user.phone,
                role: user.role,
            },
        };
    }
}
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map