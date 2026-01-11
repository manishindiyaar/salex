/**
 * Admin Authentication Middleware
 *
 * Validates JWT tokens for admin users and enforces admin role requirements.
 * Extends the regular auth middleware with admin-specific checks.
 */
import { Request, Response, NextFunction } from 'express';
import { AdminRole } from '@salex/shared-types';
export interface AdminContext {
    adminId: string;
    email: string;
    name: string;
    role: AdminRole;
}
declare global {
    namespace Express {
        interface Request {
            admin?: AdminContext;
        }
    }
}
export interface AdminRequest extends Request {
    admin: AdminContext;
}
/**
 * Admin authentication middleware - validates JWT and checks admin role
 * In development with ENABLE_AUTH=false, bypasses auth and uses mock admin
 */
export declare function adminAuthMiddleware(req: Request, _res: Response, next: NextFunction): void;
/**
 * Role-based authorization middleware factory
 * Requires specific admin role or higher
 */
export declare function requireAdminRole(requiredRole: AdminRole): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=admin-auth.middleware.d.ts.map