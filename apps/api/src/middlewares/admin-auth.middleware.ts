/**
 * Admin Authentication Middleware
 * 
 * Validates JWT tokens for admin users and enforces admin role requirements.
 * Extends the regular auth middleware with admin-specific checks.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma, AdminUser, AdminRole } from '@salex/shared-types';
import { getConfig, isDevelopment } from '../config';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';

// Admin context attached to request
export interface AdminContext {
  adminId: string;
  email: string;
  name: string;
  role: AdminRole;
}

// Extend Express Request to include admin context
declare global {
  namespace Express {
    interface Request {
      admin?: AdminContext;
    }
  }
}

// Export AdminRequest type for controllers
export interface AdminRequest extends Request {
  admin: AdminContext;
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
 * Development mock admin for auth bypass
 */
const DEV_MOCK_ADMIN: AdminContext = {
  adminId: 'dev-admin-id',
  email: 'dev@salex.com',
  name: 'Dev Admin',
  role: 'SUPER_ADMIN',
};

/**
 * Admin authentication middleware - validates JWT and checks admin role
 * In development with ENABLE_AUTH=false, bypasses auth and uses mock admin
 */
export function adminAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  return asyncHandler(async (req, _res, next) => {
    const config = getConfig();
    
    // Development auth bypass
    if (!config.enableAuth && isDevelopment()) {
      logger.info({ path: req.path }, '🔧 Admin auth bypassed in development mode');
      req.admin = DEV_MOCK_ADMIN;
      return next();
    }

    const token = extractToken(req.headers.authorization);

    if (!token) {
      throw new UnauthorizedError('Missing authentication token');
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, config.supabaseJwtSecret);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid authentication token');
      } else if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Authentication token expired');
      }
      throw error;
    }

    // Extract email from token (assuming Supabase JWT structure)
    const email = decoded.email || decoded.user_metadata?.email;
    if (!email) {
      throw new UnauthorizedError('Token missing email information');
    }

    // Lookup admin user in database
    const adminUser = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!adminUser) {
      throw new ForbiddenError('User is not authorized as admin');
    }

    if (!adminUser.isActive) {
      throw new ForbiddenError('Admin account is deactivated');
    }

    // Attach admin context to request
    req.admin = {
      adminId: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
    };

    logger.info(
      { 
        adminId: adminUser.id, 
        email: adminUser.email, 
        role: adminUser.role,
        path: req.path 
      },
      'Admin authenticated'
    );

    next();
  })(req, _res, next);
}

/**
 * Role-based authorization middleware factory
 * Requires specific admin role or higher
 */
export function requireAdminRole(requiredRole: AdminRole) {
  const roleHierarchy: Record<AdminRole, number> = {
    SUPPORT: 1,
    ADMIN: 2,
    SUPER_ADMIN: 3,
  };

  return (req: Request, _res: Response, next: NextFunction) => {
    const adminReq = req as AdminRequest;
    
    if (!adminReq.admin) {
      throw new UnauthorizedError('Admin authentication required');
    }

    const userRoleLevel = roleHierarchy[adminReq.admin.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      throw new ForbiddenError(
        `Insufficient permissions. Required: ${requiredRole}, Current: ${adminReq.admin.role}`
      );
    }

    next();
  };
}

/**
 * Async handler wrapper to catch async errors
 */
function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}