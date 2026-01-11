"use strict";
/**
 * Admin Payment Management Controller
 *
 * Handles admin operations for payment management including:
 * - Recording manual payments
 * - Listing all payments with filters
 * - Getting business payment history
 * - Revenue analytics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPaymentController = void 0;
const zod_1 = require("zod");
const shared_types_1 = require("@salex/shared-types");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const subscription_service_1 = require("../services/subscription.service");
const audit_log_service_1 = require("../services/audit-log.service");
// Validation schemas
const RecordPaymentSchema = zod_1.z.object({
    subscriptionId: zod_1.z.string().min(1, 'Subscription ID is required'),
    amount: zod_1.z.number().positive('Amount must be positive'),
    paymentMethod: zod_1.z.enum(['gpay', 'upi', 'bank_transfer', 'cash', 'other']),
    transactionRef: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
const ListPaymentsSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    paymentMethod: zod_1.z.enum(['gpay', 'upi', 'bank_transfer', 'cash', 'other']).optional(),
    businessId: zod_1.z.string().optional(),
});
class AdminPaymentController {
    /**
     * POST /v1/admin/payments
     * Record manual payment for a subscription
     */
    async recordPayment(req, res) {
        try {
            const paymentData = RecordPaymentSchema.parse(req.body);
            const { subscriptionId, amount, paymentMethod, transactionRef, notes } = paymentData;
            // Verify subscription exists
            const subscription = await shared_types_1.prisma.subscription.findUnique({
                where: { id: subscriptionId },
                include: {
                    business: {
                        select: { id: true, name: true },
                    },
                },
            });
            if (!subscription) {
                throw new errors_1.NotFoundError('Subscription not found');
            }
            // Record payment and activate subscription
            const result = await subscription_service_1.subscriptionService.recordPayment({
                subscriptionId,
                amount,
                paymentMethod,
                transactionRef,
                notes,
                recordedBy: req.admin.adminId,
            });
            // Log the action
            await audit_log_service_1.auditLogService.logPaymentRecord(req.admin.adminId, result.payment.id, subscriptionId, amount, paymentMethod, notes);
            logger_1.logger.info({
                adminId: req.admin.adminId,
                paymentId: result.payment.id,
                subscriptionId,
                businessId: subscription.business.id,
                amount,
                paymentMethod,
            }, 'Manual payment recorded by admin');
            res.json({
                success: true,
                data: {
                    payment: result.payment,
                    subscription: result.subscription,
                    business: subscription.business,
                },
                message: 'Payment recorded successfully',
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new errors_1.ValidationError('Invalid payment data', error.errors);
            }
            throw error;
        }
    }
    /**
     * GET /v1/admin/payments
     * List all payments with pagination and filters
     */
    async listPayments(req, res) {
        try {
            const query = ListPaymentsSchema.parse(req.query);
            const { page, limit, startDate, endDate, paymentMethod, businessId } = query;
            const offset = (page - 1) * limit;
            // Build where clause for filtering
            const where = {};
            // Date range filter
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate)
                    where.createdAt.gte = new Date(startDate);
                if (endDate)
                    where.createdAt.lte = new Date(endDate);
            }
            // Payment method filter
            if (paymentMethod) {
                where.paymentMethod = paymentMethod;
            }
            // Business filter (via subscription)
            if (businessId) {
                where.subscription = {
                    businessId,
                };
            }
            // Get payments with related data
            const [payments, totalCount] = await Promise.all([
                shared_types_1.prisma.paymentRecord.findMany({
                    where,
                    include: {
                        subscription: {
                            include: {
                                business: {
                                    select: {
                                        id: true,
                                        name: true,
                                        phoneNumber: true,
                                        routingCode: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: offset,
                    take: limit,
                }),
                shared_types_1.prisma.paymentRecord.count({ where }),
            ]);
            // Calculate revenue totals for the filtered period
            const revenueResult = await shared_types_1.prisma.paymentRecord.aggregate({
                where,
                _sum: { amount: true },
                _count: { id: true },
            });
            const totalPages = Math.ceil(totalCount / limit);
            res.json({
                success: true,
                data: {
                    payments,
                    summary: {
                        totalRevenue: revenueResult._sum.amount || 0,
                        totalPayments: revenueResult._count.id,
                    },
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
     * GET /v1/admin/businesses/:id/payments
     * Get payment history for a specific business
     */
    async getBusinessPayments(req, res) {
        try {
            const { id: businessId } = req.params;
            // Verify business exists
            const business = await shared_types_1.prisma.business.findUnique({
                where: { id: businessId },
                select: { id: true, name: true },
            });
            if (!business) {
                throw new errors_1.NotFoundError('Business not found');
            }
            // Get business subscription and payments
            const subscription = await shared_types_1.prisma.subscription.findUnique({
                where: { businessId },
                include: {
                    payments: {
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
            if (!subscription) {
                return res.json({
                    success: true,
                    data: {
                        business,
                        subscription: null,
                        payments: [],
                        summary: {
                            totalRevenue: 0,
                            totalPayments: 0,
                        },
                    },
                });
            }
            // Calculate payment summary
            const totalRevenue = subscription.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
            res.json({
                success: true,
                data: {
                    business,
                    subscription: {
                        id: subscription.id,
                        plan: subscription.plan,
                        status: subscription.status,
                        currentPeriodStart: subscription.currentPeriodStart,
                        currentPeriodEnd: subscription.currentPeriodEnd,
                    },
                    payments: subscription.payments,
                    summary: {
                        totalRevenue,
                        totalPayments: subscription.payments.length,
                    },
                },
            });
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * GET /v1/admin/payments/analytics
     * Get payment analytics and revenue metrics
     */
    async getPaymentAnalytics(req, res) {
        try {
            const { startDate, endDate } = req.query;
            // Build date filter
            const dateFilter = {};
            if (startDate)
                dateFilter.gte = new Date(startDate);
            if (endDate)
                dateFilter.lte = new Date(endDate);
            const where = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
            // Get analytics data
            const [totalRevenue, paymentMethodBreakdown, monthlyRevenue, planRevenue,] = await Promise.all([
                // Total revenue and payment count
                shared_types_1.prisma.paymentRecord.aggregate({
                    where,
                    _sum: { amount: true },
                    _count: { id: true },
                    _avg: { amount: true },
                }),
                // Payment method breakdown
                shared_types_1.prisma.paymentRecord.groupBy({
                    by: ['paymentMethod'],
                    where,
                    _sum: { amount: true },
                    _count: { paymentMethod: true },
                    orderBy: { _sum: { amount: 'desc' } },
                }),
                // Monthly revenue trend (last 12 months)
                this.getMonthlyRevenueTrend(dateFilter),
                // Revenue by subscription plan
                this.getRevenueByPlan(dateFilter),
            ]);
            res.json({
                success: true,
                data: {
                    overview: {
                        totalRevenue: totalRevenue._sum.amount || 0,
                        totalPayments: totalRevenue._count.id,
                        averagePayment: totalRevenue._avg.amount || 0,
                    },
                    paymentMethodBreakdown,
                    monthlyRevenue,
                    planRevenue,
                },
            });
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Get monthly revenue trend
     */
    async getMonthlyRevenueTrend(dateFilter) {
        // Get last 12 months of data
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        const filter = {
            createdAt: {
                gte: twelveMonthsAgo,
                ...dateFilter,
            },
        };
        const monthlyData = await shared_types_1.prisma.$queryRaw `
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        SUM(amount) as revenue,
        COUNT(*) as payments
      FROM "PaymentRecord"
      WHERE "createdAt" >= ${filter.createdAt.gte}
        ${filter.createdAt.lte ? shared_types_1.prisma.$queryRaw `AND "createdAt" <= ${filter.createdAt.lte}` : shared_types_1.prisma.$queryRaw ``}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `;
        return monthlyData;
    }
    /**
     * Get revenue breakdown by subscription plan
     */
    async getRevenueByPlan(dateFilter) {
        const where = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
        const planRevenue = await shared_types_1.prisma.paymentRecord.findMany({
            where,
            include: {
                subscription: {
                    select: { plan: true },
                },
            },
        });
        // Group by plan
        const planBreakdown = planRevenue.reduce((acc, payment) => {
            const plan = payment.subscription.plan;
            if (!acc[plan]) {
                acc[plan] = { revenue: 0, payments: 0 };
            }
            acc[plan].revenue += Number(payment.amount);
            acc[plan].payments += 1;
            return acc;
        }, {});
        return Object.entries(planBreakdown).map(([plan, data]) => ({
            plan,
            revenue: data.revenue,
            payments: data.payments,
        }));
    }
}
exports.adminPaymentController = new AdminPaymentController();
//# sourceMappingURL=admin-payment.controller.js.map