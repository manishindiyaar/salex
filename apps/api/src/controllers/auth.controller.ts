/**
 * Auth Controller
 * 
 * Handles HTTP layer for authentication endpoints.
 * Follows Service-Controller-Route pattern.
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services';
import { otpRequestSchema, otpVerifySchema } from '@salex/shared-types';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

class AuthController {
  /**
   * POST /v1/auth/otp/request
   * Request OTP for phone number
   */
  async requestOtp(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const parseResult = otpRequestSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        throw new ValidationError('Invalid request', parseResult.error);
      }

      const { phone } = parseResult.data;

      logger.info({ phone }, 'OTP request received');

      const result = await authService.requestOtp(phone);

      res.status(200).json({
        success: true,
        data: {
          message: result.message,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /v1/auth/otp/verify
   * Verify OTP and return JWT token
   */
  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const parseResult = otpVerifySchema.safeParse(req.body);
      
      if (!parseResult.success) {
        throw new ValidationError('Invalid request', parseResult.error);
      }

      const { phone, otp } = parseResult.data;

      logger.info({ phone }, 'OTP verification received');

      const result = await authService.verifyOtp(phone, otp);

      if (!result.success) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_OTP',
            message: result.message,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          token: result.token,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /v1/auth/me
   * Get current authenticated user
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: req.auth.userId,
            phone: req.auth.phone,
            role: req.auth.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /v1/auth/refresh
   * Refresh JWT token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const result = await authService.refreshToken(req.auth.userId);

      res.status(200).json({
        success: true,
        data: {
          token: result.token,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
