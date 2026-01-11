/**
 * Auth Service
 * 
 * Orchestrates the authentication flow:
 * 1. Request OTP -> Store in DB
 * 2. Verify OTP -> Find/Create User -> Mint JWT
 */

import { otpService } from './otp.service';
import { userService } from './user.service';
import { tokenService } from './token.service';
import { logger } from '../utils/logger';
import { BusinessRuleError } from '../utils/errors';

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

class AuthService {
  /**
   * Request OTP for phone number
   */
  async requestOtp(phone: string): Promise<{ success: boolean; message: string }> {
    logger.info({ phone }, 'OTP request initiated');
    return otpService.requestOtp(phone);
  }

  /**
   * Verify OTP and return JWT token
   */
  async verifyOtp(phone: string, code: string): Promise<AuthResult> {
    logger.info({ phone }, 'OTP verification initiated');

    // Verify OTP
    const otpResult = await otpService.verifyOtp(phone, code);

    if (!otpResult.valid) {
      return {
        success: false,
        message: otpResult.message,
      };
    }

    // Find or create user
    const user = await userService.findOrCreate(phone);

    // Mint JWT token
    const token = tokenService.mintToken(user.id, user.phone, 'authenticated');

    logger.info({ userId: user.id, phone }, 'User authenticated successfully');

    return {
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  /**
   * Get current user from token
   */
  async getCurrentUser(token: string): Promise<AuthResult> {
    const payload = tokenService.verifyToken(token);

    if (!payload) {
      return {
        success: false,
        message: 'Invalid or expired token',
      };
    }

    const user = await userService.findById(payload.sub);

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    return {
      success: true,
      message: 'User found',
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  /**
   * Refresh token (issue new token for valid user)
   */
  async refreshToken(userId: string): Promise<AuthResult> {
    const user = await userService.findById(userId);

    if (!user) {
      throw new BusinessRuleError('User not found');
    }

    const token = tokenService.mintToken(user.id, user.phone, 'authenticated');

    return {
      success: true,
      message: 'Token refreshed',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
      },
    };
  }
}

export const authService = new AuthService();
