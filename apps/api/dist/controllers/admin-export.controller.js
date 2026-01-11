"use strict";
/**
 * Admin Data Export Controller
 *
 * Handles data export functionality for admin dashboard including:
 * - Exporting businesses to CSV
 * - Exporting payments to CSV
 * - Custom field selection and filtering
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminExportController = void 0;
const zod_1 = require("zod");
const shared_types_1 = require("@salex/shared-types");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
// Validation schemas
const ExportBusinessesSchema = zod_1.z.object({
    fields: zod_1.z.array(zod_1.z.enum([
        'id', 'name', 'phoneNumber', 'routingCode', 'category', 'isActive',
        'onboardingCompleted', 'createdAt', 'ownerPhone', 'subscriptionPlan',
        'subscriptionStatus', 'totalBookings', 'totalRevenue'
    ])).optional().default([
        'name', 'phoneNumber', 'routingCode', 'category', 'isActive', 'createdAt'
    ]),
    category: zod_1.z.enum(['SALON', 'BEAUTY_PARLOR', 'SPA', 'CLINIC', 'FITNESS', 'OTHER']).optional(),
    isActive: zod_1.z.preprocess((val) => val === 'true' ? true : val === 'false' ? false : undefined, zod_1.z.boolean().optional()),
    subscriptionPlan: zod_1.z.enum(['BASIC', 'PRO', 'CUSTOM']).optional(),
    subscriptionStatus: zod_1.z.enum(['TRIAL', 'ACTIVE', 'GRACE', 'EXPIRED', 'CANCELLED']).optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
});
const ExportPaymentsSchema = zod_1.z.object({
    fields: zod_1.z.array(zod_1.z.enum([
        'id', 'amount', 'currency', 'paymentMethod', 'transactionRef', 'createdAt',
        'businessName', 'businessPhone', 'subscriptionPlan', 'periodStart', 'periodEnd', 'notes'
    ])).optional().default([
        'amount', 'paymentMethod', 'createdAt', 'businessName', 'subscriptionPlan'
    ]),
    paymentMethod: zod_1.z.enum(['gpay', 'upi', 'bank_transfer', 'cash', 'other']).optional(),
    businessId: zod_1.z.string().optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
});
class AdminExportController {
    /**
     * GET /v1/admin/export/businesses
     * Export businesses to CSV
     */
    async exportBusinesses(req, res) {
        try {
            const query = ExportBusinessesSchema.parse(req.query);
            const { fields, category, isActive, subscriptionPlan, subscriptionStatus, startDate, endDate } = query;
            // Build where clause for filtering
            const where = {};
            if (category)
                where.category = category;
            if (isActive !== undefined)
                where.isActive = isActive;
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate)
                    where.createdAt.gte = new Date(startDate);
                if (endDate)
                    where.createdAt.lte = new Date(endDate);
            }
            // Add subscription filters
            if (subscriptionPlan || subscriptionStatus) {
                where.subscription = {};
                if (subscriptionPlan)
                    where.subscription.plan = subscriptionPlan;
                if (subscriptionStatus)
                    where.subscription.status = subscriptionStatus;
            }
            // Get businesses with related data
            const businesses = await shared_types_1.prisma.business.findMany({
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
            const businessesWithRevenue = await Promise.all(businesses.map(async (business) => {
                let totalRevenue = 0;
                if (fields.includes('totalRevenue')) {
                    const revenueResult = await shared_types_1.prisma.booking.aggregate({
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
            }));
            // Generate CSV content
            const csvContent = this.generateBusinessCSV(businessesWithRevenue, fields);
            // Log the export action
            logger_1.logger.info({
                adminId: req.admin.adminId,
                exportType: 'businesses',
                recordCount: businesses.length,
                fields,
                filters: { category, isActive, subscriptionPlan, subscriptionStatus },
            }, 'Business data exported by admin');
            // Set response headers for CSV download
            const filename = `businesses_export_${new Date().toISOString().split('T')[0]}.csv`;
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(csvContent);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new errors_1.ValidationError('Invalid export parameters', error.errors);
            }
            throw error;
        }
    }
    /**
     * GET /v1/admin/export/payments
     * Export payments to CSV
     */
    async exportPayments(req, res) {
        try {
            const query = ExportPaymentsSchema.parse(req.query);
            const { fields, paymentMethod, businessId, startDate, endDate } = query;
            // Build where clause for filtering
            const where = {};
            if (paymentMethod)
                where.paymentMethod = paymentMethod;
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate)
                    where.createdAt.gte = new Date(startDate);
                if (endDate)
                    where.createdAt.lte = new Date(endDate);
            }
            if (businessId) {
                where.subscription = { businessId };
            }
            // Get payments with related data
            const payments = await shared_types_1.prisma.paymentRecord.findMany({
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
            logger_1.logger.info({
                adminId: req.admin.adminId,
                exportType: 'payments',
                recordCount: payments.length,
                fields,
                filters: { paymentMethod, businessId },
            }, 'Payment data exported by admin');
            // Set response headers for CSV download
            const filename = `payments_export_${new Date().toISOString().split('T')[0]}.csv`;
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(csvContent);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new errors_1.ValidationError('Invalid export parameters', error.errors);
            }
            throw error;
        }
    }
    /**
     * Generate CSV content for businesses
     */
    generateBusinessCSV(businesses, fields) {
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
    generatePaymentCSV(payments, fields) {
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
    getBusinessFieldLabel(field) {
        const labels = {
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
    getBusinessFieldValue(business, field) {
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
    getPaymentFieldLabel(field) {
        const labels = {
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
    getPaymentFieldValue(payment, field) {
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
exports.adminExportController = new AdminExportController();
//# sourceMappingURL=admin-export.controller.js.map