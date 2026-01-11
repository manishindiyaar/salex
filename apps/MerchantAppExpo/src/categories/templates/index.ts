/**
 * Category Templates Index
 * 
 * Central export point for all business category templates.
 * Each template defines the complete configuration for a specific business type.
 */

import { BusinessCategory } from '../../types/business';
import { NicheTemplate } from '../core/types';

// Import all templates
import { salonTemplate } from './salon.template';
import { clinicTemplate } from './clinic.template';
import { spaTemplate } from './spa.template';
import { beautyParlorTemplate } from './beauty-parlor.template';
import { fitnessTemplate } from './fitness.template';

// Template registry mapping
export const CATEGORY_TEMPLATES: Record<BusinessCategory, NicheTemplate> = {
  [BusinessCategory.SALON]: salonTemplate,
  [BusinessCategory.CLINIC]: clinicTemplate,
  [BusinessCategory.SPA]: spaTemplate,
  [BusinessCategory.BEAUTY_PARLOR]: beautyParlorTemplate,
  [BusinessCategory.FITNESS]: fitnessTemplate,
  [BusinessCategory.OTHER]: salonTemplate, // Use salon template as fallback for OTHER category
};

// Export individual templates
export {
  salonTemplate,
  clinicTemplate,
  spaTemplate,
  beautyParlorTemplate,
  fitnessTemplate,
};

// Helper functions
export const getTemplateByCategory = (category: BusinessCategory): NicheTemplate | null => {
  return CATEGORY_TEMPLATES[category] || null;
};

export const getAllTemplates = (): NicheTemplate[] => {
  return Object.values(CATEGORY_TEMPLATES);
};

export const getSupportedCategories = (): BusinessCategory[] => {
  return Object.keys(CATEGORY_TEMPLATES) as BusinessCategory[];
};

export const isValidCategory = (category: string): category is BusinessCategory => {
  return category in CATEGORY_TEMPLATES;
};

// Template validation helper
export const validateTemplate = (template: NicheTemplate): boolean => {
  try {
    // Basic validation checks
    if (!template.id || !template.code || !template.displayName) {
      return false;
    }
    
    if (!template.terminology || !template.modules || !template.services) {
      return false;
    }
    
    // Check required terminology fields
    const requiredTerms = ['customer', 'staff', 'service', 'appointment', 'resource'];
    for (const term of requiredTerms) {
      if (!template.terminology[term as keyof typeof template.terminology]) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Template validation error:', error);
    return false;
  }
};

// Template metadata
export const TEMPLATE_METADATA = {
  version: '1.0.0',
  totalTemplates: Object.keys(CATEGORY_TEMPLATES).length,
  supportedCategories: getSupportedCategories(),
  lastUpdated: new Date('2024-01-01'),
};

export default CATEGORY_TEMPLATES;