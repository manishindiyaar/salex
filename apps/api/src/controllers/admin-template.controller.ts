/**
 * Admin Template Management Controller
 * 
 * Handles admin operations for niche template management including:
 * - Listing all templates
 * - Getting template details
 * - Creating new templates
 * - Updating existing templates
 * - Deleting templates
 */

import { Response } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';
import { AdminRequest } from '../middlewares/admin-auth.middleware';
import { nicheTemplateService } from '../services/niche-template.service';
import { auditLogService } from '../services/audit-log.service';

// Validation schemas
const TerminologySchema = z.object({
  resource: z.string().min(1),
  resourcePlural: z.string().min(1),
  staff: z.string().min(1),
  staffPlural: z.string().min(1),
  service: z.string().min(1),
  servicePlural: z.string().min(1),
  appointment: z.string().min(1),
  appointmentPlural: z.string().min(1),
  customer: z.string().min(1),
  customerPlural: z.string().min(1),
});

const DefaultServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  durationMinutes: z.number().positive(),
});

const DefaultHoursSchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  close: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  daysOfWeek: z.array(z.number().min(0).max(6)).min(1),
});

const MessageTemplatesSchema = z.object({
  welcome: z.string().min(1),
  serviceList: z.string().min(1),
  bookingConfirmation: z.string().min(1),
  bookingReminder: z.string().min(1),
  businessClosed: z.string().min(1),
});

const CreateTemplateSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z_]+$/, 'Code must be uppercase letters and underscores only'),
  displayName: z.string().min(1).max(100),
  icon: z.string().min(1),
  terminology: TerminologySchema,
  enabledModules: z.array(z.string()).min(1),
  defaultServices: z.array(DefaultServiceSchema).optional(),
  defaultHours: DefaultHoursSchema,
  messageTemplates: MessageTemplatesSchema,
});

const UpdateTemplateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  icon: z.string().min(1).optional(),
  terminology: TerminologySchema.optional(),
  enabledModules: z.array(z.string()).min(1).optional(),
  defaultServices: z.array(DefaultServiceSchema).optional(),
  defaultHours: DefaultHoursSchema.optional(),
  messageTemplates: MessageTemplatesSchema.optional(),
});

class AdminTemplateController {
  /**
   * GET /v1/admin/templates
   * List all niche templates
   */
  async listTemplates(_req: AdminRequest, res: Response) {
    try {
      const templates = await nicheTemplateService.getAllTemplates();
      const templateStats = await nicheTemplateService.getTemplateStats();

      // Merge templates with usage stats
      const templatesWithStats = templates.map(template => {
        const stats = templateStats.find(s => s.code === template.code);
        return {
          ...template,
          businessCount: stats?.businessCount || 0,
        };
      });

      res.json({
        success: true,
        data: {
          templates: templatesWithStats,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /v1/admin/templates/:code
   * Get template by code
   */
  async getTemplate(req: AdminRequest, res: Response) {
    try {
      const { code } = req.params;
      const template = await nicheTemplateService.getTemplate(code);

      res.json({
        success: true,
        data: {
          template,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST /v1/admin/templates
   * Create new template
   */
  async createTemplate(req: AdminRequest, res: Response) {
    try {
      const templateData = CreateTemplateSchema.parse(req.body);

      const template = await nicheTemplateService.createTemplate({
        ...templateData,
        defaultServices: templateData.defaultServices || [],
      });

      // Log the action
      await auditLogService.logAction({
        adminId: req.admin.adminId,
        action: 'CREATE_NICHE_TEMPLATE',
        entityType: 'NicheTemplate',
        entityId: template.id,
        changes: {
          code: template.code,
          displayName: template.displayName,
          enabledModules: template.enabledModules,
        },
        reason: 'Created new niche template',
      });

      logger.info(
        {
          adminId: req.admin.adminId,
          templateId: template.id,
          code: template.code,
        },
        'Niche template created by admin'
      );

      res.status(201).json({
        success: true,
        data: {
          template,
        },
        message: 'Template created successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid template data', error);
      }
      throw error;
    }
  }

  /**
   * PATCH /v1/admin/templates/:code
   * Update template
   */
  async updateTemplate(req: AdminRequest, res: Response) {
    try {
      const { code } = req.params;
      const updateData = UpdateTemplateSchema.parse(req.body);

      // Get original template for audit log
      const originalTemplate = await nicheTemplateService.getTemplate(code);

      const template = await nicheTemplateService.updateTemplate(code, updateData);

      // Log the action
      await auditLogService.logAction({
        adminId: req.admin.adminId,
        action: 'UPDATE_NICHE_TEMPLATE',
        entityType: 'NicheTemplate',
        entityId: template.id,
        changes: {
          code,
          updates: updateData,
          previousValues: {
            displayName: originalTemplate.displayName,
            enabledModules: originalTemplate.enabledModules,
          },
        },
        reason: 'Updated niche template',
      });

      logger.info(
        {
          adminId: req.admin.adminId,
          templateId: template.id,
          code,
          updates: Object.keys(updateData),
        },
        'Niche template updated by admin'
      );

      res.json({
        success: true,
        data: {
          template,
        },
        message: 'Template updated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid template data', error);
      }
      throw error;
    }
  }

  /**
   * DELETE /v1/admin/templates/:code
   * Delete template (soft delete)
   */
  async deleteTemplate(req: AdminRequest, res: Response) {
    try {
      const { code } = req.params;

      // Get template for audit log
      const template = await nicheTemplateService.getTemplate(code);

      await nicheTemplateService.deleteTemplate(code);

      // Log the action
      await auditLogService.logAction({
        adminId: req.admin.adminId,
        action: 'DELETE_NICHE_TEMPLATE',
        entityType: 'NicheTemplate',
        entityId: template.id,
        changes: {
          code,
          displayName: template.displayName,
          isActive: { from: true, to: false },
        },
        reason: 'Deleted niche template',
      });

      logger.info(
        {
          adminId: req.admin.adminId,
          templateId: template.id,
          code,
        },
        'Niche template deleted by admin'
      );

      res.json({
        success: true,
        message: 'Template deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /v1/admin/templates/stats
   * Get template usage statistics
   */
  async getTemplateStats(_req: AdminRequest, res: Response) {
    try {
      const stats = await nicheTemplateService.getTemplateStats();

      res.json({
        success: true,
        data: {
          stats,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}

export const adminTemplateController = new AdminTemplateController();