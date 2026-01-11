"use strict";
/**
 * Admin Authentication Controller
 *
 * Handles admin login, logout, and session management.
 * Uses Supabase Auth for authentication with admin role verification.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuthController = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const shared_types_1 = require("@salex/shared-types");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
// Validation schemas
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
class AdminAuthController {
    supabase;
    constructor() {
        const config = (0, config_1.getConfig)();
        this.supabase = (0, supabase_js_1.createClient)(config.supabaseUrl, config.supabaseServiceKey // Use service key for admin operations
        );
    }
    /**
     * POST /v1/admin/auth/login
     * Authenticate admin user with email/password
     */
    async login(req, res) {
        try {
            const { email, password } = LoginSchema.parse(req.body);
            // Authenticate with Supabase
            const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (authError || !authData.user) {
                throw new errors_1.UnauthorizedError('Invalid email or password');
            }
            // Verify user is an admin
            const adminUser = await shared_types_1.prisma.adminUser.findUnique({
                where: { email },
            });
            if (!adminUser) {
                throw new errors_1.ForbiddenError('User is not authorized as admin');
            }
            if (!adminUser.isActive) {
                throw new errors_1.ForbiddenError('Admin account is deactivated');
            }
            // Create custom JWT token with admin context
            const config = (0, config_1.getConfig)();
            const token = jsonwebtoken_1.default.sign({
                sub: adminUser.id,
                email: adminUser.email,
                role: adminUser.role,
                type: 'admin',
            }, config.supabaseJwtSecret, { expiresIn: '24h' });
            logger_1.logger.info({
                adminId: adminUser.id,
                email: adminUser.email,
                role: adminUser.role
            }, 'Admin login successful');
            res.json({
                success: true,
                data: {
                    token,
                    admin: {
                        id: adminUser.id,
                        email: adminUser.email,
                        name: adminUser.name,
                        role: adminUser.role,
                    },
                },
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new errors_1.ValidationError('Invalid input', error.errors);
            }
            throw error;
        }
    }
    /**
     * POST /v1/admin/auth/logout
     * Invalidate admin session
     */
    async logout(req, res) {
        try {
            // Sign out from Supabase (optional, since we're using custom JWTs)
            await this.supabase.auth.signOut();
            logger_1.logger.info({
                adminId: req.admin.adminId,
                email: req.admin.email
            }, 'Admin logout successful');
            res.json({
                success: true,
                message: 'Logged out successfully',
            });
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Error during admin logout');
            throw error;
        }
    }
    /**
     * GET /v1/admin/auth/me
     * Get current admin user info
     */
    async me(req, res) {
        try {
            const adminUser = await shared_types_1.prisma.adminUser.findUnique({
                where: { id: req.admin.adminId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            if (!adminUser) {
                throw new errors_1.UnauthorizedError('Admin user not found');
            }
            res.json({
                success: true,
                data: {
                    admin: adminUser,
                },
            });
        }
        catch (error) {
            throw error;
        }
    }
}
exports.adminAuthController = new AdminAuthController();
//# sourceMappingURL=admin-auth.controller.js.map