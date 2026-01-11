/**
 * Auth Controller
 *
 * Handles HTTP layer for authentication endpoints.
 * Follows Service-Controller-Route pattern.
 */
import { Request, Response, NextFunction } from 'express';
declare class AuthController {
    /**
     * POST /v1/auth/otp/request
     * Request OTP for phone number
     */
    requestOtp(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /v1/auth/otp/verify
     * Verify OTP and return JWT token
     */
    verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /v1/auth/me
     * Get current authenticated user
     */
    getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /v1/auth/refresh
     * Refresh JWT token
     */
    refreshToken(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const authController: AuthController;
export {};
//# sourceMappingURL=auth.controller.d.ts.map