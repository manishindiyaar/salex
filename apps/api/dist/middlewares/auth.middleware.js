"use strict";
/**
 * Authentication Middleware
 *
 * Validates Custom JWTs signed with Supabase Project Secret.
 * Supports development bypass when ENABLE_AUTH=false.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
/**
 * Extract Bearer token from Authorization header
 */
function extractToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.slice(7);
}
/**
 * Development mock user for auth bypass
 */
const DEV_MOCK_USER = {
    userId: 'dev-test-user-id',
    phone: '+919876543210',
    role: 'merchant',
};
/**
 * Authentication middleware - validates JWT and attaches user context
 * In development with ENABLE_AUTH=false, bypasses auth and uses mock user
 */
function authMiddleware(req, _res, next) {
    try {
        const config = (0, config_1.getConfig)();
        // Development auth bypass
        if (!config.enableAuth && (0, config_1.isDevelopment)()) {
            logger_1.logger.info({ path: req.path }, '🔧 Auth bypassed in development mode');
            req.auth = DEV_MOCK_USER;
            return next();
        }
        const token = extractToken(req.headers.authorization);
        if (!token) {
            throw new errors_1.UnauthorizedError('Missing authentication token');
        }
        const decoded = jsonwebtoken_1.default.verify(token, config.supabaseJwtSecret);
        // Attach auth context to request
        req.auth = {
            userId: decoded.sub,
            phone: decoded.phone,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new errors_1.UnauthorizedError('Invalid authentication token'));
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            next(new errors_1.UnauthorizedError('Authentication token expired'));
        }
        else {
            next(error);
        }
    }
}
/**
 * Optional auth middleware - attaches user context if token present, but doesn't require it
 */
function optionalAuthMiddleware(req, _res, next) {
    try {
        const token = extractToken(req.headers.authorization);
        if (token) {
            const config = (0, config_1.getConfig)();
            const decoded = jsonwebtoken_1.default.verify(token, config.supabaseJwtSecret);
            req.auth = {
                userId: decoded.sub,
                phone: decoded.phone,
                role: decoded.role,
            };
        }
        next();
    }
    catch {
        // Token invalid, but that's okay for optional auth
        next();
    }
}
//# sourceMappingURL=auth.middleware.js.map