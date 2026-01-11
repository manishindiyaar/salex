"use strict";
/**
 * Resource Service
 *
 * Manages physical bookable resources (chairs, beds, rooms, stations).
 * Handles CRUD operations, utilization tracking, and deactivation protection.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resourceService = void 0;
const shared_types_1 = require("@salex/shared-types");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class ResourceService {
    /**
     * Create a single resource
     * Auto-generates name if not provided
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
            throw new errors_1.BusinessRuleError('You can only manage resources for your own business');
        }
        // Auto-generate name if not provided
        let name = data.name;
        if (!name) {
            const count = await shared_types_1.prisma.resource.count({ where: { businessId } });
            name = `Chair ${count + 1}`;
        }
        // Check for duplicate name
        const existing = await shared_types_1.prisma.resource.findUnique({
            where: { businessId_name: { businessId, name } },
        });
        if (existing) {
            throw new errors_1.ConflictError(`Resource with name "${name}" already exists`);
        }
        const resource = await shared_types_1.prisma.resource.create({
            data: {
                businessId,
                name,
                description: data.description || null,
                displayOrder: data.displayOrder ?? 0,
            },
        });
        logger_1.logger.info({ resourceId: resource.id, businessId, name }, 'Resource created');
        return resource;
    }
    /**
     * Bulk create resources
     * Supports two formats:
     * 1. { count, prefix } - auto-generates names like "Chair 1", "Chair 2"
     * 2. { resources: [...] } - creates specific named resources
     */
    async createBulk(businessId, ownerId, data) {
        // Verify business ownership
        const business = await shared_types_1.prisma.business.findUnique({
            where: { id: businessId },
            select: { ownerId: true },
        });
        if (!business) {
            throw new errors_1.NotFoundError('Business not found');
        }
        if (business.ownerId !== ownerId) {
            throw new errors_1.BusinessRuleError('You can only manage resources for your own business');
        }
        const existingCount = await shared_types_1.prisma.resource.count({ where: { businessId } });
        // Determine which format was provided
        const isArrayFormat = 'resources' in data;
        // Create resources in a transaction
        const resources = await shared_types_1.prisma.$transaction(async (tx) => {
            const created = [];
            if (isArrayFormat) {
                // Format 2: Array of specific resources
                const resourcesData = data.resources;
                for (let i = 0; i < resourcesData.length; i++) {
                    const resourceInput = resourcesData[i];
                    const name = resourceInput.name;
                    // Check for duplicate
                    const existing = await tx.resource.findUnique({
                        where: { businessId_name: { businessId, name } },
                    });
                    if (existing) {
                        throw new errors_1.ConflictError(`Resource with name "${name}" already exists`);
                    }
                    const resource = await tx.resource.create({
                        data: {
                            businessId,
                            name,
                            description: resourceInput.description || null,
                            displayOrder: resourceInput.displayOrder ?? (existingCount + i),
                        },
                    });
                    created.push(resource);
                }
                logger_1.logger.info({ businessId, count: resourcesData.length, format: 'array' }, 'Bulk resources created');
            }
            else {
                // Format 1: count + prefix (auto-generate names)
                const { count, prefix } = data;
                for (let i = 0; i < count; i++) {
                    const name = `${prefix} ${existingCount + i + 1}`;
                    // Check for duplicate (shouldn't happen but be safe)
                    const existing = await tx.resource.findUnique({
                        where: { businessId_name: { businessId, name } },
                    });
                    if (existing) {
                        throw new errors_1.ConflictError(`Resource with name "${name}" already exists`);
                    }
                    const resource = await tx.resource.create({
                        data: {
                            businessId,
                            name,
                            displayOrder: existingCount + i,
                        },
                    });
                    created.push(resource);
                }
                logger_1.logger.info({ businessId, count, prefix, format: 'count-prefix' }, 'Bulk resources created');
            }
            return created;
        });
        return resources;
    }
    /**
     * Get a resource by ID
     */
    async getById(id, businessId, ownerId) {
        const resource = await shared_types_1.prisma.resource.findUnique({
            where: { id },
            include: {
                business: { select: { ownerId: true } },
            },
        });
        if (!resource) {
            throw new errors_1.NotFoundError('Resource not found');
        }
        if (resource.businessId !== businessId) {
            throw new errors_1.NotFoundError('Resource not found');
        }
        if (resource.business.ownerId !== ownerId) {
            throw new errors_1.BusinessRuleError('You can only view resources for your own business');
        }
        return resource;
    }
    /**
     * List all resources for a business with utilization stats
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
            throw new errors_1.BusinessRuleError('You can only view resources for your own business');
        }
        const resources = await shared_types_1.prisma.resource.findMany({
            where: {
                businessId,
                ...(includeInactive ? {} : { isActive: true }),
            },
            orderBy: { displayOrder: 'asc' },
        });
        // Calculate utilization for each resource (last 7 days)
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const resourcesWithStats = await Promise.all(resources.map(async (resource) => {
            const [activeBookings, completedBookings] = await Promise.all([
                // Active bookings count
                shared_types_1.prisma.booking.count({
                    where: {
                        resourceId: resource.id,
                        status: { in: ['PENDING', 'CONFIRMED'] },
                    },
                }),
                // Completed bookings in last 7 days for utilization
                shared_types_1.prisma.booking.findMany({
                    where: {
                        resourceId: resource.id,
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
            return {
                ...resource,
                utilizationPercent: Math.min(utilizationPercent, 100),
                activeBookingsCount: activeBookings,
            };
        }));
        return resourcesWithStats;
    }
    /**
     * Update a resource
     */
    async update(id, businessId, ownerId, data) {
        const resource = await this.getById(id, businessId, ownerId);
        // Check for duplicate name if name is being changed
        if (data.name && data.name !== resource.name) {
            const existing = await shared_types_1.prisma.resource.findUnique({
                where: { businessId_name: { businessId, name: data.name } },
            });
            if (existing) {
                throw new errors_1.ConflictError(`Resource with name "${data.name}" already exists`);
            }
        }
        const updated = await shared_types_1.prisma.resource.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
            },
        });
        logger_1.logger.info({ resourceId: id }, 'Resource updated');
        return updated;
    }
    /**
     * Deactivate a resource (soft delete)
     * Prevents deactivation if resource has active bookings
     */
    async deactivate(id, businessId, ownerId) {
        const resource = await this.getById(id, businessId, ownerId);
        if (!resource.isActive) {
            throw new errors_1.BusinessRuleError('Resource is already inactive');
        }
        // Check for active bookings
        const activeBookings = await shared_types_1.prisma.booking.count({
            where: {
                resourceId: id,
                status: { in: ['PENDING', 'CONFIRMED'] },
            },
        });
        if (activeBookings > 0) {
            throw new errors_1.ConflictError(`Cannot deactivate resource with ${activeBookings} active booking(s). ` +
                'Complete or reassign bookings first.');
        }
        const updated = await shared_types_1.prisma.resource.update({
            where: { id },
            data: { isActive: false },
        });
        logger_1.logger.info({ resourceId: id }, 'Resource deactivated');
        return updated;
    }
    /**
     * Reactivate a resource
     */
    async reactivate(id, businessId, ownerId) {
        const resource = await this.getById(id, businessId, ownerId);
        if (resource.isActive) {
            throw new errors_1.BusinessRuleError('Resource is already active');
        }
        const updated = await shared_types_1.prisma.resource.update({
            where: { id },
            data: { isActive: true },
        });
        logger_1.logger.info({ resourceId: id }, 'Resource reactivated');
        return updated;
    }
    /**
     * Get count of active resources for a business
     */
    async getActiveCount(businessId) {
        return shared_types_1.prisma.resource.count({
            where: { businessId, isActive: true },
        });
    }
}
exports.resourceService = new ResourceService();
//# sourceMappingURL=resource.service.js.map