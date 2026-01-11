/**
 * Service Catalog Service
 * 
 * Handles CRUD operations for services offered by businesses.
 * 
 * Key features:
 * - Create services with business ownership validation
 * - List services with active/inactive filter
 * - Soft delete (set isActive = false)
 * - Deletion protection (check for active bookings)
 */

import { prisma, Service } from '@salex/shared-types';
import { logger } from '../utils/logger';
import { NotFoundError, ConflictError, BusinessRuleError } from '../utils/errors';
import type { CreateServiceInput, UpdateServiceInput } from '@salex/shared-types';

class ServiceService {
  /**
   * Create a new service for a business
   * Validates that the user owns the business
   */
  async create(
    businessId: string,
    ownerId: string,
    data: CreateServiceInput
  ): Promise<Service> {
    // Verify business ownership
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundError('Business not found');
    }

    if (business.ownerId !== ownerId) {
      throw new BusinessRuleError('You can only add services to your own business');
    }

    // Check if business is active (not suspended by admin)
    if (!business.isActive) {
      throw new BusinessRuleError('Business account is suspended. Please contact support.');
    }

    // Check for duplicate service name in this business
    const existingService = await prisma.service.findUnique({
      where: {
        businessId_name: {
          businessId,
          name: data.name,
        },
      },
    });

    if (existingService) {
      throw new ConflictError(`Service "${data.name}" already exists in this business`);
    }

    const service = await prisma.service.create({
      data: {
        businessId,
        name: data.name,
        description: data.description || null,
        price: data.price,
        durationMinutes: data.durationMinutes ?? 30,
        isActive: data.isActive ?? true,
      },
    });

    logger.info({ serviceId: service.id, businessId }, 'Service created');

    return service;
  }

  /**
   * Get all services for a business
   * Optionally include inactive services
   */
  async listByBusinessId(
    businessId: string,
    includeInactive: boolean = false
  ): Promise<Service[]> {
    const services = await prisma.service.findMany({
      where: {
        businessId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
    });

    return services;
  }

  /**
   * Get a single service by ID
   */
  async getById(id: string): Promise<Service> {
    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    return service;
  }

  /**
   * Update a service
   * Validates ownership through business
   */
  async update(
    id: string,
    ownerId: string,
    data: UpdateServiceInput
  ): Promise<Service> {
    // Get service with business
    const service = await prisma.service.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    if (service.business.ownerId !== ownerId) {
      throw new BusinessRuleError('You can only update services in your own business');
    }

    // Check if business is active (not suspended by admin)
    if (!service.business.isActive) {
      throw new BusinessRuleError('Business account is suspended. Please contact support.');
    }

    // Check for duplicate name if name is being changed
    if (data.name && data.name !== service.name) {
      const existingService = await prisma.service.findUnique({
        where: {
          businessId_name: {
            businessId: service.businessId,
            name: data.name,
          },
        },
      });

      if (existingService) {
        throw new ConflictError(`Service "${data.name}" already exists in this business`);
      }
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    logger.info({ serviceId: id }, 'Service updated');

    return updated;
  }

  /**
   * Soft delete a service (set isActive = false)
   * Checks for active bookings before deletion
   */
  async softDelete(id: string, ownerId: string): Promise<Service> {
    // Get service with business
    const service = await prisma.service.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    if (service.business.ownerId !== ownerId) {
      throw new BusinessRuleError('You can only delete services in your own business');
    }

    // Check if business is active (not suspended by admin)
    if (!service.business.isActive) {
      throw new BusinessRuleError('Business account is suspended. Please contact support.');
    }

    // Check for active bookings using this service
    const activeBookings = await prisma.bookingItem.count({
      where: {
        serviceId: id,
        booking: {
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
      },
    });

    if (activeBookings > 0) {
      throw new BusinessRuleError(
        `Cannot delete service with ${activeBookings} active booking(s). ` +
        'Complete or cancel the bookings first.'
      );
    }

    // Soft delete - set isActive to false
    const deleted = await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info({ serviceId: id }, 'Service soft deleted');

    return deleted;
  }

  /**
   * Hard delete a service (permanent)
   * Only allowed if no bookings reference this service
   */
  async hardDelete(id: string, ownerId: string): Promise<void> {
    // Get service with business
    const service = await prisma.service.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    if (service.business.ownerId !== ownerId) {
      throw new BusinessRuleError('You can only delete services in your own business');
    }

    // Check if business is active (not suspended by admin)
    if (!service.business.isActive) {
      throw new BusinessRuleError('Business account is suspended. Please contact support.');
    }

    // Check for any bookings (including completed) using this service
    const anyBookings = await prisma.bookingItem.count({
      where: { serviceId: id },
    });

    if (anyBookings > 0) {
      throw new BusinessRuleError(
        'Cannot permanently delete service with booking history. Use soft delete instead.'
      );
    }

    await prisma.service.delete({
      where: { id },
    });

    logger.info({ serviceId: id }, 'Service permanently deleted');
  }
}

export const serviceService = new ServiceService();
