/**
 * Staff Service
 * 
 * Manages staff members who perform services.
 * Handles CRUD operations, resource linking, utilization tracking, and deactivation protection.
 */

import { prisma, Staff, ResourceStaffLink } from '@salex/shared-types';
import { CreateStaffInput, UpdateStaffInput, LinkResourceInput } from '@salex/shared-types';
import { logger } from '../utils/logger';
import { NotFoundError, ConflictError, BusinessRuleError } from '../utils/errors';

export interface LinkedResource {
  id: string;
  name: string;
  isPrimary: boolean;
}

export interface StaffWithStats extends Staff {
  linkedResources: LinkedResource[];
  utilizationPercent: number;
  activeBookingsCount: number;
}

class StaffService {
  /**
   * Create a staff member
   */
  async create(
    businessId: string,
    ownerId: string,
    data: CreateStaffInput
  ): Promise<Staff> {
    // Verify business ownership
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });

    if (!business) {
      throw new NotFoundError('Business not found');
    }

    if (business.ownerId !== ownerId) {
      throw new BusinessRuleError('You can only manage staff for your own business');
    }

    // Check for duplicate name
    const existing = await prisma.staff.findUnique({
      where: { businessId_name: { businessId, name: data.name } },
    });

    if (existing) {
      throw new ConflictError(`Staff member with name "${data.name}" already exists`);
    }

    // Create staff with optional resource links
    const staff = await prisma.$transaction(async (tx) => {
      const newStaff = await tx.staff.create({
        data: {
          businessId,
          name: data.name,
          phone: data.phone || null,
        },
      });

      // Create resource links if provided
      if (data.linkedResourceIds && data.linkedResourceIds.length > 0) {
        // Verify all resources exist and belong to the business
        const resources = await tx.resource.findMany({
          where: {
            id: { in: data.linkedResourceIds },
            businessId,
          },
        });

        if (resources.length !== data.linkedResourceIds.length) {
          throw new NotFoundError('One or more resources not found');
        }

        await tx.resourceStaffLink.createMany({
          data: data.linkedResourceIds.map((resourceId, index) => ({
            staffId: newStaff.id,
            resourceId,
            isPrimary: index === 0, // First one is primary
          })),
        });
      }

      return newStaff;
    });

    logger.info({ staffId: staff.id, businessId, name: data.name }, 'Staff created');
    return staff;
  }

  /**
   * Get a staff member by ID
   */
  async getById(id: string, businessId: string, ownerId: string): Promise<Staff> {
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        business: { select: { ownerId: true } },
      },
    });

    if (!staff) {
      throw new NotFoundError('Staff member not found');
    }

    if (staff.businessId !== businessId) {
      throw new NotFoundError('Staff member not found');
    }

    if (staff.business.ownerId !== ownerId) {
      throw new BusinessRuleError('You can only view staff for your own business');
    }

    return staff;
  }

  /**
   * List all staff for a business with utilization stats
   */
  async list(
    businessId: string,
    ownerId: string,
    includeInactive = false
  ): Promise<StaffWithStats[]> {
    // Verify business ownership
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });

    if (!business) {
      throw new NotFoundError('Business not found');
    }

    if (business.ownerId !== ownerId) {
      throw new BusinessRuleError('You can only view staff for your own business');
    }

    const staffMembers = await prisma.staff.findMany({
      where: {
        businessId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        resourceLinks: {
          include: {
            resource: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Calculate utilization for each staff member (last 7 days)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const staffWithStats = await Promise.all(
      staffMembers.map(async (staff) => {
        const [activeBookings, completedBookings] = await Promise.all([
          // Active bookings count
          prisma.booking.count({
            where: {
              staffId: staff.id,
              status: { in: ['PENDING', 'CONFIRMED'] },
            },
          }),
          // Completed bookings in last 7 days for utilization
          prisma.booking.findMany({
            where: {
              staffId: staff.id,
              status: 'COMPLETED',
              scheduledAt: { gte: weekAgo },
            },
            select: { scheduledAt: true, endAt: true },
          }),
        ]);

        // Calculate utilization (booked minutes / total minutes in week)
        const totalMinutesInWeek = 7 * 24 * 60;
        const bookedMinutes = completedBookings.reduce((sum, booking) => {
          const duration = (booking.endAt.getTime() - booking.scheduledAt.getTime()) / 60000;
          return sum + duration;
        }, 0);
        const utilizationPercent = Math.round((bookedMinutes / totalMinutesInWeek) * 100);

        // Map linked resources
        const linkedResources: LinkedResource[] = staff.resourceLinks.map((link) => ({
          id: link.resource.id,
          name: link.resource.name,
          isPrimary: link.isPrimary,
        }));

        return {
          id: staff.id,
          businessId: staff.businessId,
          name: staff.name,
          phone: staff.phone,
          isActive: staff.isActive,
          createdAt: staff.createdAt,
          updatedAt: staff.updatedAt,
          linkedResources,
          utilizationPercent: Math.min(utilizationPercent, 100),
          activeBookingsCount: activeBookings,
        };
      })
    );

    return staffWithStats;
  }

  /**
   * Update a staff member
   */
  async update(
    id: string,
    businessId: string,
    ownerId: string,
    data: UpdateStaffInput
  ): Promise<Staff> {
    const staff = await this.getById(id, businessId, ownerId);

    // Check for duplicate name if name is being changed
    if (data.name && data.name !== staff.name) {
      const existing = await prisma.staff.findUnique({
        where: { businessId_name: { businessId, name: data.name } },
      });

      if (existing) {
        throw new ConflictError(`Staff member with name "${data.name}" already exists`);
      }
    }

    const updated = await prisma.staff.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
    });

    logger.info({ staffId: id }, 'Staff updated');
    return updated;
  }

  /**
   * Deactivate a staff member (soft delete)
   * Prevents deactivation if staff has active bookings
   */
  async deactivate(id: string, businessId: string, ownerId: string): Promise<Staff> {
    const staff = await this.getById(id, businessId, ownerId);

    if (!staff.isActive) {
      throw new BusinessRuleError('Staff member is already inactive');
    }

    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        staffId: id,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (activeBookings > 0) {
      throw new ConflictError(
        `Cannot deactivate staff with ${activeBookings} active booking(s). ` +
        'Complete or reassign bookings first.'
      );
    }

    const updated = await prisma.staff.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info({ staffId: id }, 'Staff deactivated');
    return updated;
  }

  /**
   * Reactivate a staff member
   */
  async reactivate(id: string, businessId: string, ownerId: string): Promise<Staff> {
    const staff = await this.getById(id, businessId, ownerId);

    if (staff.isActive) {
      throw new BusinessRuleError('Staff member is already active');
    }

    const updated = await prisma.staff.update({
      where: { id },
      data: { isActive: true },
    });

    logger.info({ staffId: id }, 'Staff reactivated');
    return updated;
  }

  /**
   * Link a staff member to a resource
   */
  async linkToResource(
    staffId: string,
    businessId: string,
    ownerId: string,
    data: LinkResourceInput
  ): Promise<ResourceStaffLink> {
    // Verify staff exists and ownership
    await this.getById(staffId, businessId, ownerId);

    // Verify resource exists and belongs to same business
    const resource = await prisma.resource.findUnique({
      where: { id: data.resourceId },
    });

    if (!resource || resource.businessId !== businessId) {
      throw new NotFoundError('Resource not found');
    }

    // Check if link already exists
    const existingLink = await prisma.resourceStaffLink.findUnique({
      where: { resourceId_staffId: { resourceId: data.resourceId, staffId } },
    });

    if (existingLink) {
      throw new ConflictError('Staff is already linked to this resource');
    }

    const link = await prisma.resourceStaffLink.create({
      data: {
        staffId,
        resourceId: data.resourceId,
        isPrimary: data.isPrimary ?? false,
      },
    });

    logger.info({ staffId, resourceId: data.resourceId }, 'Staff linked to resource');
    return link;
  }

  /**
   * Unlink a staff member from a resource
   */
  async unlinkFromResource(
    staffId: string,
    resourceId: string,
    businessId: string,
    ownerId: string
  ): Promise<void> {
    // Verify staff exists and ownership
    await this.getById(staffId, businessId, ownerId);

    const link = await prisma.resourceStaffLink.findUnique({
      where: { resourceId_staffId: { resourceId, staffId } },
    });

    if (!link) {
      throw new NotFoundError('Link not found');
    }

    await prisma.resourceStaffLink.delete({
      where: { id: link.id },
    });

    logger.info({ staffId, resourceId }, 'Staff unlinked from resource');
  }

  /**
   * Get linked resources for a staff member
   */
  async getLinkedResources(
    staffId: string,
    businessId: string,
    ownerId: string
  ): Promise<LinkedResource[]> {
    await this.getById(staffId, businessId, ownerId);

    const links = await prisma.resourceStaffLink.findMany({
      where: { staffId },
      include: {
        resource: { select: { id: true, name: true } },
      },
    });

    return links.map((link) => ({
      id: link.resource.id,
      name: link.resource.name,
      isPrimary: link.isPrimary,
    }));
  }

  /**
   * Get count of active staff for a business
   */
  async getActiveCount(businessId: string): Promise<number> {
    return prisma.staff.count({
      where: { businessId, isActive: true },
    });
  }
}

export const staffService = new StaffService();
