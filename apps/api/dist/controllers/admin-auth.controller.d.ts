/**
 * Admin Authentication Controller
 *
 * Handles admin login, logout, and session management.
 * Uses Supabase Auth for authentication with admin role verification.
 */
import { Request, Response } from 'express';
import { AdminRequest } from '../middlewares/admin-auth.middleware';
declare class AdminAuthController {
    private supabase;
    constructor();
    /**
     * POST /v1/admin/auth/login
     * Authenticate admin user with email/password
     */
    login(req: Request, res: Response): Promise<void>;
    /**
     * POST /v1/admin/auth/logout
     * Invalidate admin session
     */
    logout(req: AdminRequest, res: Response): Promise<void>;
    /**
     * GET /v1/admin/auth/me
     * Get current admin user info
     */
    me(req: AdminRequest, res: Response): Promise<void>;
}
export declare const adminAuthController: AdminAuthController;
export {};
//# sourceMappingURL=admin-auth.controller.d.ts.map