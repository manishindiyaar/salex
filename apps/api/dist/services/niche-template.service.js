"use strict";
/**
 * Niche Template Service
 *
 * Handles niche template management for different business categories.
 * Templates define terminology, enabled modules, default services, and message templates.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.nicheTemplateService = void 0;
const shared_types_1 = require("@salex/shared-types");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class NicheTemplateService {
    /**
     * Get template by code
     */
    async getTemplate(code) {
        const template = await shared_types_1.prisma.nicheTemplate.findUnique({
            where: { code },
        });
        if (!template) {
            throw new errors_1.NotFoundError(`Template with code '${code}' not found`);
        }
        if (!template.isActive) {
            throw new errors_1.BusinessRuleError(`Template '${code}' is not active`);
        }
        return template;
    }
    /**
     * Get all active templates
     */
    async getAllTemplates() {
        return shared_types_1.prisma.nicheTemplate.findMany({
            where: { isActive: true },
            orderBy: { displayName: 'asc' },
        });
    }
    /**
     * Create new template
     */
    async createTemplate(input) {
        const { code, displayName, icon, terminology, enabledModules, defaultServices, defaultHours, messageTemplates, } = input;
        // Check if template with code already exists
        const existingTemplate = await shared_types_1.prisma.nicheTemplate.findUnique({
            where: { code },
        });
        if (existingTemplate) {
            throw new errors_1.BusinessRuleError(`Template with code '${code}' already exists`);
        }
        // Validate enabled modules exist
        await this.validateModules(enabledModules);
        const template = await shared_types_1.prisma.nicheTemplate.create({
            data: {
                code,
                displayName,
                icon,
                terminology,
                enabledModules,
                defaultServices,
                defaultHours,
                messageTemplates,
            },
        });
        logger_1.logger.info({ templateId: template.id, code, displayName }, 'Niche template created');
        return template;
    }
    /**
     * Update existing template
     */
    async updateTemplate(code, input) {
        const existingTemplate = await this.getTemplate(code);
        // Validate enabled modules if provided
        if (input.enabledModules) {
            await this.validateModules(input.enabledModules);
        }
        const template = await shared_types_1.prisma.nicheTemplate.update({
            where: { code },
            data: input,
        });
        logger_1.logger.info({ templateId: template.id, code, updates: Object.keys(input) }, 'Niche template updated');
        return template;
    }
    /**
     * Delete template (soft delete by setting isActive = false)
     */
    async deleteTemplate(code) {
        const template = await this.getTemplate(code);
        // Check if template is being used by any businesses
        const businessCount = await shared_types_1.prisma.business.count({
            where: { category: code },
        });
        if (businessCount > 0) {
            throw new errors_1.BusinessRuleError(`Cannot delete template '${code}' as it is being used by ${businessCount} businesses`);
        }
        await shared_types_1.prisma.nicheTemplate.update({
            where: { code },
            data: { isActive: false },
        });
        logger_1.logger.info({ templateId: template.id, code }, 'Niche template deleted');
    }
    /**
     * Apply template to business during onboarding
     */
    async applyTemplate(businessId, templateCode) {
        const template = await this.getTemplate(templateCode);
        // Get business
        const business = await shared_types_1.prisma.business.findUnique({
            where: { id: businessId },
        });
        if (!business) {
            throw new errors_1.NotFoundError('Business not found');
        }
        // Create module configurations for enabled modules
        const moduleConfigs = template.enabledModules.map(moduleCode => ({
            businessId,
            moduleCode,
            isEnabled: true,
        }));
        // Apply template in a transaction
        await shared_types_1.prisma.$transaction(async (tx) => {
            // Update business category
            await tx.business.update({
                where: { id: businessId },
                data: { category: templateCode },
            });
            // Create module configurations
            if (moduleConfigs.length > 0) {
                await tx.businessModuleConfig.createMany({
                    data: moduleConfigs,
                    skipDuplicates: true,
                });
            }
            // Create default services if business has no services
            const existingServices = await tx.service.count({
                where: { businessId },
            });
            if (existingServices === 0 && template.defaultServices) {
                const defaultServices = template.defaultServices.map(service => ({
                    businessId,
                    name: service.name,
                    description: service.description,
                    price: service.price,
                    durationMinutes: service.durationMinutes,
                }));
                await tx.service.createMany({
                    data: defaultServices,
                });
            }
        });
        logger_1.logger.info({ businessId, templateCode, enabledModules: template.enabledModules }, 'Template applied to business');
    }
    /**
     * Get terminology for a business category
     */
    async getTerminology(category) {
        const template = await this.getTemplate(category);
        return template.terminology;
    }
    /**
     * Get message templates for a business category
     */
    async getMessageTemplates(category) {
        const template = await this.getTemplate(category);
        return template.messageTemplates;
    }
    /**
     * Get default services for a template
     */
    async getDefaultServices(templateCode) {
        const template = await this.getTemplate(templateCode);
        return template.defaultServices;
    }
    /**
     * Get default hours for a template
     */
    async getDefaultHours(templateCode) {
        const template = await this.getTemplate(templateCode);
        return template.defaultHours;
    }
    /**
     * Validate that all module codes exist
     */
    async validateModules(moduleCodes) {
        const existingModules = await shared_types_1.prisma.featureModule.findMany({
            where: {
                code: { in: moduleCodes },
                isActive: true,
            },
            select: { code: true },
        });
        const existingCodes = existingModules.map(m => m.code);
        const missingCodes = moduleCodes.filter(code => !existingCodes.includes(code));
        if (missingCodes.length > 0) {
            throw new errors_1.BusinessRuleError(`Invalid module codes: ${missingCodes.join(', ')}`);
        }
    }
    /**
     * Get template usage statistics
     */
    async getTemplateStats() {
        const templates = await shared_types_1.prisma.nicheTemplate.findMany({
            where: { isActive: true },
            select: { code: true, displayName: true },
        });
        const stats = await Promise.all(templates.map(async (template) => {
            const businessCount = await shared_types_1.prisma.business.count({
                where: { category: template.code },
            });
            return {
                code: template.code,
                displayName: template.displayName,
                businessCount,
            };
        }));
        return stats;
    }
}
exports.nicheTemplateService = new NicheTemplateService();
//# sourceMappingURL=niche-template.service.js.map