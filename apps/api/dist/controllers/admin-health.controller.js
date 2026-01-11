"use strict";
/**
 * Admin Health and Statistics Controller
 *
 * Handles system health checks and platform statistics for admin dashboard.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminHealthController = void 0;
const shared_types_1 = require("@salex/shared-types");
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
class AdminHealthController {
    supabase;
    constructor() {
        const config = (0, config_1.getConfig)();
        this.supabase = (0, supabase_js_1.createClient)(config.supabaseUrl, config.supabaseServiceKey);
    }
    /**
     * GET /v1/admin/health
     * Check system health status
     */
    async getSystemHealth(req, res) {
        try {
            const healthChecks = await Promise.allSettled([
                this.checkDatabaseHealth(),
                this.checkSupabaseHealth(),
                this.checkWhatsAppHealth(),
                this.checkAPIHealth(),
            ]);
            const [database, supabase, whatsapp, api] = healthChecks.map((result, index) => {
                const services = ['Database', 'Supabase', 'WhatsApp', 'API'];
                if (result.status === 'fulfilled') {
                    return {
                        service: services[index],
                        status: 'healthy',
                        ...result.value,
                    };
                }
                else {
                    return {
                        service: services[index],
                        status: 'unhealthy',
                        error: result.reason?.message || 'Unknown error',
                        timestamp: new Date().toISOString(),
                    };
                }
            });
            const overallStatus = healthChecks.every(check => check.status === 'fulfilled')
                ? 'healthy'
                : 'degraded';
            res.json({
                success: true,
                data: {
                    overall: {
                        status: overallStatus,
                        timestamp: new Date().toISOString(),
                    },
                    services: {
                        database,
                        supabase,
                        whatsapp,
                        api,
                    },
                },
            });
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Error checking system health');
            res.status(500).json({
                success: false,
                error: {
                    code: 'HEALTH_CHECK_FAILED',
                    message: 'Failed to check system health',
                },
            });
        }
    }
    /**
     * GET /v1/admin/stats
     * Get platform statistics
     */
    async getPlatformStats(req, res) {
        try {
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const [businessStats, subscriptionStats, bookingStats, revenueStats, customerStats, recentActivity,] = await Promise.all([
                this.getBusinessStats(),
                this.getSubscriptionStats(),
                this.getBookingStats(thirtyDaysAgo, sevenDaysAgo),
                this.getRevenueStats(thirtyDaysAgo, sevenDaysAgo),
                this.getCustomerStats(thirtyDaysAgo, sevenDaysAgo),
                this.getRecentActivity(),
            ]);
            res.json({
                success: true,
                data: {
                    businesses: businessStats,
                    subscriptions: subscriptionStats,
                    bookings: bookingStats,
                    revenue: revenueStats,
                    customers: customerStats,
                    recentActivity,
                    generatedAt: now.toISOString(),
                },
            });
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Error getting platform stats');
            throw error;
        }
    }
    /**
     * Check database health
     */
    async checkDatabaseHealth() {
        const start = Date.now();
        // Simple query to check database connectivity
        await shared_types_1.prisma.$queryRaw `SELECT 1`;
        const responseTime = Date.now() - start;
        return {
            status: 'healthy',
            responseTime: `${responseTime}ms`,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Check Supabase health
     */
    async checkSupabaseHealth() {
        const start = Date.now();
        // Check Supabase API connectivity
        const { data, error } = await this.supabase
            .from('Business')
            .select('count')
            .limit(1);
        if (error) {
            throw new Error(`Supabase error: ${error.message}`);
        }
        const responseTime = Date.now() - start;
        return {
            status: 'healthy',
            responseTime: `${responseTime}ms`,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Check WhatsApp API health
     */
    async checkWhatsAppHealth() {
        const config = (0, config_1.getConfig)();
        if (!config.whatsappAccessToken || !config.whatsappPhoneNumberId) {
            return {
                status: 'not_configured',
                message: 'WhatsApp API not configured',
                timestamp: new Date().toISOString(),
            };
        }
        // In simulator mode, always return healthy
        if (config.whatsappMode === 'simulator') {
            return {
                status: 'healthy',
                mode: 'simulator',
                timestamp: new Date().toISOString(),
            };
        }
        // For production mode, we would check the actual WhatsApp API
        // For now, just return configured status
        return {
            status: 'configured',
            mode: 'production',
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Check API health
     */
    async checkAPIHealth() {
        return {
            status: 'healthy',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Get business statistics
     */
    async getBusinessStats() {
        const [totalBusinesses, activeBusinesses, businessesByCategory, recentBusinesses,] = await Promise.all([
            shared_types_1.prisma.business.count(),
            shared_types_1.prisma.business.count({ where: { isActive: true } }),
            shared_types_1.prisma.business.groupBy({
                by: ['category'],
                _count: { category: true },
                orderBy: { _count: { category: 'desc' } },
            }),
            shared_types_1.prisma.business.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ]);
        return {
            total: totalBusinesses,
            active: activeBusinesses,
            inactive: totalBusinesses - activeBusinesses,
            recentSignups: recentBusinesses,
            byCategory: businessesByCategory,
        };
    }
    /**
     * Get subscription statistics
     */
    async getSubscriptionStats() {
        const [subscriptionsByStatus, subscriptionsByPlan,] = await Promise.all([
            shared_types_1.prisma.subscription.groupBy({
                by: ['status'],
                _count: { status: true },
            }),
            shared_types_1.prisma.subscription.groupBy({
                by: ['plan'],
                _count: { plan: true },
            }),
        ]);
        return {
            byStatus: subscriptionsByStatus,
            byPlan: subscriptionsByPlan,
        };
    }
    /**
     * Get booking statistics
     */
    async getBookingStats(thirtyDaysAgo, sevenDaysAgo) {
        const [totalBookings, recentBookings, weeklyBookings, bookingsByStatus,] = await Promise.all([
            shared_types_1.prisma.booking.count(),
            shared_types_1.prisma.booking.count({
                where: { createdAt: { gte: thirtyDaysAgo } },
            }),
            shared_types_1.prisma.booking.count({
                where: { createdAt: { gte: sevenDaysAgo } },
            }),
            shared_types_1.prisma.booking.groupBy({
                by: ['status'],
                _count: { status: true },
                orderBy: { _count: { status: 'desc' } },
            }),
        ]);
        return {
            total: totalBookings,
            recent: recentBookings,
            weekly: weeklyBookings,
            byStatus: bookingsByStatus,
        };
    }
    /**
     * Get revenue statistics
     */
    async getRevenueStats(thirtyDaysAgo, sevenDaysAgo) {
        const [totalRevenue, recentRevenue, weeklyRevenue,] = await Promise.all([
            shared_types_1.prisma.paymentRecord.aggregate({
                _sum: { amount: true },
                _count: { id: true },
            }),
            shared_types_1.prisma.paymentRecord.aggregate({
                where: { createdAt: { gte: thirtyDaysAgo } },
                _sum: { amount: true },
                _count: { id: true },
            }),
            shared_types_1.prisma.paymentRecord.aggregate({
                where: { createdAt: { gte: sevenDaysAgo } },
                _sum: { amount: true },
                _count: { id: true },
            }),
        ]);
        return {
            total: {
                amount: totalRevenue._sum.amount || 0,
                payments: totalRevenue._count.id,
            },
            recent: {
                amount: recentRevenue._sum.amount || 0,
                payments: recentRevenue._count.id,
            },
            weekly: {
                amount: weeklyRevenue._sum.amount || 0,
                payments: weeklyRevenue._count.id,
            },
        };
    }
    /**
     * Get customer statistics
     */
    async getCustomerStats(thirtyDaysAgo, sevenDaysAgo) {
        const [totalCustomers, recentCustomers, weeklyCustomers,] = await Promise.all([
            shared_types_1.prisma.customer.count(),
            shared_types_1.prisma.customer.count({
                where: { createdAt: { gte: thirtyDaysAgo } },
            }),
            shared_types_1.prisma.customer.count({
                where: { createdAt: { gte: sevenDaysAgo } },
            }),
        ]);
        return {
            total: totalCustomers,
            recent: recentCustomers,
            weekly: weeklyCustomers,
        };
    }
    /**
     * Get recent activity
     */
    async getRecentActivity() {
        const [recentBusinesses, recentBookings, recentPayments,] = await Promise.all([
            shared_types_1.prisma.business.findMany({
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
            shared_types_1.prisma.booking.findMany({
                select: {
                    id: true,
                    business: { select: { name: true } },
                    customer: { select: { name: true, phoneNumber: true } },
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
            shared_types_1.prisma.paymentRecord.findMany({
                select: {
                    id: true,
                    amount: true,
                    subscription: {
                        select: {
                            business: { select: { name: true } },
                        },
                    },
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
        ]);
        return {
            recentBusinesses,
            recentBookings,
            recentPayments,
        };
    }
}
exports.adminHealthController = new AdminHealthController();
//# sourceMappingURL=admin-health.controller.js.map