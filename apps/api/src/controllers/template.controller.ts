/**
 * Template Controller
 * 
 * Public endpoints for niche template access by merchant app.
 * Task 22.1: Update onboarding flow to load niche template
 */

import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { nicheTemplateService } from '../services/niche-template.service';

class TemplateController {
  /**
   * GET /v1/templates
   * List all active niche templates for business type selection
   */
  async listTemplates(req: Request, res: Response) {
    try {
      const templates = await nicheTemplateService.getAllTemplates();

      // Return simplified template data for onboarding
      const simplifiedTemplates = templates.map(template => ({
        code: template.code,
        displayName: template.displayName,
        icon: template.icon,
        terminology: template.terminology,
        enabledModules: template.enabledModules,
      }));

      res.json({
        success: true,
        data: simplifiedTemplates,
      });
    } catch (error: any) {
      logger.error({ error }, 'Failed to list templates');
      res.status(500).json({
        success: false,
        error: 'Failed to load templates',
      });
    }
  }

  /**
   * GET /v1/templates/:code
   * Get template by code for onboarding configuration
   */
  async getTemplate(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const template = await nicheTemplateService.getTemplate(code);

      // Return template data needed for onboarding
      res.json({
        success: true,
        data: {
          code: template.code,
          displayName: template.displayName,
          icon: template.icon,
          terminology: template.terminology,
          enabledModules: template.enabledModules,
          defaultServices: template.defaultServices,
          defaultHours: template.defaultHours,
          messageTemplates: template.messageTemplates,
        },
      });
    } catch (error: any) {
      logger.error({ code: req.params.code, error }, 'Failed to get template');
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Template not found',
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to load template',
        });
      }
    }
  }

  /**
   * GET /v1/templates/:code/terminology
   * Get terminology for a specific template
   */
  async getTerminology(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const terminology = await nicheTemplateService.getTerminology(code as any);

      res.json({
        success: true,
        data: terminology,
      });
    } catch (error: any) {
      logger.error({ code: req.params.code, error }, 'Failed to get terminology');
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Template not found',
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to load terminology',
        });
      }
    }
  }
}

export const templateController = new TemplateController();