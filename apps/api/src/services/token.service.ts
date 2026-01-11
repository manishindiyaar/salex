/**
 * Token Service
 * 
 * Handles JWT token generation for Supabase RLS compatibility.
 * Tokens are signed with SUPABASE_JWT_SECRET.
 */

import jwt from 'jsonwebtoken';
import { getConfig } from '../config';
import { logger } from '../utils/logger';

// Token expiry: 7 days
const TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  sub: string;        // User ID
  aud: string;        // Audience (authenticated)
  role: string;       // Role for RLS
  phone: string;      // User phone
  iat?: number;       // Issued at
  exp?: number;       // Expiry
}

class TokenService {
  /**
   * Mint a JWT token for a user
   * Payload matches Supabase RLS expectations
   */
  mintToken(userId: string, phone: string, role: string = 'authenticated'): string {
    const config = getConfig();

    const payload: TokenPayload = {
      sub: userId,
      aud: 'authenticated',
      role,
      phone,
    };

    const token = jwt.sign(payload, config.supabaseJwtSecret, {
      expiresIn: TOKEN_EXPIRY,
      algorithm: 'HS256',
    });

    logger.info({ userId, phone }, 'JWT token minted');

    return token;
  }

  /**
   * Verify and decode a JWT token
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      const config = getConfig();
      const decoded = jwt.verify(token, config.supabaseJwtSecret) as TokenPayload;
      return decoded;
    } catch (error) {
      logger.warn({ error }, 'JWT verification failed');
      return null;
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      return decoded;
    } catch {
      return null;
    }
  }
}

export const tokenService = new TokenService();
