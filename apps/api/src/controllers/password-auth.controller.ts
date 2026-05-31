/**
 * Password Auth Controller
 * Handles password login and password change endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '@salex/shared-types';
import { passwordLoginSchema, passwordChangeSchema } from '@salex/shared-types';
import { authMethodService } from '../services/auth-method.service';
import { tokenService } from '../services/token.service';
import { verifyPassword, hashPassword } from '../utils/password';
import { getAuthFlags } from '../config/auth-flags';
import { ValidationError, UnauthorizedError, BusinessRuleError } from '../utils/errors';
import { logger } from '../utils/logger';

class PasswordAuthController {
  /** POST /v1/auth/password/login */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const flags = getAuthFlags();
      if (!flags.passwordLoginEnabled) {
        throw new BusinessRuleError('Password login is currently disabled');
      }

      const parsed = passwordLoginSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid request', parsed.error);
      }

      const { phone, password } = parsed.data;

      // Find user
      const user = await prisma.user.findUnique({ where: { phone } });
      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedError('Invalid phone number or password');
      }

      // Find password auth method
      const authMethod = await authMethodService.findEnabledPassword(phone);
      if (!authMethod || !authMethod.secretHash) {
        throw new UnauthorizedError('Invalid phone number or password');
      }

      // Verify password
      const valid = await verifyPassword(password, authMethod.secretHash);
      if (!valid) {
        throw new UnauthorizedError('Invalid phone number or password');
      }

      // Update timestamps
      await Promise.all([
        authMethodService.touchLastUsed(authMethod.id),
        prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
      ]);

      // Mint token
      const token = tokenService.mintToken(user.id, user.phone, 'authenticated');

      logger.info({ userId: user.id, phone }, 'Password login successful');

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            phone: user.phone,
            role: user.role,
            mustChangePassword: user.mustChangePassword,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /** POST /v1/auth/password/change */
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = passwordChangeSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid request', parsed.error);
      }

      const { currentPassword, newPassword } = parsed.data;
      const userId = req.auth!.userId;
      const phone = req.auth!.phone;

      const authMethod = await authMethodService.findEnabledPassword(phone);
      if (!authMethod || !authMethod.secretHash) {
        throw new BusinessRuleError('No password auth method found');
      }

      const valid = await verifyPassword(currentPassword, authMethod.secretHash);
      if (!valid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      const newHash = await hashPassword(newPassword);
      await authMethodService.updatePasswordHash(authMethod.id, newHash);
      await prisma.user.update({
        where: { id: userId },
        data: { mustChangePassword: false },
      });

      logger.info({ userId }, 'Password changed successfully');

      res.json({ success: true, data: { message: 'Password changed successfully' } });
    } catch (error) {
      next(error);
    }
  }
}

export const passwordAuthController = new PasswordAuthController();
