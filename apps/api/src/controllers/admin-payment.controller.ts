/**
 * Admin Payment Management Controller
 * 
 * Handles admin operations for payment management including:
 * - Recording manual payments
 * - Listing all payments with filters
 * - Getting business payment history
 * - Revenue analytics
 */

import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '@salex/shared-types';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import { AdminRequest } from '../middlewares/admin-auth.middleware';
import { subscriptionService } from '../services/subscription.service';
import { auditLogService } from '../services/audit-log.service';

// Validation schemas
const emptyStringToUndefined = z.preprocess(
  (val) => (val === '' || val === null ? undefined : val),
  z.string().datetime().optional()
);

const RecordPaymentSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  amount: z.number({ invalid_type_error: 'Amount must be a number' }).positive('Amount must be positive'),
  paymentMethod: z.enum(['bank_transfer', 'upi', 'cash', 'card', 'cheque', 'other']),
  transactionRef: z.string().max(100, 'Transaction reference is too long').optional(),
  periodStart: emptyStringToUndefined,
  periodEnd: emptyStringToUndefined,
  notes: z.string().max(1000, 'Notes are too long').optional(),
}).refine(data => {
  if (data.periodStart && data.periodEnd) {
    return new Date(data.periodEnd) >= new Date(data.periodStart);
  }
  return true;
}, {
  message: 'Period end date must be after or equal to period start date',
  path: ['periodEnd'],
});

const ListPaymentsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  paymentMethod: z.enum(['gpay', 'upi', 'bank_transfer', 'cash', 'card', 'cheque', 'other']).optional(),
  businessId: z.string().optional(),
});

class AdminPaymentController {
  /**
   * POST /v1/admin/payments
   * Record manual payment for a subscription
   */
  async recordPayment(req: AdminRequest, res: Response) {
    try {
      const paymentData = RecordPaymentSchema.parse(req.body);
      const { businessId, amount, paymentMethod, transactionRef, periodStart, periodEnd, notes } = paymentData;

      // Find subscription by businessId
      let subscription = await prisma.subscription.findUnique({
        where: { businessId },
        include: {
          business: {
            select: { id: true, name: true },
          },
        },
      });

      if (!subscription) {
        // Automatically create a subscription if one doesn't exist to heal legacy/seeded data
        const businessExists = await prisma.business.findUnique({
          where: { id: businessId },
        });
        if (!businessExists) {
          throw new NotFoundError('Business not found');
        }

        const newSub = await prisma.subscription.create({
          data: {
            businessId,
            plan: 'BASIC',
            status: 'TRIAL',
            trialEndsAt: new Date(),
          },
        });

        subscription = {
          ...newSub,
          business: { id: businessExists.id, name: businessExists.name },
        } as any;
      }

      if (!subscription) {
        throw new NotFoundError('Subscription not found');
      }

      // Record payment and activate subscription
      const result = await subscriptionService.recordPayment({
        subscriptionId: (subscription as any).id,
        amount,
        paymentMethod,
        transactionRef,
        periodStart: periodStart ? new Date(periodStart) : undefined,
        periodEnd: periodEnd ? new Date(periodEnd) : undefined,
        notes,
        recordedBy: req.admin.adminId,
      });

      // Log the action
      await auditLogService.logPaymentRecord(
        req.admin.adminId,
        result.payment.id,
        subscription.id,
        amount,
        paymentMethod,
        notes
      );

      logger.info(
        {
          adminId: req.admin.adminId,
          paymentId: result.payment.id,
          subscriptionId: subscription.id,
          businessId: subscription.business.id,
          amount,
          paymentMethod,
        },
        'Manual payment recorded by admin'
      );

      res.json({
        success: true,
        data: {
          payment: result.payment,
          subscription: result.subscription,
          business: subscription.business,
        },
        message: 'Payment recorded successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid payment data', error.errors);
      }
      throw error;
    }
  }

  /**
   * GET /v1/admin/payments
   * List all payments with pagination and filters
   */
  async listPayments(req: AdminRequest, res: Response) {
    try {
      const query = ListPaymentsSchema.parse(req.query);
      const { page, limit, startDate, endDate, paymentMethod, businessId } = query;

      const offset = (page - 1) * limit;

      // Build where clause for filtering
      const where: any = {};

      // Date range filter
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
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
        prisma.paymentRecord.findMany({
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
        prisma.paymentRecord.count({ where }),
      ]);

      // Calculate revenue totals for the filtered period
      const revenueResult = await prisma.paymentRecord.aggregate({
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid query parameters', error.errors);
      }
      throw error;
    }
  }

  /**
   * GET /v1/admin/businesses/:id/payments
   * Get payment history for a specific business
   */
  async getBusinessPayments(req: AdminRequest, res: Response) {
    const { id: businessId } = req.params;

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true },
    });

    if (!business) {
      throw new NotFoundError('Business not found');
    }

    // Get business subscription and payments
    const subscription = await prisma.subscription.findUnique({
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
    const totalRevenue = subscription.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

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

  /**
   * GET /v1/admin/payments/analytics
   * Get payment analytics and revenue metrics
   */
  async getPaymentAnalytics(req: AdminRequest, res: Response) {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    const where = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // Get analytics data
    const [
      totalRevenue,
      paymentMethodBreakdown,
      monthlyRevenue,
      planRevenue,
    ] = await Promise.all([
      // Total revenue and payment count
      prisma.paymentRecord.aggregate({
        where,
        _sum: { amount: true },
        _count: { id: true },
        _avg: { amount: true },
      }),

      // Payment method breakdown
      prisma.paymentRecord.groupBy({
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

  /**
   * Get monthly revenue trend
   */
  private async getMonthlyRevenueTrend(dateFilter: any) {
    // Get last 12 months of data
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const filter = {
      createdAt: {
        gte: twelveMonthsAgo,
        ...dateFilter,
      },
    };

    const monthlyData = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        SUM(amount) as revenue,
        COUNT(*) as payments
      FROM "PaymentRecord"
      WHERE "createdAt" >= ${filter.createdAt.gte}
        ${filter.createdAt.lte ? prisma.$queryRaw`AND "createdAt" <= ${filter.createdAt.lte}` : prisma.$queryRaw``}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `;

    return monthlyData;
  }

  /**
   * Get revenue breakdown by subscription plan
   */
  private async getRevenueByPlan(dateFilter: any) {
    const where = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const planRevenue = await prisma.paymentRecord.findMany({
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
    }, {} as Record<string, { revenue: number; payments: number }>);

    return Object.entries(planBreakdown).map(([plan, data]) => ({
      plan,
      revenue: data.revenue,
      payments: data.payments,
    }));
  }
}

export const adminPaymentController = new AdminPaymentController();
