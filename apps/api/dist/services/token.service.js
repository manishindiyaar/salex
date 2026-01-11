"use strict";
/**
 * Token Service
 *
 * Handles JWT token generation for Supabase RLS compatibility.
 * Tokens are signed with SUPABASE_JWT_SECRET.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
// Token expiry: 7 days
const TOKEN_EXPIRY = '7d';
class TokenService {
    /**
     * Mint a JWT token for a user
     * Payload matches Supabase RLS expectations
     */
    mintToken(userId, phone, role = 'authenticated') {
        const config = (0, config_1.getConfig)();
        const payload = {
            sub: userId,
            aud: 'authenticated',
            role,
            phone,
        };
        const token = jsonwebtoken_1.default.sign(payload, config.supabaseJwtSecret, {
            expiresIn: TOKEN_EXPIRY,
            algorithm: 'HS256',
        });
        logger_1.logger.info({ userId, phone }, 'JWT token minted');
        return token;
    }
    /**
     * Verify and decode a JWT token
     */
    verifyToken(token) {
        try {
            const config = (0, config_1.getConfig)();
            const decoded = jsonwebtoken_1.default.verify(token, config.supabaseJwtSecret);
            return decoded;
        }
        catch (error) {
            logger_1.logger.warn({ error }, 'JWT verification failed');
            return null;
        }
    }
    /**
     * Decode token without verification (for debugging)
     */
    decodeToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            return decoded;
        }
        catch {
            return null;
        }
    }
}
exports.tokenService = new TokenService();
//# sourceMappingURL=token.service.js.map