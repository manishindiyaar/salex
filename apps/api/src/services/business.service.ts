/**
 * Business Service
 * 
 * Handles business CRUD operations for salon/shop management.
 * 
 * Key flows:
 * 1. Merchant creates business → auto-generates routing code
 * 2. Merchant views their business → includes services
 * 3. WhatsApp bot looks up business by routing code → public access
 */

import { prisma, Business, Service } from '@salex/shared-types';
import { routingService } from './routing.service';
import { logger } from '../utils/logger';
import { NotFoundError, ConflictError, BusinessRuleError } from '../utils/errors';
import { isDevelopment, getConfig } from '../config';
import type { CreateBusinessInput, UpdateBusinessInput } from '@salex/shared-types';

// Type for business with services included
type BusinessWithServices = Business & { services: Service[] };

/**
 * Ensure dev user exists in database (for development mode only)
 */
async function ensureDevUserExists(userId: string, phone: string): Promise<void> {
  const config = getConfig();
  if (!isDevelopment() || config.enableAuth) {
    return; // Only in dev mode with auth disabled
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    logger.info({ userId, phone }, '🔧 Creating dev user for testing');
    await prisma.user.create({
      data: {
        id: userId,
        phone,
        role: 'OWNER',
      },
    });
  }
}

class BusinessService {
  /**
   * Create a new business for a merchant
   * Auto-generates routing code if not provided
   */
  async create(ownerId: string, data: CreateBusinessInput): Promise<BusinessWithServices> {
    // In dev mode, ensure the mock user exists
    await ensureDevUserExists(ownerId, '+919876543210');

    // Check if user already has a business
    const existingBusiness = await prisma.business.findFirst({
      where: { ownerId },
    });

    if (existingBusiness) {
      throw new ConflictError('User already has a business registered');
    }

    // Generate routing code if not provided
    const routingCode = data.routingCode || await routingService.generateUniqueCode();

    // Check if provided routing code is already taken
    if (data.routingCode) {
      const isTaken = await routingService.isCodeTaken(data.routingCode);
      if (isTaken) {
        throw new ConflictError(`Routing code ${data.routingCode} is already in use`);
      }
    }

    const business = await prisma.business.create({
      data: {
        ownerId,
        name: data.name,
        phoneNumber: data.phoneNumber,
        routingCode,
        category: data.category ?? 'SALON', // Default to SALON if not provided
        hoursOfOperation: data.hoursOfOperation ?? undefined,
        maxConcurrentBookings: data.maxConcurrentBookings ?? 1,
        isAcceptingOrders: data.isAcceptingOrders ?? true,
      },
      include: {
        services: true,
      },
    });

    logger.info({ businessId: business.id, ownerId, routingCode }, 'Business created');

    return business;
  }

  /**
   * Get business by owner ID (for merchant dashboard)
   * Includes services for display
   */
  async getByOwnerId(ownerId: string): Promise<BusinessWithServices> {
    const business = await prisma.business.findFirst({
      where: { ownerId },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!business) {
      throw new NotFoundError('Business not found for this user');
    }

    return business;
  }

  /**
   * Get business by ID
   */
  async getById(id: string): Promise<BusinessWithServices> {
    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!business) {
      throw new NotFoundError('Business not found');
    }

    return business;
  }

  /**
   * Get business by routing code (for WhatsApp bot)
   * Public access - no auth required
   */
  async getByRoutingCode(code: string): Promise<{
    id: string;
    name: string;
    phoneNumber: string;
    routingCode: string | null;
    isAcceptingOrders: boolean;
    hoursOfOperation: unknown;
    services: Array<{
      id: string;
      name: string;
      description: string | null;
      price: unknown;
      durationMinutes: number;
    }>;
  }> {
    if (!routingService.isValidFormat(code)) {
      throw new BusinessRuleError('Invalid routing code format. Must be 4 digits.');
    }

    const business = await prisma.business.findUnique({
      where: { routingCode: code },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        routingCode: true,
        isAcceptingOrders: true,
        hoursOfOperation: true,
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            durationMinutes: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!business) {
      throw new NotFoundError(`No business found with routing code: ${code}`);
    }

    return business;
  }

  /**
   * Update business details
   * Only owner can update their business
   */
  async update(id: string, ownerId: string, data: UpdateBusinessInput): Promise<BusinessWithServices> {
    // Verify ownership
    const business = await prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundError('Business not found');
    }

    if (business.ownerId !== ownerId) {
      throw new BusinessRuleError('You can only update your own business');
    }

    // Check routing code uniqueness if being changed
    if (data.routingCode && data.routingCode !== business.routingCode) {
      const isTaken = await routingService.isCodeTaken(data.routingCode);
      if (isTaken) {
        throw new ConflictError(`Routing code ${data.routingCode} is already in use`);
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.routingCode !== undefined) updateData.routingCode = data.routingCode;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.hoursOfOperation !== undefined) updateData.hoursOfOperation = data.hoursOfOperation;
    if (data.maxConcurrentBookings !== undefined) updateData.maxConcurrentBookings = data.maxConcurrentBookings;
    if (data.isAcceptingOrders !== undefined) updateData.isAcceptingOrders = data.isAcceptingOrders;

    const updated = await prisma.business.update({
      where: { id },
      data: updateData,
      include: {
        services: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    logger.info({ businessId: id, ownerId }, 'Business updated');

    return updated;
  }
}

export const businessService = new BusinessService();
