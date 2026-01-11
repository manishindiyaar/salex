/**
 * User Service
 * 
 * Handles user CRUD operations.
 */

import { prisma, User } from '@salex/shared-types';
import { logger } from '../utils/logger';

class UserService {
  /**
   * Find user by phone number
   */
  async findByPhone(phone: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { phone },
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find or create user by phone number
   * Used during OTP verification
   */
  async findOrCreate(phone: string): Promise<User> {
    let user = await this.findByPhone(phone);

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          role: 'OWNER',
        },
      });
      logger.info({ userId: user.id, phone }, 'New user created');
    } else {
      logger.info({ userId: user.id, phone }, 'Existing user found');
    }

    return user;
  }

  /**
   * Get user with their businesses
   */
  async findWithBusinesses(userId: string): Promise<User & { businesses: any[] } | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        businesses: {
          include: {
            services: {
              where: { isActive: true },
            },
          },
        },
      },
    });
  }

  /**
   * Update user role
   */
  async updateRole(userId: string, role: 'OWNER' | 'STAFF'): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }
}

export const userService = new UserService();
