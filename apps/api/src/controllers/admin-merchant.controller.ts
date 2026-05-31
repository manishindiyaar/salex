/**
 * Admin Merchant Account Controller
 * Handles admin provisioning, password reset, disable/enable.
 */

import { Response } from 'express';
import { prisma } from '@salex/shared-types';
import { adminProvisionSchema, adminPasswordResetSchema } from '@salex/shared-types';
import { provisioningService } from '../services/provisioning.service';
import { authMethodService } from '../services/auth-method.service';
import { auditLogService } from '../services/audit-log.service';
import { hashPassword } from '../utils/password';
import { AdminRequest } from '../middlewares/admin-auth.middleware';
import { ValidationError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

class AdminMerchantController {
  /** POST /v1/admin/merchant-accounts */
  async provision(req: AdminRequest, res: Response) {
    const parsed = adminProvisionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid provisioning data', parsed.error);
    }

    const result = await provisioningService.provision(parsed.data, req.admin.adminId);

    res.status(201).json({ success: true, data: result });
  }

  /** POST /v1/admin/merchant-accounts/:userId/password-reset */
  async resetPassword(req: AdminRequest, res: Response) {
    const { userId } = req.params;
    const parsed = adminPasswordResetSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid request', parsed.error);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    const newHash = await hashPassword(parsed.data.newPassword);

    // Update or create password auth method
    const existing = await authMethodService.findEnabledPassword(user.phone);
    if (existing) {
      await authMethodService.updatePasswordHash(existing.id, newHash);
    } else {
      await authMethodService.createPassword(userId, user.phone, newHash);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { mustChangePassword: true },
    });

    await auditLogService.logAction({
      adminId: req.admin.adminId,
      action: 'ADMIN_RESET_MERCHANT_PASSWORD',
      entityType: 'User',
      entityId: userId,
      changes: { mustChangePassword: true },
      reason: parsed.data.reason,
    });

    logger.info({ adminId: req.admin.adminId, userId }, 'Admin reset merchant password');

    res.json({ success: true, data: { message: 'Password reset successfully' } });
  }

  /** POST /v1/admin/merchant-accounts/:userId/disable */
  async disable(req: AdminRequest, res: Response) {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    await prisma.user.update({ where: { id: userId }, data: { status: 'DISABLED' } });
    await authMethodService.disableAllForUser(userId);

    await auditLogService.logAction({
      adminId: req.admin.adminId,
      action: 'ADMIN_DISABLE_MERCHANT_LOGIN',
      entityType: 'User',
      entityId: userId,
      changes: { status: { from: user.status, to: 'DISABLED' } },
      reason: req.body.reason || 'Admin disabled account',
    });

    res.json({ success: true, data: { message: 'Account disabled' } });
  }

  /** POST /v1/admin/merchant-accounts/:userId/enable */
  async enable(req: AdminRequest, res: Response) {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    await prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
    await authMethodService.enableAllForUser(userId);

    await auditLogService.logAction({
      adminId: req.admin.adminId,
      action: 'ADMIN_ENABLE_MERCHANT_LOGIN',
      entityType: 'User',
      entityId: userId,
      changes: { status: { from: user.status, to: 'ACTIVE' } },
      reason: req.body.reason || 'Admin enabled account',
    });

    res.json({ success: true, data: { message: 'Account enabled' } });
  }
}

export const adminMerchantController = new AdminMerchantController();
