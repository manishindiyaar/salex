/**
 * Admin Data Export Controller
 * 
 * Handles data export functionality for admin dashboard including:
 * - Exporting businesses to CSV
 * - Exporting payments to CSV
 * - Custom field selection and filtering
 */

import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '@salex/shared-types';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';
import { AdminRequest } from '../middlewares/admin-auth.middleware';

// Validation schemas
const ExportBusinessesSchema = z.object({
  fields: z.array(z.enum([
    'id', 'name', 'phoneNumber', 'routingCode', 'category', 'isActive',
    'onboardingCompleted', 'createdAt', 'ownerPhone', 'subscriptionPlan',
    'subscriptionStatus', 'totalBookings', 'totalRevenue'
  ])).optional().default([
    'name', 'phoneNumber', 'routingCode', 'category', 'isActive', 'createdAt'
  ]),
  category: z.enum(['SALON', 'BEAUTY_PARLOR', 'SPA', 'CLINIC', 'FITNESS', 'OTHER']).optional(),
  isActive: z.preprocess(
    (val) => val === 'true' ? true : val === 'false' ? false : undefined,
    z.boolean().optional()
  ),
  subscriptionPlan: z.enum(['BASIC', 'PRO', 'CUSTOM']).optional(),
  subscriptionStatus: z.enum(['TRIAL', 'ACTIVE', 'GRACE', 'EXPIRED', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const ExportPaymentsSchema = z.object({
  fields: z.array(z.enum([
    'id', 'amount', 'currency', 'paymentMethod', 'transactionRef', 'createdAt',
    'businessName', 'businessPhone', 'subscriptionPlan', 'periodStart', 'periodEnd', 'notes'
  ])).optional().default([
    'amount', 'paymentMethod', 'createdAt', 'businessName', 'subscriptionPlan'
  ]),
  paymentMethod: z.enum(['gpay', 'upi', 'bank_transfer', 'cash', 'other']).optional(),
  businessId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

class AdminExportController {
  /**
   * GET /v1/admin/export/businesses
   * Export businesses to CSV
   */
  async exportBusinesses(req: AdminRequest, res: Response) {
    try {
      const query = ExportBusinessesSchema.parse(req.query);
      const { fields, category, isActive, subscriptionPlan, subscriptionStatus, startDate, endDate } = query;

      // Build where clause for filtering
      const where: any = {};

      if (category) where.category = category;
      if (isActive !== undefined) where.isActive = isActive;

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      // Add subscription filters
      if (subscriptionPlan || subscriptionStatus) {
        where.subscription = {};
        if (subscriptionPlan) where.subscription.plan = subscriptionPlan;
        if (subscriptionStatus) where.subscription.status = subscriptionStatus;
      }

      // Get businesses with related data
      const businesses = await prisma.business.findMany({
        where,
        include: {
          owner: {
            select: { phone: true },
          },
          subscription: {
            select: { plan: true, status: true },
          },
          _count: {
            select: { bookings: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate revenue for each business if needed
      const businessesWithRevenue = await Promise.all(
        businesses.map(async (business) => {
          let totalRevenue = 0;
          
          if (fields.includes('totalRevenue')) {
            const revenueResult = await prisma.booking.aggregate({
              where: {
                businessId: business.id,
                status: 'COMPLETED',
              },
              _sum: { totalPrice: true },
            });
            totalRevenue = Number(revenueResult._sum.totalPrice || 0);
          }

          return {
            ...business,
            totalRevenue,
          };
        })
      );

      // Generate CSV content
      const csvContent = this.generateBusinessCSV(businessesWithRevenue, fields);

      // Log the export action
      logger.info(
        {
          adminId: req.admin.adminId,
          exportType: 'businesses',
          recordCount: businesses.length,
          fields,
          filters: { category, isActive, subscriptionPlan, subscriptionStatus },
        },
        'Business data exported by admin'
      );

      // Set response headers for CSV download
      const filename = `businesses_export_${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      res.send(csvContent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid export parameters', error.errors);
      }
      throw error;
    }
  }

  /**
   * GET /v1/admin/export/payments
   * Export payments to CSV
   */
  async exportPayments(req: AdminRequest, res: Response) {
    try {
      const query = ExportPaymentsSchema.parse(req.query);
      const { fields, paymentMethod, businessId, startDate, endDate } = query;

      // Build where clause for filtering
      const where: any = {};

      if (paymentMethod) where.paymentMethod = paymentMethod;

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      if (businessId) {
        where.subscription = { businessId };
      }

      // Get payments with related data
      const payments = await prisma.paymentRecord.findMany({
        where,
        include: {
          subscription: {
            include: {
              business: {
                select: {
                  name: true,
                  phoneNumber: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Generate CSV content
      const csvContent = this.generatePaymentCSV(payments, fields);

      // Log the export action
      logger.info(
        {
          adminId: req.admin.adminId,
          exportType: 'payments',
          recordCount: payments.length,
          fields,
          filters: { paymentMethod, businessId },
        },
        'Payment data exported by admin'
      );

      // Set response headers for CSV download
      const filename = `payments_export_${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      res.send(csvContent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid export parameters', error.errors);
      }
      throw error;
    }
  }

  /**
   * Generate CSV content for businesses
   */
  private generateBusinessCSV(businesses: any[], fields: string[]): string {
    // Create header row
    const headers = fields.map(field => this.getBusinessFieldLabel(field));
    const csvRows = [headers.join(',')];

    // Add data rows
    for (const business of businesses) {
      const row = fields.map(field => {
        let value = this.getBusinessFieldValue(business, field);
        
        // Escape CSV values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        
        return value;
      });
      
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Generate CSV content for payments
   */
  private generatePaymentCSV(payments: any[], fields: string[]): string {
    // Create header row
    const headers = fields.map(field => this.getPaymentFieldLabel(field));
    const csvRows = [headers.join(',')];

    // Add data rows
    for (const payment of payments) {
      const row = fields.map(field => {
        let value = this.getPaymentFieldValue(payment, field);
        
        // Escape CSV values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        
        return value;
      });
      
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Get business field label for CSV header
   */
  private getBusinessFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      id: 'ID',
      name: 'Business Name',
      phoneNumber: 'Phone Number',
      routingCode: 'Routing Code',
      category: 'Category',
      isActive: 'Is Active',
      onboardingCompleted: 'Onboarding Completed',
      createdAt: 'Created At',
      ownerPhone: 'Owner Phone',
      subscriptionPlan: 'Subscription Plan',
      subscriptionStatus: 'Subscription Status',
      totalBookings: 'Total Bookings',
      totalRevenue: 'Total Revenue',
    };
    return labels[field] || field;
  }

  /**
   * Get business field value
   */
  private getBusinessFieldValue(business: any, field: string): string {
    switch (field) {
      case 'id':
        return business.id;
      case 'name':
        return business.name;
      case 'phoneNumber':
        return business.phoneNumber;
      case 'routingCode':
        return business.routingCode || '';
      case 'category':
        return business.category;
      case 'isActive':
        return business.isActive ? 'Yes' : 'No';
      case 'onboardingCompleted':
        return business.onboardingCompleted ? 'Yes' : 'No';
      case 'createdAt':
        return business.createdAt.toISOString();
      case 'ownerPhone':
        return business.owner?.phone || '';
      case 'subscriptionPlan':
        return business.subscription?.plan || '';
      case 'subscriptionStatus':
        return business.subscription?.status || '';
      case 'totalBookings':
        return business._count?.bookings?.toString() || '0';
      case 'totalRevenue':
        return business.totalRevenue?.toString() || '0';
      default:
        return '';
    }
  }

  /**
   * Get payment field label for CSV header
   */
  private getPaymentFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      id: 'Payment ID',
      amount: 'Amount',
      currency: 'Currency',
      paymentMethod: 'Payment Method',
      transactionRef: 'Transaction Reference',
      createdAt: 'Payment Date',
      businessName: 'Business Name',
      businessPhone: 'Business Phone',
      subscriptionPlan: 'Subscription Plan',
      periodStart: 'Period Start',
      periodEnd: 'Period End',
      notes: 'Notes',
    };
    return labels[field] || field;
  }

  /**
   * Get payment field value
   */
  private getPaymentFieldValue(payment: any, field: string): string {
    switch (field) {
      case 'id':
        return payment.id;
      case 'amount':
        return payment.amount.toString();
      case 'currency':
        return payment.currency;
      case 'paymentMethod':
        return payment.paymentMethod;
      case 'transactionRef':
        return payment.transactionRef || '';
      case 'createdAt':
        return payment.createdAt.toISOString();
      case 'businessName':
        return payment.subscription?.business?.name || '';
      case 'businessPhone':
        return payment.subscription?.business?.phoneNumber || '';
      case 'subscriptionPlan':
        return payment.subscription?.plan || '';
      case 'periodStart':
        return payment.periodStart?.toISOString() || '';
      case 'periodEnd':
        return payment.periodEnd?.toISOString() || '';
      case 'notes':
        return payment.notes || '';
      default:
        return '';
    }
  }
}

export const adminExportController = new AdminExportController();
