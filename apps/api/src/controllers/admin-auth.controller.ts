/**
 * Admin Authentication Controller
 * 
 * Handles admin login, logout, and session management.
 * Uses Supabase Auth for authentication with admin role verification.
 */

import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '@salex/shared-types';
import { getConfig } from '../config';
import { logger } from '../utils/logger';
import { UnauthorizedError, ForbiddenError, ValidationError } from '../utils/errors';
import { AdminRequest } from '../middlewares/admin-auth.middleware';

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

class AdminAuthController {
  private supabase;

  constructor() {
    const config = getConfig();
    this.supabase = createClient(
      config.supabaseUrl,
      config.supabaseServiceKey // Use service key for admin operations
    );
  }

  /**
   * POST /v1/admin/auth/login
   * Authenticate admin user with email/password
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password } = LoginSchema.parse(req.body);

      // Authenticate with Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Verify user is an admin
      const adminUser = await prisma.adminUser.findUnique({
        where: { email },
      });

      if (!adminUser) {
        throw new ForbiddenError('User is not authorized as admin');
      }

      if (!adminUser.isActive) {
        throw new ForbiddenError('Admin account is deactivated');
      }

      // Create custom JWT token with admin context
      const config = getConfig();
      const token = jwt.sign(
        {
          sub: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
          type: 'admin',
        },
        config.supabaseJwtSecret,
        { expiresIn: '24h' }
      );

      logger.info(
        { 
          adminId: adminUser.id, 
          email: adminUser.email, 
          role: adminUser.role 
        },
        'Admin login successful'
      );

      res.json({
        success: true,
        data: {
          token,
          admin: {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            role: adminUser.role,
          },
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid input', error.errors);
      }
      throw error;
    }
  }

  /**
   * POST /v1/admin/auth/logout
   * Invalidate admin session
   */
  async logout(req: AdminRequest, res: Response) {
    try {
      // Sign out from Supabase (optional, since we're using custom JWTs)
      await this.supabase.auth.signOut();

      logger.info(
        { 
          adminId: req.admin.adminId, 
          email: req.admin.email 
        },
        'Admin logout successful'
      );

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      logger.error({ error }, 'Error during admin logout');
      throw error;
    }
  }

  /**
   * GET /v1/admin/auth/me
   * Get current admin user info
   */
  async me(req: AdminRequest, res: Response) {
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: req.admin.adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!adminUser) {
      throw new UnauthorizedError('Admin user not found');
    }

    res.json({
      success: true,
      data: {
        admin: adminUser,
      },
    });
  }
}

export const adminAuthController = new AdminAuthController();
