"use strict";
/**
 * Admin Authentication Middleware
 *
 * Validates JWT tokens for admin users and enforces admin role requirements.
 * Extends the regular auth middleware with admin-specific checks.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuthMiddleware = adminAuthMiddleware;
exports.requireAdminRole = requireAdminRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const shared_types_1 = require("@salex/shared-types");
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
 * Development mock admin for auth bypass
 */
const DEV_MOCK_ADMIN = {
    adminId: 'dev-admin-id',
    email: 'dev@salex.com',
    name: 'Dev Admin',
    role: 'SUPER_ADMIN',
};
/**
 * Admin authentication middleware - validates JWT and checks admin role
 * In development with ENABLE_AUTH=false, bypasses auth and uses mock admin
 */
function adminAuthMiddleware(req, _res, next) {
    return asyncHandler(async (req, _res, next) => {
        const config = (0, config_1.getConfig)();
        // Development auth bypass
        if (!config.enableAuth && (0, config_1.isDevelopment)()) {
            logger_1.logger.info({ path: req.path }, '🔧 Admin auth bypassed in development mode');
            req.admin = DEV_MOCK_ADMIN;
            return next();
        }
        const token = extractToken(req.headers.authorization);
        if (!token) {
            throw new errors_1.UnauthorizedError('Missing authentication token');
        }
        // Verify JWT token
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, config.supabaseJwtSecret);
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new errors_1.UnauthorizedError('Invalid authentication token');
            }
            else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new errors_1.UnauthorizedError('Authentication token expired');
            }
            throw error;
        }
        // Extract email from token (assuming Supabase JWT structure)
        const email = decoded.email || decoded.user_metadata?.email;
        if (!email) {
            throw new errors_1.UnauthorizedError('Token missing email information');
        }
        // Lookup admin user in database
        const adminUser = await shared_types_1.prisma.adminUser.findUnique({
            where: { email },
        });
        if (!adminUser) {
            throw new errors_1.ForbiddenError('User is not authorized as admin');
        }
        if (!adminUser.isActive) {
            throw new errors_1.ForbiddenError('Admin account is deactivated');
        }
        // Attach admin context to request
        req.admin = {
            adminId: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            role: adminUser.role,
        };
        logger_1.logger.info({
            adminId: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
            path: req.path
        }, 'Admin authenticated');
        next();
    })(req, _res, next);
}
/**
 * Role-based authorization middleware factory
 * Requires specific admin role or higher
 */
function requireAdminRole(requiredRole) {
    const roleHierarchy = {
        SUPPORT: 1,
        ADMIN: 2,
        SUPER_ADMIN: 3,
    };
    return (req, _res, next) => {
        const adminReq = req;
        if (!adminReq.admin) {
            throw new errors_1.UnauthorizedError('Admin authentication required');
        }
        const userRoleLevel = roleHierarchy[adminReq.admin.role];
        const requiredRoleLevel = roleHierarchy[requiredRole];
        if (userRoleLevel < requiredRoleLevel) {
            throw new errors_1.ForbiddenError(`Insufficient permissions. Required: ${requiredRole}, Current: ${adminReq.admin.role}`);
        }
        next();
    };
}
/**
 * Async handler wrapper to catch async errors
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=admin-auth.middleware.js.map