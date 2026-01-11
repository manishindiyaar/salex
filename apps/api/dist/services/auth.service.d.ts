/**
 * Auth Service
 *
 * Orchestrates the authentication flow:
 * 1. Request OTP -> Store in DB
 * 2. Verify OTP -> Find/Create User -> Mint JWT
 */
export interface AuthResult {
    success: boolean;
    message: string;
    token?: string;
    user?: {
        id: string;
        phone: string;
        role: string;
    };
}
declare class AuthService {
    /**
     * Request OTP for phone number
     */
    requestOtp(phone: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Verify OTP and return JWT token
     */
    verifyOtp(phone: string, code: string): Promise<AuthResult>;
    /**
     * Get current user from token
     */
    getCurrentUser(token: string): Promise<AuthResult>;
    /**
     * Refresh token (issue new token for valid user)
     */
    refreshToken(userId: string): Promise<AuthResult>;
}
export declare const authService: AuthService;
export {};
//# sourceMappingURL=auth.service.d.ts.map