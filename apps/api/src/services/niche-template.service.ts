/**
 * Niche Template Service
 * 
 * Handles niche template management for different business categories.
 * Templates define terminology, enabled modules, default services, and message templates.
 */

import { prisma, NicheTemplate, BusinessCategory } from '@salex/shared-types';
import { logger } from '../utils/logger';
import { NotFoundError, BusinessRuleError } from '../utils/errors';

interface CreateTemplateInput {
  code: string;
  displayName: string;
  icon: string;
  terminology: TerminologyConfig;
  enabledModules: string[];
  defaultServices: DefaultService[];
  defaultHours: DefaultHours;
  messageTemplates: MessageTemplates;
}

interface UpdateTemplateInput {
  displayName?: string;
  icon?: string;
  terminology?: TerminologyConfig;
  enabledModules?: string[];
  defaultServices?: DefaultService[];
  defaultHours?: DefaultHours;
  messageTemplates?: MessageTemplates;
}

interface TerminologyConfig {
  resource: string;
  resourcePlural: string;
  staff: string;
  staffPlural: string;
  service: string;
  servicePlural: string;
  appointment: string;
  appointmentPlural: string;
  customer: string;
  customerPlural: string;
}

interface DefaultService {
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
}

interface DefaultHours {
  open: string;  // "09:00"
  close: string; // "21:00"
  daysOfWeek: number[]; // [1,2,3,4,5,6] (Monday to Saturday)
}

interface MessageTemplates {
  welcome: string;
  serviceList: string;
  bookingConfirmation: string;
  bookingReminder: string;
  businessClosed: string;
}

class NicheTemplateService {
  /**
   * Get template by code
   */
  async getTemplate(code: string): Promise<NicheTemplate> {
    const template = await prisma.nicheTemplate.findUnique({
      where: { code },
    });

    if (!template) {
      throw new NotFoundError(`Template with code '${code}' not found`);
    }

    if (!template.isActive) {
      throw new BusinessRuleError(`Template '${code}' is not active`);
    }

    return template;
  }

  /**
   * Get all active templates
   */
  async getAllTemplates(): Promise<NicheTemplate[]> {
    return prisma.nicheTemplate.findMany({
      where: { isActive: true },
      orderBy: { displayName: 'asc' },
    });
  }

  /**
   * Create new template
   */
  async createTemplate(input: CreateTemplateInput): Promise<NicheTemplate> {
    const {
      code,
      displayName,
      icon,
      terminology,
      enabledModules,
      defaultServices,
      defaultHours,
      messageTemplates,
    } = input;

    // Check if template with code already exists
    const existingTemplate = await prisma.nicheTemplate.findUnique({
      where: { code },
    });

    if (existingTemplate) {
      throw new BusinessRuleError(`Template with code '${code}' already exists`);
    }

    // Validate enabled modules exist
    await this.validateModules(enabledModules);

    const template = await prisma.nicheTemplate.create({
      data: {
        code,
        displayName,
        icon,
        terminology: terminology as any,
        enabledModules,
        defaultServices: defaultServices as any,
        defaultHours: defaultHours as any,
        messageTemplates: messageTemplates as any,
      },
    });

    logger.info(
      { templateId: template.id, code, displayName },
      'Niche template created'
    );

    return template;
  }

  /**
   * Update existing template
   */
  async updateTemplate(code: string, input: UpdateTemplateInput): Promise<NicheTemplate> {
    await this.getTemplate(code);

    // Validate enabled modules if provided
    if (input.enabledModules) {
      await this.validateModules(input.enabledModules);
    }

    const template = await prisma.nicheTemplate.update({
      where: { code },
      data: input as any,
    });

    logger.info(
      { templateId: template.id, code, updates: Object.keys(input) },
      'Niche template updated'
    );

    return template;
  }

  /**
   * Delete template (soft delete by setting isActive = false)
   */
  async deleteTemplate(code: string): Promise<void> {
    const template = await this.getTemplate(code);

    // Check if template is being used by any businesses
    const businessCount = await prisma.business.count({
      where: { category: code as BusinessCategory },
    });

    if (businessCount > 0) {
      throw new BusinessRuleError(
        `Cannot delete template '${code}' as it is being used by ${businessCount} businesses`
      );
    }

    await prisma.nicheTemplate.update({
      where: { code },
      data: { isActive: false },
    });

    logger.info({ templateId: template.id, code }, 'Niche template deleted');
  }

  /**
   * Apply template to business during onboarding
   */
  async applyTemplate(businessId: string, templateCode: string): Promise<void> {
    const template = await this.getTemplate(templateCode);

    // Get business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundError('Business not found');
    }

    // Create module configurations for enabled modules
    const moduleConfigs = template.enabledModules.map(moduleCode => ({
      businessId,
      moduleCode,
      isEnabled: true,
    }));

    // Apply template in a transaction
    await prisma.$transaction(async (tx) => {
      // Update business category
      await tx.business.update({
        where: { id: businessId },
        data: { category: templateCode as BusinessCategory },
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
        const defaultServices = (template.defaultServices as unknown as DefaultService[]).map(service => ({
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

    logger.info(
      { businessId, templateCode, enabledModules: template.enabledModules },
      'Template applied to business'
    );
  }

  /**
   * Get terminology for a business category
   */
  async getTerminology(category: BusinessCategory): Promise<TerminologyConfig> {
    const template = await this.getTemplate(category);
    return template.terminology as unknown as TerminologyConfig;
  }

  /**
   * Get message templates for a business category
   */
  async getMessageTemplates(category: BusinessCategory): Promise<MessageTemplates> {
    const template = await this.getTemplate(category);
    return template.messageTemplates as unknown as MessageTemplates;
  }

  /**
   * Get default services for a template
   */
  async getDefaultServices(templateCode: string): Promise<DefaultService[]> {
    const template = await this.getTemplate(templateCode);
    return template.defaultServices as unknown as DefaultService[];
  }

  /**
   * Get default hours for a template
   */
  async getDefaultHours(templateCode: string): Promise<DefaultHours> {
    const template = await this.getTemplate(templateCode);
    return template.defaultHours as unknown as DefaultHours;
  }

  /**
   * Validate that all module codes exist
   */
  private async validateModules(moduleCodes: string[]): Promise<void> {
    const existingModules = await prisma.featureModule.findMany({
      where: {
        code: { in: moduleCodes },
        isActive: true,
      },
      select: { code: true },
    });

    const existingCodes = existingModules.map(m => m.code);
    const missingCodes = moduleCodes.filter(code => !existingCodes.includes(code));

    if (missingCodes.length > 0) {
      throw new BusinessRuleError(
        `Invalid module codes: ${missingCodes.join(', ')}`
      );
    }
  }

  /**
   * Get template usage statistics
   */
  async getTemplateStats() {
    const templates = await prisma.nicheTemplate.findMany({
      where: { isActive: true },
      select: { code: true, displayName: true },
    });

    const stats = await Promise.all(
      templates.map(async (template) => {
        const businessCount = await prisma.business.count({
          where: { category: template.code as BusinessCategory },
        });

        return {
          code: template.code,
          displayName: template.displayName,
          businessCount,
        };
      })
    );

    return stats;
  }
}

export const nicheTemplateService = new NicheTemplateService();