/**
 * Template Service
 * 
 * Service for fetching niche templates during onboarding.
 * Task 22.1: Update onboarding flow to load niche template
 */

import { apiClient } from './apiClient';
import { BusinessCategory } from '../types/business';

export interface TerminologyConfig {
  resource: string;
  resourcePlural: string;
  staff: string;
  staffPlural: string;
  booking: string;
  bookingPlural: string;
  customer: string;
  customerPlural: string;
  [key: string]: string;
}

export interface NicheTemplate {
  code: string;
  displayName: string;
  icon: string;
  terminology: TerminologyConfig;
  enabledModules: string[];
  defaultServices: Array<{ name: string; duration: number; price: number }>;
  defaultHours: Record<string, { open: string; close: string; closed: boolean }>;
  messageTemplates: Record<string, string>;
}

export interface TemplateListItem {
  code: string;
  displayName: string;
  icon: string;
  terminology: TerminologyConfig;
  enabledModules: string[];
}

class TemplateService {
  /**
   * Get all available niche templates for business type selection
   */
  async getAllTemplates(): Promise<TemplateListItem[]> {
    try {
      const response = await apiClient.get('/templates');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      throw new Error('Failed to load business templates');
    }
  }

  /**
   * Get template by category code
   */
  async getTemplate(code: string): Promise<NicheTemplate> {
    try {
      const response = await apiClient.get(`/templates/${code}`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch template ${code}:`, error);
      throw new Error(`Failed to load ${code} template`);
    }
  }

  /**
   * Get terminology for a specific template
   */
  async getTerminology(code: string): Promise<TerminologyConfig> {
    try {
      const response = await apiClient.get(`/templates/${code}/terminology`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch terminology for ${code}:`, error);
      throw new Error(`Failed to load ${code} terminology`);
    }
  }

  /**
   * Get template by business category (convenience method)
   */
  async getTemplateByCategory(category: BusinessCategory): Promise<NicheTemplate> {
    return this.getTemplate(category);
  }
}

export const templateService = new TemplateService();