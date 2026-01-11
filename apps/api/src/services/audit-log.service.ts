/**
 * Audit Log Service
 * 
 * Handles logging of admin actions for compliance and tracking.
 * All admin operations that modify data should be logged.
 */

import { prisma, AuditLog } from '@salex/shared-types';
import { logger } from '../utils/logger';

interface LogActionInput {
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, any>;
  reason?: string;
}

interface GetAuditLogsFilters {
  adminId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

class AuditLogService {
  /**
   * Log an admin action
   */
  async logAction(input: LogActionInput): Promise<AuditLog> {
    const { adminId, action, entityType, entityId, changes, reason } = input;

    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          adminId,
          action,
          entityType,
          entityId,
          changes,
          reason,
        },
      });

      logger.info(
        {
          auditLogId: auditLog.id,
          adminId,
          action,
          entityType,
          entityId,
          reason,
        },
        'Admin action logged'
      );

      return auditLog;
    } catch (error) {
      logger.error(
        {
          adminId,
          action,
          entityType,
          entityId,
          error,
        },
        'Failed to log admin action'
      );
      throw error;
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(filters: GetAuditLogsFilters = {}) {
    const {
      adminId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (adminId) where.adminId = adminId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    try {
      const [auditLogs, totalCount] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            admin: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.auditLog.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        auditLogs,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error({ filters, error }, 'Failed to get audit logs');
      throw error;
    }
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityAuditLogs(entityType: string, entityId: string) {
    try {
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityType,
          entityId,
        },
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return auditLogs;
    } catch (error) {
      logger.error({ entityType, entityId, error }, 'Failed to get entity audit logs');
      throw error;
    }
  }

  /**
   * Get audit log statistics
   */
  async getAuditLogStats(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    try {
      const [
        totalLogs,
        actionStats,
        adminStats,
        entityTypeStats,
      ] = await Promise.all([
        // Total audit logs
        prisma.auditLog.count({ where }),

        // Actions breakdown
        prisma.auditLog.groupBy({
          by: ['action'],
          where,
          _count: { action: true },
          orderBy: { _count: { action: 'desc' } },
        }),

        // Admin activity breakdown
        prisma.auditLog.groupBy({
          by: ['adminId'],
          where,
          _count: { adminId: true },
          orderBy: { _count: { adminId: 'desc' } },
        }),

        // Entity type breakdown
        prisma.auditLog.groupBy({
          by: ['entityType'],
          where,
          _count: { entityType: true },
          orderBy: { _count: { entityType: 'desc' } },
        }),
      ]);

      // Get admin details for admin stats
      const adminIds = adminStats.map(stat => stat.adminId);
      const admins = await prisma.adminUser.findMany({
        where: { id: { in: adminIds } },
        select: { id: true, email: true, name: true },
      });

      const adminStatsWithDetails = adminStats.map(stat => ({
        ...stat,
        admin: admins.find(admin => admin.id === stat.adminId),
      }));

      return {
        totalLogs,
        actionStats,
        adminStats: adminStatsWithDetails,
        entityTypeStats,
      };
    } catch (error) {
      logger.error({ startDate, endDate, error }, 'Failed to get audit log stats');
      throw error;
    }
  }

  /**
   * Helper method to log business status changes
   */
  async logBusinessStatusChange(
    adminId: string,
    businessId: string,
    previousStatus: boolean,
    newStatus: boolean,
    reason?: string
  ) {
    return this.logAction({
      adminId,
      action: 'TOGGLE_BUSINESS_STATUS',
      entityType: 'Business',
      entityId: businessId,
      changes: {
        isActive: {
          from: previousStatus,
          to: newStatus,
        },
      },
      reason,
    });
  }

  /**
   * Helper method to log subscription plan changes
   */
  async logSubscriptionPlanChange(
    adminId: string,
    subscriptionId: string,
    businessId: string,
    oldPlan: string,
    newPlan: string,
    reason?: string
  ) {
    return this.logAction({
      adminId,
      action: 'CHANGE_SUBSCRIPTION_PLAN',
      entityType: 'Subscription',
      entityId: subscriptionId,
      changes: {
        plan: {
          from: oldPlan,
          to: newPlan,
        },
        businessId,
      },
      reason,
    });
  }

  /**
   * Helper method to log payment records
   */
  async logPaymentRecord(
    adminId: string,
    paymentId: string,
    subscriptionId: string,
    amount: number,
    paymentMethod: string,
    reason?: string
  ) {
    return this.logAction({
      adminId,
      action: 'RECORD_PAYMENT',
      entityType: 'PaymentRecord',
      entityId: paymentId,
      changes: {
        subscriptionId,
        amount,
        paymentMethod,
      },
      reason,
    });
  }
}

export const auditLogService = new AuditLogService();