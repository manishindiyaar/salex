"use strict";
/**
 * Staff Service
 *
 * Manages staff members who perform services.
 * Handles CRUD operations, resource linking, utilization tracking, and deactivation protection.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffService = void 0;
const shared_types_1 = require("@salex/shared-types");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class StaffService {
    /**
     * Create a staff member
     */
    async create(businessId, ownerId, data) {
        // Verify business ownership
        const business = await shared_types_1.prisma.business.findUnique({
            where: { id: businessId },
            select: { ownerId: true },
        });
        if (!business) {
            throw new errors_1.NotFoundError('Business not found');
        }
        if (business.ownerId !== ownerId) {
            throw new errors_1.BusinessRuleError('You can only manage staff for your own business');
        }
        // Check for duplicate name
        const existing = await shared_types_1.prisma.staff.findUnique({
            where: { businessId_name: { businessId, name: data.name } },
        });
        if (existing) {
            throw new errors_1.ConflictError(`Staff member with name "${data.name}" already exists`);
        }
        // Create staff with optional resource links
        const staff = await shared_types_1.prisma.$transaction(async (tx) => {
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
                    throw new errors_1.NotFoundError('One or more resources not found');
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
        logger_1.logger.info({ staffId: staff.id, businessId, name: data.name }, 'Staff created');
        return staff;
    }
    /**
     * Get a staff member by ID
     */
    async getById(id, businessId, ownerId) {
        const staff = await shared_types_1.prisma.staff.findUnique({
            where: { id },
            include: {
                business: { select: { ownerId: true } },
            },
        });
        if (!staff) {
            throw new errors_1.NotFoundError('Staff member not found');
        }
        if (staff.businessId !== businessId) {
            throw new errors_1.NotFoundError('Staff member not found');
        }
        if (staff.business.ownerId !== ownerId) {
            throw new errors_1.BusinessRuleError('You can only view staff for your own business');
        }
        return staff;
    }
    /**
     * List all staff for a business with utilization stats
     */
    async list(businessId, ownerId, includeInactive = false) {
        // Verify business ownership
        const business = await shared_types_1.prisma.business.findUnique({
            where: { id: businessId },
            select: { ownerId: true },
        });
        if (!business) {
            throw new errors_1.NotFoundError('Business not found');
        }
        if (business.ownerId !== ownerId) {
            throw new errors_1.BusinessRuleError('You can only view staff for your own business');
        }
        const staffMembers = await shared_types_1.prisma.staff.findMany({
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
        const staffWithStats = await Promise.all(staffMembers.map(async (staff) => {
            const [activeBookings, completedBookings] = await Promise.all([
                // Active bookings count
                shared_types_1.prisma.booking.count({
                    where: {
                        staffId: staff.id,
                        status: { in: ['PENDING', 'CONFIRMED'] },
                    },
                }),
                // Completed bookings in last 7 days for utilization
                shared_types_1.prisma.booking.findMany({
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
            const linkedResources = staff.resourceLinks.map((link) => ({
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
        }));
        return staffWithStats;
    }
    /**
     * Update a staff member
     */
    async update(id, businessId, ownerId, data) {
        const staff = await this.getById(id, businessId, ownerId);
        // Check for duplicate name if name is being changed
        if (data.name && data.name !== staff.name) {
            const existing = await shared_types_1.prisma.staff.findUnique({
                where: { businessId_name: { businessId, name: data.name } },
            });
            if (existing) {
                throw new errors_1.ConflictError(`Staff member with name "${data.name}" already exists`);
            }
        }
        const updated = await shared_types_1.prisma.staff.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.phone !== undefined && { phone: data.phone }),
            },
        });
        logger_1.logger.info({ staffId: id }, 'Staff updated');
        return updated;
    }
    /**
     * Deactivate a staff member (soft delete)
     * Prevents deactivation if staff has active bookings
     */
    async deactivate(id, businessId, ownerId) {
        const staff = await this.getById(id, businessId, ownerId);
        if (!staff.isActive) {
            throw new errors_1.BusinessRuleError('Staff member is already inactive');
        }
        // Check for active bookings
        const activeBookings = await shared_types_1.prisma.booking.count({
            where: {
                staffId: id,
                status: { in: ['PENDING', 'CONFIRMED'] },
            },
        });
        if (activeBookings > 0) {
            throw new errors_1.ConflictError(`Cannot deactivate staff with ${activeBookings} active booking(s). ` +
                'Complete or reassign bookings first.');
        }
        const updated = await shared_types_1.prisma.staff.update({
            where: { id },
            data: { isActive: false },
        });
        logger_1.logger.info({ staffId: id }, 'Staff deactivated');
        return updated;
    }
    /**
     * Reactivate a staff member
     */
    async reactivate(id, businessId, ownerId) {
        const staff = await this.getById(id, businessId, ownerId);
        if (staff.isActive) {
            throw new errors_1.BusinessRuleError('Staff member is already active');
        }
        const updated = await shared_types_1.prisma.staff.update({
            where: { id },
            data: { isActive: true },
        });
        logger_1.logger.info({ staffId: id }, 'Staff reactivated');
        return updated;
    }
    /**
     * Link a staff member to a resource
     */
    async linkToResource(staffId, businessId, ownerId, data) {
        // Verify staff exists and ownership
        await this.getById(staffId, businessId, ownerId);
        // Verify resource exists and belongs to same business
        const resource = await shared_types_1.prisma.resource.findUnique({
            where: { id: data.resourceId },
        });
        if (!resource || resource.businessId !== businessId) {
            throw new errors_1.NotFoundError('Resource not found');
        }
        // Check if link already exists
        const existingLink = await shared_types_1.prisma.resourceStaffLink.findUnique({
            where: { resourceId_staffId: { resourceId: data.resourceId, staffId } },
        });
        if (existingLink) {
            throw new errors_1.ConflictError('Staff is already linked to this resource');
        }
        const link = await shared_types_1.prisma.resourceStaffLink.create({
            data: {
                staffId,
                resourceId: data.resourceId,
                isPrimary: data.isPrimary ?? false,
            },
        });
        logger_1.logger.info({ staffId, resourceId: data.resourceId }, 'Staff linked to resource');
        return link;
    }
    /**
     * Unlink a staff member from a resource
     */
    async unlinkFromResource(staffId, resourceId, businessId, ownerId) {
        // Verify staff exists and ownership
        await this.getById(staffId, businessId, ownerId);
        const link = await shared_types_1.prisma.resourceStaffLink.findUnique({
            where: { resourceId_staffId: { resourceId, staffId } },
        });
        if (!link) {
            throw new errors_1.NotFoundError('Link not found');
        }
        await shared_types_1.prisma.resourceStaffLink.delete({
            where: { id: link.id },
        });
        logger_1.logger.info({ staffId, resourceId }, 'Staff unlinked from resource');
    }
    /**
     * Get linked resources for a staff member
     */
    async getLinkedResources(staffId, businessId, ownerId) {
        await this.getById(staffId, businessId, ownerId);
        const links = await shared_types_1.prisma.resourceStaffLink.findMany({
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
    async getActiveCount(businessId) {
        return shared_types_1.prisma.staff.count({
            where: { businessId, isActive: true },
        });
    }
}
exports.staffService = new StaffService();
//# sourceMappingURL=staff.service.js.map