/**
 * Admin Audit Log Controller
 * 
 * Handles admin operations for viewing audit logs
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';
import { AdminRequest } from '../middlewares/admin-auth.middleware';
import { auditLogService } from '../services/audit-log.service';

// Validation schemas
const ListAuditLogsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  action: z.string().optional(),
  entityType: z.string().optional(),
  adminId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

class AdminAuditController {
  /**
   * GET /v1/admin/audit-logs
   * List audit logs with filtering and pagination
   */
  async listAuditLogs(req: AdminRequest, res: Response) {
    try {
      const query = ListAuditLogsSchema.parse(req.query);
      const { page, limit, action, entityType, adminId, startDate, endDate } = query;

      const filters: any = {};
      if (action) filters.action = action;
      if (entityType) filters.entityType = entityType;
      if (adminId) filters.adminId = adminId;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);

      const result = await auditLogService.getAuditLogs({
        ...filters,
        page,
        limit,
      });

      res.json({
        success: true,
        data: {
          logs: result.auditLogs,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid query parameters', error.errors);
      }
      throw error;
    }
  }
}

export const adminAuditController = new AdminAuditController();
