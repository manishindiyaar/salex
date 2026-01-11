/**
 * Template Loader
 * 
 * Handles loading, caching, and validation of category templates.
 * Provides efficient template management with background refresh capabilities.
 */

import { BusinessCategory } from '../../types/business';
import {
  TemplateLoader as ITemplateLoader,
  NicheTemplate,
  ValidationResult,
  TemplateLoadingStatus,
  CacheManager,
  CacheEntry,
} from '../core/types';

// Simple in-memory cache implementation
class MemoryCacheManager implements CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 30 * 60 * 1000; // 30 minutes

  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (entry.expiresAt < new Date()) {
      this.cache.delete(key);
      return null;
    }

    return entry as CacheEntry<T>;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (ttl || this.defaultTTL));
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
      version: '1.0.0',
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

class TemplateLoaderImpl implements ITemplateLoader {
  private cache: CacheManager;
  private loadingStatus = new Map<BusinessCategory, TemplateLoadingStatus>();
  private loadingPromises = new Map<BusinessCategory, Promise<NicheTemplate>>();

  constructor(cache?: CacheManager) {
    this.cache = cache || new MemoryCacheManager();
  }

  /**
   * Load template for a specific category
   */
  async loadTemplate(category: BusinessCategory): Promise<NicheTemplate> {
    // Check if already loading
    const existingPromise = this.loadingPromises.get(category);
    if (existingPromise) {
      return existingPromise;
    }

    // Check cache first
    const cacheKey = `template:${category}`;
    const cached = this.cache.get<NicheTemplate>(cacheKey);
    if (cached) {
      console.log(`📦 Template loaded from cache: ${category}`);
      return cached.data;
    }

    // Update loading status
    this.updateLoadingStatus(category, 'loading');

    // Create loading promise
    const loadingPromise = this.performTemplateLoad(category);
    this.loadingPromises.set(category, loadingPromise);

    try {
      const template = await loadingPromise;
      
      // Cache the result
      this.cache.set(cacheKey, template);
      
      // Update status
      this.updateLoadingStatus(category, 'loaded', undefined, new Date());
      
      console.log(`✅ Template loaded: ${category}`);
      return template;
    } catch (error) {
      console.error(`❌ Failed to load template for ${category}:`, error);
      
      // Update status with error
      this.updateLoadingStatus(category, 'error', error instanceof Error ? error.message : 'Unknown error');
      
      throw error;
    } finally {
      this.loadingPromises.delete(category);
    }
  }

  /**
   * Load all available templates
   */
  async loadAllTemplates(): Promise<NicheTemplate[]> {
    const categories: BusinessCategory[] = [
      BusinessCategory.SALON,
      BusinessCategory.CLINIC, 
      BusinessCategory.SPA,
      BusinessCategory.BEAUTY_PARLOR,
      BusinessCategory.FITNESS,
      BusinessCategory.OTHER,
    ];

    const templates = await Promise.allSettled(
      categories.map(category => this.loadTemplate(category))
    );

    const successfulTemplates: NicheTemplate[] = [];
    
    templates.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulTemplates.push(result.value);
      } else {
        console.error(`Failed to load template for ${categories[index]}:`, result.reason);
      }
    });

    return successfulTemplates;
  }

  /**
   * Reload a specific template (bypass cache)
   */
  async reloadTemplate(category: BusinessCategory): Promise<NicheTemplate> {
    // Invalidate cache
    const cacheKey = `template:${category}`;
    this.cache.invalidate(cacheKey);
    
    // Reset loading status
    this.loadingStatus.delete(category);
    
    // Load fresh template
    return this.loadTemplate(category);
  }

  /**
   * Validate template structure
   */
  validateTemplateStructure(template: any): ValidationResult {
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> = [];

    // Check if template is an object
    if (!template || typeof template !== 'object') {
      errors.push({
        field: 'root',
        message: 'Template must be an object',
        code: 'INVALID_TYPE',
      });
      return { isValid: false, errors, warnings };
    }

    // Required top-level fields
    const requiredFields = ['id', 'code', 'displayName', 'terminology'];
    for (const field of requiredFields) {
      if (!(field in template)) {
        errors.push({
          field,
          message: `Required field '${field}' is missing`,
          code: 'MISSING_FIELD',
        });
      }
    }

    // Validate terminology structure
    if (template.terminology) {
      const requiredTerms = ['customer', 'staff', 'service', 'appointment', 'resource'];
      for (const term of requiredTerms) {
        if (!template.terminology[term]) {
          errors.push({
            field: `terminology.${term}`,
            message: `Required terminology '${term}' is missing`,
            code: 'MISSING_TERMINOLOGY',
          });
        } else {
          // Validate terminology entry structure
          const entry = template.terminology[term];
          if (!entry.singular || !entry.plural) {
            errors.push({
              field: `terminology.${term}`,
              message: `Terminology '${term}' must have singular and plural forms`,
              code: 'INVALID_TERMINOLOGY',
            });
          }
        }
      }
    }

    // Validate arrays
    const arrayFields = ['modules', 'services', 'workflows'];
    for (const field of arrayFields) {
      if (template[field] && !Array.isArray(template[field])) {
        errors.push({
          field,
          message: `Field '${field}' must be an array`,
          code: 'INVALID_TYPE',
        });
      }
    }

    // Validate business category
    if (template.code) {
      const validCategories = ['SALON', 'CLINIC', 'SPA', 'BEAUTY_PARLOR', 'FITNESS', 'OTHER'];
      if (!validCategories.includes(template.code)) {
        warnings.push({
          field: 'code',
          message: `Unknown business category: ${template.code}`,
          code: 'UNKNOWN_CATEGORY',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate template content
   */
  validateTemplateContent(template: NicheTemplate): ValidationResult {
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> = [];

    // Validate modules
    if (template.modules) {
      template.modules.forEach((module, index) => {
        if (!module.code) {
          errors.push({
            field: `modules[${index}].code`,
            message: 'Module code is required',
            code: 'MISSING_FIELD',
          });
        }

        if (!module.name) {
          errors.push({
            field: `modules[${index}].name`,
            message: 'Module name is required',
            code: 'MISSING_FIELD',
          });
        }

        // Check for circular dependencies
        if (module.dependencies && module.dependencies.includes(module.code)) {
          errors.push({
            field: `modules[${index}].dependencies`,
            message: 'Module cannot depend on itself',
            code: 'CIRCULAR_DEPENDENCY',
          });
        }
      });
    }

    // Validate services
    if (template.services) {
      template.services.forEach((service, index) => {
        if (!service.name) {
          errors.push({
            field: `services[${index}].name`,
            message: 'Service name is required',
            code: 'MISSING_FIELD',
          });
        }

        if (service.basePrice < 0) {
          errors.push({
            field: `services[${index}].basePrice`,
            message: 'Service price cannot be negative',
            code: 'INVALID_VALUE',
          });
        }

        if (service.duration <= 0) {
          errors.push({
            field: `services[${index}].duration`,
            message: 'Service duration must be positive',
            code: 'INVALID_VALUE',
          });
        }
      });
    }

    // Validate workflows
    if (template.workflows) {
      template.workflows.forEach((workflow, index) => {
        if (!workflow.name) {
          errors.push({
            field: `workflows[${index}].name`,
            message: 'Workflow name is required',
            code: 'MISSING_FIELD',
          });
        }

        if (!workflow.triggers || workflow.triggers.length === 0) {
          warnings.push({
            field: `workflows[${index}].triggers`,
            message: 'Workflow has no triggers',
            code: 'NO_TRIGGERS',
          });
        }

        if (!workflow.actions || workflow.actions.length === 0) {
          warnings.push({
            field: `workflows[${index}].actions`,
            message: 'Workflow has no actions',
            code: 'NO_ACTIONS',
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Preload templates for specified categories
   */
  async preloadTemplates(categories: BusinessCategory[]): Promise<void> {
    console.log(`🚀 Preloading templates for: ${categories.join(', ')}`);
    
    const loadPromises = categories.map(category => 
      this.loadTemplate(category).catch(error => {
        console.error(`Failed to preload template for ${category}:`, error);
        return null;
      })
    );

    await Promise.all(loadPromises);
    console.log('✅ Template preloading completed');
  }

  /**
   * Get loading status for a category
   */
  getLoadingStatus(category: BusinessCategory): TemplateLoadingStatus {
    return this.loadingStatus.get(category) || {
      category,
      status: 'not_loaded',
      retryCount: 0,
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    // This is a simplified implementation
    // In a real app, you'd track hit/miss rates
    return {
      size: this.cache.size(),
      hitRate: 0.85, // Mock hit rate
      memoryUsage: this.cache.size() * 1024, // Rough estimate
    };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
    this.loadingStatus.clear();
    this.loadingPromises.clear();
    console.log('🧹 Template cache cleared');
  }

  /**
   * Perform the actual template loading
   */
  private async performTemplateLoad(category: BusinessCategory): Promise<NicheTemplate> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // This is a mock implementation
    // In a real app, this would load from an API or local files
    const template = this.createMockTemplate(category);
    
    // Validate the loaded template
    const structureValidation = this.validateTemplateStructure(template);
    if (!structureValidation.isValid) {
      throw new Error(`Invalid template structure: ${structureValidation.errors.map(e => e.message).join(', ')}`);
    }

    const contentValidation = this.validateTemplateContent(template);
    if (!contentValidation.isValid) {
      throw new Error(`Invalid template content: ${contentValidation.errors.map(e => e.message).join(', ')}`);
    }

    return template;
  }

  /**
   * Create a mock template for testing
   */
  private createMockTemplate(category: BusinessCategory): NicheTemplate {
    const templates: Record<BusinessCategory, Partial<NicheTemplate>> = {
      SALON: {
        displayName: 'Hair Salon',
        icon: '💄',
        description: 'Hair styling and beauty services',
        terminology: {
          customer: { singular: 'Customer', plural: 'Customers', variations: {} },
          staff: { singular: 'Stylist', plural: 'Stylists', variations: {} },
          service: { singular: 'Service', plural: 'Services', variations: {} },
          appointment: { singular: 'Appointment', plural: 'Appointments', variations: {} },
          resource: { singular: 'Station', plural: 'Stations', variations: {} },
          book: { singular: 'Book', plural: 'Book', variations: {} },
          schedule: { singular: 'Schedule', plural: 'Schedule', variations: {} },
          cancel: { singular: 'Cancel', plural: 'Cancel', variations: {} },
          complete: { singular: 'Complete', plural: 'Complete', variations: {} },
          contexts: {},
          languages: {},
        },
      },
      CLINIC: {
        displayName: 'Medical Clinic',
        icon: '🏥',
        description: 'Medical consultation and treatment services',
        terminology: {
          customer: { singular: 'Patient', plural: 'Patients', variations: {} },
          staff: { singular: 'Doctor', plural: 'Doctors', variations: {} },
          service: { singular: 'Treatment', plural: 'Treatments', variations: {} },
          appointment: { singular: 'Consultation', plural: 'Consultations', variations: {} },
          resource: { singular: 'Room', plural: 'Rooms', variations: {} },
          book: { singular: 'Schedule', plural: 'Schedule', variations: {} },
          schedule: { singular: 'Schedule', plural: 'Schedule', variations: {} },
          cancel: { singular: 'Cancel', plural: 'Cancel', variations: {} },
          complete: { singular: 'Complete', plural: 'Complete', variations: {} },
          contexts: {},
          languages: {},
        },
      },
      SPA: {
        displayName: 'Wellness Spa',
        icon: '🧘',
        description: 'Wellness and relaxation services',
        terminology: {
          customer: { singular: 'Guest', plural: 'Guests', variations: {} },
          staff: { singular: 'Therapist', plural: 'Therapists', variations: {} },
          service: { singular: 'Treatment', plural: 'Treatments', variations: {} },
          appointment: { singular: 'Session', plural: 'Sessions', variations: {} },
          resource: { singular: 'Room', plural: 'Rooms', variations: {} },
          book: { singular: 'Reserve', plural: 'Reserve', variations: {} },
          schedule: { singular: 'Schedule', plural: 'Schedule', variations: {} },
          cancel: { singular: 'Cancel', plural: 'Cancel', variations: {} },
          complete: { singular: 'Complete', plural: 'Complete', variations: {} },
          contexts: {},
          languages: {},
        },
      },
      BEAUTY_PARLOR: {
        displayName: 'Beauty Parlor',
        icon: '💅',
        description: 'Beauty and cosmetic services',
        terminology: {
          customer: { singular: 'Client', plural: 'Clients', variations: {} },
          staff: { singular: 'Beautician', plural: 'Beauticians', variations: {} },
          service: { singular: 'Service', plural: 'Services', variations: {} },
          appointment: { singular: 'Appointment', plural: 'Appointments', variations: {} },
          resource: { singular: 'Station', plural: 'Stations', variations: {} },
          book: { singular: 'Book', plural: 'Book', variations: {} },
          schedule: { singular: 'Schedule', plural: 'Schedule', variations: {} },
          cancel: { singular: 'Cancel', plural: 'Cancel', variations: {} },
          complete: { singular: 'Complete', plural: 'Complete', variations: {} },
          contexts: {},
          languages: {},
        },
      },
      FITNESS: {
        displayName: 'Fitness Center',
        icon: '💪',
        description: 'Fitness training and wellness services',
        terminology: {
          customer: { singular: 'Member', plural: 'Members', variations: {} },
          staff: { singular: 'Trainer', plural: 'Trainers', variations: {} },
          service: { singular: 'Workout', plural: 'Workouts', variations: {} },
          appointment: { singular: 'Session', plural: 'Sessions', variations: {} },
          resource: { singular: 'Area', plural: 'Areas', variations: {} },
          book: { singular: 'Reserve', plural: 'Reserve', variations: {} },
          schedule: { singular: 'Schedule', plural: 'Schedule', variations: {} },
          cancel: { singular: 'Cancel', plural: 'Cancel', variations: {} },
          complete: { singular: 'Complete', plural: 'Complete', variations: {} },
          contexts: {},
          languages: {},
        },
      },
      OTHER: {
        displayName: 'Other Business',
        icon: '🏢',
        description: 'General business services',
        terminology: {
          customer: { singular: 'Customer', plural: 'Customers', variations: {} },
          staff: { singular: 'Staff', plural: 'Staff', variations: {} },
          service: { singular: 'Service', plural: 'Services', variations: {} },
          appointment: { singular: 'Appointment', plural: 'Appointments', variations: {} },
          resource: { singular: 'Resource', plural: 'Resources', variations: {} },
          book: { singular: 'Book', plural: 'Book', variations: {} },
          schedule: { singular: 'Schedule', plural: 'Schedule', variations: {} },
          cancel: { singular: 'Cancel', plural: 'Cancel', variations: {} },
          complete: { singular: 'Complete', plural: 'Complete', variations: {} },
          contexts: {},
          languages: {},
        },
      },
    };

    const baseTemplate = templates[category] || templates.OTHER;

    return {
      id: `template-${category.toLowerCase()}-${Date.now()}`,
      code: category,
      displayName: baseTemplate.displayName!,
      icon: baseTemplate.icon!,
      description: baseTemplate.description!,
      terminology: baseTemplate.terminology!,
      modules: [],
      services: [],
      workflows: [],
      analytics: { metrics: [], dashboards: [], reports: [] },
      integrations: [],
      customizations: {
        terminology: {},
        modules: [],
        services: [],
        workflows: [],
        ui: { 
          theme: { colors: {}, fonts: {}, spacing: {} }, 
          layout: { navigation: {}, screens: {} }, 
          components: [] 
        },
      },
      version: '1.0.0',
      isCustom: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Update loading status
   */
  private updateLoadingStatus(
    category: BusinessCategory,
    status: 'not_loaded' | 'loading' | 'loaded' | 'error',
    error?: string,
    lastLoaded?: Date
  ): void {
    const currentStatus = this.loadingStatus.get(category) || {
      category,
      status: 'not_loaded',
      retryCount: 0,
    };

    this.loadingStatus.set(category, {
      ...currentStatus,
      status,
      error,
      lastLoaded,
      retryCount: status === 'error' ? currentStatus.retryCount + 1 : currentStatus.retryCount,
    });
  }
}

// Singleton instance
export const templateLoader = new TemplateLoaderImpl();

// Export the class for testing
export { TemplateLoaderImpl, MemoryCacheManager };