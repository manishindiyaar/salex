"use strict";
/**
 * Admin Business Management Controller
 *
 * Handles admin operations for business management including:
 * - Listing and searching businesses
 * - Viewing business details with analytics
 * - Toggling business active status
 * - Changing subscription plans
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminBusinessController = void 0;
const zod_1 = require("zod");
const shared_types_1 = require("@salex/shared-types");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const subscription_service_1 = require("../services/subscription.service");
// Validation schemas
const ListBusinessesSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    search: zod_1.z.string().optional(),
    plan: zod_1.z.enum(['BASIC', 'PRO', 'CUSTOM']).optional(),
    status: zod_1.z.enum(['TRIAL', 'ACTIVE', 'GRACE', 'EXPIRED', 'CANCELLED']).optional(),
    category: zod_1.z.enum(['SALON', 'BEAUTY_PARLOR', 'SPA', 'CLINIC', 'FITNESS', 'OTHER']).optional(),
    isActive: zod_1.z.preprocess((val) => val === 'true' ? true : val === 'false' ? false : undefined, zod_1.z.boolean().optional()),
});
const ChangePlanSchema = zod_1.z.object({
    plan: zod_1.z.enum(['BASIC', 'PRO', 'CUSTOM']),
    reason: zod_1.z.string().min(1, 'Reason is required for plan changes'),
});
class AdminBusinessController {
    /**
     * GET /v1/admin/businesses
     * List all businesses with pagination, search, and filters
     */
    async listBusinesses(req, res) {
        try {
            const query = ListBusinessesSchema.parse(req.query);
            const { page, limit, search, plan, status, category, isActive } = query;
            const offset = (page - 1) * limit;
            // Build where clause for filtering
            const where = {};
            // Search by name, phone, or routing code
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { phoneNumber: { contains: search } },
                    { routingCode: { contains: search, mode: 'insensitive' } },
                ];
            }
            // Filter by category
            if (category) {
                where.category = category;
            }
            // Filter by active status
            if (isActive !== undefined) {
                where.isActive = isActive;
            }
            // Filter by subscription plan and status
            if (plan || status) {
                where.subscription = {};
                if (plan)
                    where.subscription.plan = plan;
                if (status)
                    where.subscription.status = status;
            }
            // Get businesses with subscription and basic stats
            const [businesses, totalCount] = await Promise.all([
                shared_types_1.prisma.business.findMany({
                    where,
                    include: {
                        subscription: true,
                        owner: {
                            select: { id: true, phone: true },
                        },
                        _count: {
                            select: {
                                bookings: true,
                                services: true,
                                resources: true,
                                staff: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: offset,
                    take: limit,
                }),
                shared_types_1.prisma.business.count({ where }),
            ]);
            // Calculate additional metrics for each business
            const businessesWithMetrics = await Promise.all(businesses.map(async (business) => {
                // Get recent booking count (last 30 days)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const recentBookings = await shared_types_1.prisma.booking.count({
                    where: {
                        businessId: business.id,
                        createdAt: { gte: thirtyDaysAgo },
                    },
                });
                // Get total revenue (sum of completed bookings)
                const revenueResult = await shared_types_1.prisma.booking.aggregate({
                    where: {
                        businessId: business.id,
                        status: 'COMPLETED',
                    },
                    _sum: { totalPrice: true },
                });
                return {
                    id: business.id,
                    name: business.name,
                    phoneNumber: business.phoneNumber,
                    routingCode: business.routingCode,
                    category: business.category,
                    isActive: business.isActive,
                    onboardingCompleted: business.onboardingCompleted,
                    createdAt: business.createdAt,
                    owner: business.owner,
                    subscription: business.subscription,
                    metrics: {
                        totalBookings: business._count.bookings,
                        recentBookings,
                        totalRevenue: revenueResult._sum.totalPrice || 0,
                        servicesCount: business._count.services,
                        resourcesCount: business._count.resources,
                        staffCount: business._count.staff,
                    },
                };
            }));
            const totalPages = Math.ceil(totalCount / limit);
            res.json({
                success: true,
                data: {
                    businesses: businessesWithMetrics,
                    pagination: {
                        page,
                        limit,
                        totalCount,
                        totalPages,
                        hasNext: page < totalPages,
                        hasPrev: page > 1,
                    },
                },
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new errors_1.ValidationError('Invalid query parameters', error.errors);
            }
            throw error;
        }
    }
    /**
     * GET /v1/admin/businesses/:id
     * Get detailed business information with analytics
     */
    async getBusinessDetails(req, res) {
        try {
            const { id } = req.params;
            const business = await shared_types_1.prisma.business.findUnique({
                where: { id },
                include: {
                    subscription: {
                        include: {
                            payments: {
                                orderBy: { createdAt: 'desc' },
                                take: 10,
                            },
                        },
                    },
                    owner: {
                        select: { id: true, phone: true, createdAt: true },
                    },
                    services: {
                        where: { isActive: true },
                        select: { id: true, name: true, price: true, durationMinutes: true },
                    },
                    resources: {
                        where: { isActive: true },
                        select: { id: true, name: true, description: true },
                    },
                    staff: {
                        where: { isActive: true },
                        select: { id: true, name: true, phone: true },
                    },
                    moduleConfigs: true,
                    bookings: {
                        orderBy: { createdAt: 'desc' },
                        take: 20,
                        include: {
                            customer: {
                                select: { id: true, name: true, phoneNumber: true },
                            },
                            items: {
                                include: {
                                    service: {
                                        select: { name: true },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            if (!business) {
                throw new errors_1.NotFoundError('Business not found');
            }
            // Calculate analytics
            const analytics = await this.calculateBusinessAnalytics(id);
            res.json({
                success: true,
                data: {
                    business,
                    analytics,
                },
            });
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * POST /v1/admin/businesses/:id/toggle
     * Toggle business active status
     */
    async toggleBusinessStatus(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const business = await shared_types_1.prisma.business.findUnique({
                where: { id },
                select: { id: true, name: true, isActive: true },
            });
            if (!business) {
                throw new errors_1.NotFoundError('Business not found');
            }
            const newStatus = !business.isActive;
            // Update business status
            const updatedBusiness = await shared_types_1.prisma.business.update({
                where: { id },
                data: { isActive: newStatus },
            });
            // Log the action (audit log will be implemented later)
            logger_1.logger.info({
                adminId: req.admin.adminId,
                businessId: id,
                action: 'TOGGLE_BUSINESS_STATUS',
                previousStatus: business.isActive,
                newStatus,
                reason,
            }, 'Business status toggled by admin');
            res.json({
                success: true,
                data: {
                    business: updatedBusiness,
                    message: `Business ${newStatus ? 'activated' : 'deactivated'} successfully`,
                },
            });
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * PATCH /v1/admin/businesses/:id/plan
     * Change business subscription plan
     */
    async changeSubscriptionPlan(req, res) {
        try {
            const { id } = req.params;
            const { plan, reason } = ChangePlanSchema.parse(req.body);
            const business = await shared_types_1.prisma.business.findUnique({
                where: { id },
                include: { subscription: true },
            });
            if (!business) {
                throw new errors_1.NotFoundError('Business not found');
            }
            if (!business.subscription) {
                throw new errors_1.BusinessRuleError('Business has no subscription to modify');
            }
            const oldPlan = business.subscription.plan;
            // Update subscription plan
            const updatedSubscription = await subscription_service_1.subscriptionService.updatePlan(business.subscription.id, plan);
            // Log the action
            logger_1.logger.info({
                adminId: req.admin.adminId,
                businessId: id,
                subscriptionId: business.subscription.id,
                action: 'CHANGE_SUBSCRIPTION_PLAN',
                oldPlan,
                newPlan: plan,
                reason,
            }, 'Subscription plan changed by admin');
            res.json({
                success: true,
                data: {
                    subscription: updatedSubscription,
                    message: `Plan changed from ${oldPlan} to ${plan}`,
                },
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new errors_1.ValidationError('Invalid request data', error.errors);
            }
            throw error;
        }
    }
    /**
     * Calculate business analytics
     */
    async calculateBusinessAnalytics(businessId) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const [totalBookings, recentBookings, weeklyBookings, totalRevenue, recentRevenue, weeklyRevenue, totalCustomers, recentCustomers,] = await Promise.all([
            // Total bookings
            shared_types_1.prisma.booking.count({
                where: { businessId },
            }),
            // Recent bookings (30 days)
            shared_types_1.prisma.booking.count({
                where: {
                    businessId,
                    createdAt: { gte: thirtyDaysAgo },
                },
            }),
            // Weekly bookings (7 days)
            shared_types_1.prisma.booking.count({
                where: {
                    businessId,
                    createdAt: { gte: sevenDaysAgo },
                },
            }),
            // Total revenue
            shared_types_1.prisma.booking.aggregate({
                where: {
                    businessId,
                    status: 'COMPLETED',
                },
                _sum: { totalPrice: true },
            }),
            // Recent revenue (30 days)
            shared_types_1.prisma.booking.aggregate({
                where: {
                    businessId,
                    status: 'COMPLETED',
                    createdAt: { gte: thirtyDaysAgo },
                },
                _sum: { totalPrice: true },
            }),
            // Weekly revenue (7 days)
            shared_types_1.prisma.booking.aggregate({
                where: {
                    businessId,
                    status: 'COMPLETED',
                    createdAt: { gte: sevenDaysAgo },
                },
                _sum: { totalPrice: true },
            }),
            // Total unique customers
            shared_types_1.prisma.booking.findMany({
                where: { businessId },
                select: { customerId: true },
                distinct: ['customerId'],
            }),
            // Recent unique customers (30 days)
            shared_types_1.prisma.booking.findMany({
                where: {
                    businessId,
                    createdAt: { gte: thirtyDaysAgo },
                },
                select: { customerId: true },
                distinct: ['customerId'],
            }),
        ]);
        return {
            bookings: {
                total: totalBookings,
                recent: recentBookings,
                weekly: weeklyBookings,
            },
            revenue: {
                total: totalRevenue._sum.totalPrice || 0,
                recent: recentRevenue._sum.totalPrice || 0,
                weekly: weeklyRevenue._sum.totalPrice || 0,
            },
            customers: {
                total: totalCustomers.length,
                recent: recentCustomers.length,
            },
        };
    }
}
exports.adminBusinessController = new AdminBusinessController();
//# sourceMappingURL=admin-business.controller.js.map