/**
 * Admin Health and Statistics Controller
 * 
 * Handles system health checks and platform statistics for admin dashboard.
 */

import { Request, Response } from 'express';
import { prisma } from '@salex/shared-types';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import { getConfig } from '../config';
import { AdminRequest } from '../middlewares/admin-auth.middleware';

class AdminHealthController {
  private supabase;

  constructor() {
    const config = getConfig();
    this.supabase = createClient(
      config.supabaseUrl,
      config.supabaseServiceKey
    );
  }

  /**
   * GET /v1/admin/health
   * Check system health status
   */
  async getSystemHealth(req: AdminRequest, res: Response) {
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
        } else {
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
    } catch (error) {
      logger.error({ error }, 'Error checking system health');
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
  async getPlatformStats(req: AdminRequest, res: Response) {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Run stats collection sequentially to avoid overwhelming connection pool
      const businessStats = await this.getBusinessStats();
      const subscriptionStats = await this.getSubscriptionStats();
      const bookingStats = await this.getBookingStats(thirtyDaysAgo, sevenDaysAgo);
      const revenueStats = await this.getRevenueStats(thirtyDaysAgo, sevenDaysAgo);
      const customerStats = await this.getCustomerStats(thirtyDaysAgo, sevenDaysAgo);
      const recentActivity = await this.getRecentActivity();

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
    } catch (error) {
      logger.error({ error }, 'Error getting platform stats');
      throw error;
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth() {
    const start = Date.now();
    
    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
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
  private async checkSupabaseHealth() {
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
  private async checkWhatsAppHealth() {
    const config = getConfig();
    
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
  private async checkAPIHealth() {
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
  private async getBusinessStats() {
    const [
      totalBusinesses,
      activeBusinesses,
      businessesByCategory,
      recentBusinesses,
    ] = await Promise.all([
      prisma.business.count(),
      prisma.business.count({ where: { isActive: true } }),
      prisma.business.groupBy({
        by: ['category'],
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
      }),
      prisma.business.count({
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
  private async getSubscriptionStats() {
    const [
      subscriptionsByStatus,
      subscriptionsByPlan,
    ] = await Promise.all([
      prisma.subscription.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.subscription.groupBy({
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
  private async getBookingStats(thirtyDaysAgo: Date, sevenDaysAgo: Date) {
    const [
      totalBookings,
      recentBookings,
      weeklyBookings,
      bookingsByStatus,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.booking.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.booking.groupBy({
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
  private async getRevenueStats(thirtyDaysAgo: Date, sevenDaysAgo: Date) {
    const [
      totalRevenue,
      recentRevenue,
      weeklyRevenue,
    ] = await Promise.all([
      prisma.paymentRecord.aggregate({
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.paymentRecord.aggregate({
        where: { createdAt: { gte: thirtyDaysAgo } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.paymentRecord.aggregate({
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
  private async getCustomerStats(thirtyDaysAgo: Date, sevenDaysAgo: Date) {
    const [
      totalCustomers,
      recentCustomers,
      weeklyCustomers,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.customer.count({
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
  private async getRecentActivity() {
    const [
      recentBusinesses,
      recentBookings,
      recentPayments,
    ] = await Promise.all([
      prisma.business.findMany({
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.booking.findMany({
        select: {
          id: true,
          business: { select: { name: true } },
          customer: { select: { name: true, phoneNumber: true } },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.paymentRecord.findMany({
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

export const adminHealthController = new AdminHealthController();