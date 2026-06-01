/**
 * AuthMethod Service
 * CRUD helpers for the AuthMethod table.
 */

import { prisma } from '@salex/shared-types';
import type { AuthMethod } from '@salex/shared-types';

class AuthMethodService {
  /** Find enabled password method by normalized phone */
  async findEnabledPassword(phone: string): Promise<AuthMethod | null> {
    return prisma.authMethod.findFirst({
      where: {
        type: 'PASSWORD',
        identifier: phone,
        status: 'ENABLED',
      },
    });
  }

  /** Create a password auth method */
  async createPassword(userId: string, phone: string, secretHash: string): Promise<AuthMethod> {
    return prisma.authMethod.create({
      data: {
        userId,
        type: 'PASSWORD',
        identifier: phone,
        secretHash,
        status: 'ENABLED',
      },
    });
  }

  /** Update password hash */
  async updatePasswordHash(id: string, secretHash: string): Promise<AuthMethod> {
    return prisma.authMethod.update({
      where: { id },
      data: { secretHash, updatedAt: new Date() },
    });
  }

  /** Update lastUsedAt */
  async touchLastUsed(id: string): Promise<void> {
    await prisma.authMethod.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  /** Disable all auth methods for a user */
  async disableAllForUser(userId: string): Promise<void> {
    await prisma.authMethod.updateMany({
      where: { userId },
      data: { status: 'DISABLED' },
    });
  }

  /** Enable all auth methods for a user */
  async enableAllForUser(userId: string): Promise<void> {
    await prisma.authMethod.updateMany({
      where: { userId, status: 'DISABLED' },
      data: { status: 'ENABLED' },
    });
  }
}

export const authMethodService = new AuthMethodService();
