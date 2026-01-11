"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminTemplateController = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const niche_template_service_1 = require("../services/niche-template.service");
const audit_log_service_1 = require("../services/audit-log.service");
// Validation schemas
const TerminologySchema = zod_1.z.object({
    resource: zod_1.z.string().min(1),
    resourcePlural: zod_1.z.string().min(1),
    staff: zod_1.z.string().min(1),
    staffPlural: zod_1.z.string().min(1),
    service: zod_1.z.string().min(1),
    servicePlural: zod_1.z.string().min(1),
    appointment: zod_1.z.string().min(1),
    appointmentPlural: zod_1.z.string().min(1),
    customer: zod_1.z.string().min(1),
    customerPlural: zod_1.z.string().min(1),
});
const DefaultServiceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().positive(),
    durationMinutes: zod_1.z.number().positive(),
});
const DefaultHoursSchema = zod_1.z.object({
    open: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
    close: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
    daysOfWeek: zod_1.z.array(zod_1.z.number().min(0).max(6)).min(1),
});
const MessageTemplatesSchema = zod_1.z.object({
    welcome: zod_1.z.string().min(1),
    serviceList: zod_1.z.string().min(1),
    bookingConfirmation: zod_1.z.string().min(1),
    bookingReminder: zod_1.z.string().min(1),
    businessClosed: zod_1.z.string().min(1),
});
const CreateTemplateSchema = zod_1.z.object({
    code: zod_1.z.string().min(1).max(50).regex(/^[A-Z_]+$/, 'Code must be uppercase letters and underscores only'),
    displayName: zod_1.z.string().min(1).max(100),
    icon: zod_1.z.string().min(1),
    terminology: TerminologySchema,
    enabledModules: zod_1.z.array(zod_1.z.string()).min(1),
    defaultServices: zod_1.z.array(DefaultServiceSchema).optional(),
    defaultHours: DefaultHoursSchema,
    messageTemplates: MessageTemplatesSchema,
});
const UpdateTemplateSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).max(100).optional(),
    icon: zod_1.z.string().min(1).optional(),
    terminology: TerminologySchema.optional(),
    enabledModules: zod_1.z.array(zod_1.z.string()).min(1).optional(),
    defaultServices: zod_1.z.array(DefaultServiceSchema).optional(),
    defaultHours: DefaultHoursSchema.optional(),
    messageTemplates: MessageTemplatesSchema.optional(),
});
class AdminTemplateController {
    /**
     * GET /v1/admin/templates
     * List all niche templates
     */
    async listTemplates(req, res) {
        try {
            const templates = await niche_template_service_1.nicheTemplateService.getAllTemplates();
            const templateStats = await niche_template_service_1.nicheTemplateService.getTemplateStats();
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
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * GET /v1/admin/templates/:code
     * Get template by code
     */
    async getTemplate(req, res) {
        try {
            const { code } = req.params;
            const template = await niche_template_service_1.nicheTemplateService.getTemplate(code);
            res.json({
                success: true,
                data: {
                    template,
                },
            });
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * POST /v1/admin/templates
     * Create new template
     */
    async createTemplate(req, res) {
        try {
            const templateData = CreateTemplateSchema.parse(req.body);
            const template = await niche_template_service_1.nicheTemplateService.createTemplate(templateData);
            // Log the action
            await audit_log_service_1.auditLogService.logAction({
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
            logger_1.logger.info({
                adminId: req.admin.adminId,
                templateId: template.id,
                code: template.code,
            }, 'Niche template created by admin');
            res.status(201).json({
                success: true,
                data: {
                    template,
                },
                message: 'Template created successfully',
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new errors_1.ValidationError('Invalid template data', error.errors);
            }
            throw error;
        }
    }
    /**
     * PATCH /v1/admin/templates/:code
     * Update template
     */
    async updateTemplate(req, res) {
        try {
            const { code } = req.params;
            const updateData = UpdateTemplateSchema.parse(req.body);
            // Get original template for audit log
            const originalTemplate = await niche_template_service_1.nicheTemplateService.getTemplate(code);
            const template = await niche_template_service_1.nicheTemplateService.updateTemplate(code, updateData);
            // Log the action
            await audit_log_service_1.auditLogService.logAction({
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
            logger_1.logger.info({
                adminId: req.admin.adminId,
                templateId: template.id,
                code,
                updates: Object.keys(updateData),
            }, 'Niche template updated by admin');
            res.json({
                success: true,
                data: {
                    template,
                },
                message: 'Template updated successfully',
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new errors_1.ValidationError('Invalid template data', error.errors);
            }
            throw error;
        }
    }
    /**
     * DELETE /v1/admin/templates/:code
     * Delete template (soft delete)
     */
    async deleteTemplate(req, res) {
        try {
            const { code } = req.params;
            // Get template for audit log
            const template = await niche_template_service_1.nicheTemplateService.getTemplate(code);
            await niche_template_service_1.nicheTemplateService.deleteTemplate(code);
            // Log the action
            await audit_log_service_1.auditLogService.logAction({
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
            logger_1.logger.info({
                adminId: req.admin.adminId,
                templateId: template.id,
                code,
            }, 'Niche template deleted by admin');
            res.json({
                success: true,
                message: 'Template deleted successfully',
            });
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * GET /v1/admin/templates/stats
     * Get template usage statistics
     */
    async getTemplateStats(req, res) {
        try {
            const stats = await niche_template_service_1.nicheTemplateService.getTemplateStats();
            res.json({
                success: true,
                data: {
                    stats,
                },
            });
        }
        catch (error) {
            throw error;
        }
    }
}
exports.adminTemplateController = new AdminTemplateController();
//# sourceMappingURL=admin-template.controller.js.map