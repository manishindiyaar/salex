/**
 * Authentication Middleware
 *
 * Validates Custom JWTs signed with Supabase Project Secret.
 * Supports development bypass when ENABLE_AUTH=false.
 */
import { Request, Response, NextFunction } from 'express';
import { AuthContext } from '@salex/shared-types';
declare global {
    namespace Express {
        interface Request {
            auth?: AuthContext;
        }
    }
}
export interface AuthRequest extends Request {
    auth: AuthContext;
}
/**
 * Authentication middleware - validates JWT and attaches user context
 * In development with ENABLE_AUTH=false, bypasses auth and uses mock user
 */
export declare function authMiddleware(req: Request, _res: Response, next: NextFunction): void;
/**
 * Optional auth middleware - attaches user context if token present, but doesn't require it
 */
export declare function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.middleware.d.ts.map