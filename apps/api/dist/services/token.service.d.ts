/**
 * Token Service
 *
 * Handles JWT token generation for Supabase RLS compatibility.
 * Tokens are signed with SUPABASE_JWT_SECRET.
 */
export interface TokenPayload {
    sub: string;
    aud: string;
    role: string;
    phone: string;
    iat?: number;
    exp?: number;
}
declare class TokenService {
    /**
     * Mint a JWT token for a user
     * Payload matches Supabase RLS expectations
     */
    mintToken(userId: string, phone: string, role?: string): string;
    /**
     * Verify and decode a JWT token
     */
    verifyToken(token: string): TokenPayload | null;
    /**
     * Decode token without verification (for debugging)
     */
    decodeToken(token: string): TokenPayload | null;
}
export declare const tokenService: TokenService;
export {};
//# sourceMappingURL=token.service.d.ts.map