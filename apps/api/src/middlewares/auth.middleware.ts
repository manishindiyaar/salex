/**
 * Authentication Middleware
 * 
 * Validates Custom JWTs signed with Supabase Project Secret.
 * Supports development bypass when ENABLE_AUTH=false.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthContext, JwtPayload, prisma } from '@salex/shared-types';
import { getConfig, isDevelopment } from '../config';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

// Extend Express Request to include auth context
declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

// Export AuthRequest type for controllers
export interface AuthRequest extends Request {
  auth: AuthContext;
}

/**
 * Extract Bearer token from Authorization header
 */
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Development mock user for auth bypass
 */
const DEV_MOCK_USER: AuthContext = {
  userId: 'dev-test-user-id',
  phone: '+919876543210',
  role: 'merchant',
};

async function buildActiveAuthContext(decoded: JwtPayload): Promise<AuthContext> {
  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
    select: {
      id: true,
      phone: true,
      status: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  if (user.status !== 'ACTIVE') {
    throw new ForbiddenError('User account is not active');
  }

  return {
    userId: user.id,
    phone: user.phone,
    role: decoded.role,
  };
}

/**
 * Authentication middleware - validates JWT and attaches user context
 * In development with ENABLE_AUTH=false, bypasses auth and uses mock user
 */
export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const config = getConfig();
    
    // Development auth bypass
    if (!config.enableAuth && isDevelopment()) {
      logger.info({ path: req.path }, '🔧 Auth bypassed in development mode');
      req.auth = DEV_MOCK_USER;
      return next();
    }

    const token = extractToken(req.headers.authorization);

    if (!token) {
      throw new UnauthorizedError('Missing authentication token');
    }

    const decoded = jwt.verify(token, config.supabaseJwtSecret) as JwtPayload;

    // Attach auth context to request
    req.auth = await buildActiveAuthContext(decoded);

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Authentication token expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid authentication token'));
    } else {
      next(error);
    }
  }
}

/**
 * Optional auth middleware - attaches user context if token present, but doesn't require it
 */
export async function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req.headers.authorization);

    if (token) {
      const config = getConfig();
      const decoded = jwt.verify(token, config.supabaseJwtSecret) as JwtPayload;

      req.auth = await buildActiveAuthContext(decoded);
    }

    next();
  } catch {
    // Token invalid, but that's okay for optional auth
    next();
  }
}
