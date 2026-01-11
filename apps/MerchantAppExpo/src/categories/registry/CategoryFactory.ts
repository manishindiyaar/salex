/**
 * Category Factory
 * 
 * Factory for creating and managing category instances.
 * Handles category instantiation, caching, and lifecycle management.
 */

import { BusinessCategory } from '../../types/business';
import {
  CategoryFactory as ICategoryFactory,
  CategoryInstance,
  CategoryConfig,
  NicheTemplate,
  ValidationResult,
  TerminologyConfig,
  ModuleConfig,
  ServiceTemplate,
  WorkflowTemplate,
} from '../core/types';
import { categoryRegistry } from './CategoryRegistry';

class CategoryInstanceImpl implements CategoryInstance {
  public readonly category: BusinessCategory;
  public readonly template: NicheTemplate;
  public readonly config: CategoryConfig;
  public readonly isInitialized: boolean = true;
  public readonly lastUpdated: Date;
  public readonly version: string;

  constructor(category: BusinessCategory, template: NicheTemplate, config: CategoryConfig) {
    this.category = category;
    this.template = template;
    this.config = config;
    this.lastUpdated = new Date();
    this.version = template.version || '1.0.0';
  }

  getTerminology(): TerminologyConfig {
    return this.template.terminology;
  }

  getModules(): ModuleConfig[] {
    return this.template.modules;
  }

  getServices(): ServiceTemplate[] {
    return this.template.services;
  }

  getWorkflows(): WorkflowTemplate[] {
    return this.template.workflows;
  }
}

class CategoryFactoryImpl implements ICategoryFactory {
  private instances = new Map<BusinessCategory, CategoryInstance>();
  private loadingPromises = new Map<BusinessCategory, Promise<CategoryInstance>>();

  /**
   * Create a category instance
   */
  async createCategoryInstance(category: BusinessCategory): Promise<CategoryInstance> {
    // Check if already loading
    const existingPromise = this.loadingPromises.get(category);
    if (existingPromise) {
      return existingPromise;
    }

    // Check if already exists
    const existingInstance = this.instances.get(category);
    if (existingInstance) {
      return existingInstance;
    }

    // Create loading promise
    const loadingPromise = this.loadCategoryInstance(category);
    this.loadingPromises.set(category, loadingPromise);

    try {
      const instance = await loadingPromise;
      this.instances.set(category, instance);
      return instance;
    } finally {
      this.loadingPromises.delete(category);
    }
  }

  /**
   * Get existing category instance
   */
  getCategoryInstance(category: BusinessCategory): CategoryInstance | null {
    return this.instances.get(category) || null;
  }

  /**
   * Register a category configuration
   */
  registerCategory(category: BusinessCategory, config: CategoryConfig): void {
    // Validate the config
    const validation = this.validateCategoryConfig(config);
    if (!validation.isValid) {
      throw new Error(`Invalid category config: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Create registration for the registry
    const registration = {
      category,
      config,
      loader: () => this.loadTemplate(category),
      validator: (template: NicheTemplate) => this.validateTemplate(template),
      registeredAt: new Date(),
      version: '1.0.0',
      author: 'Salex System',
      dependencies: [],
      conflicts: [],
    };

    // Register with the registry
    categoryRegistry.register(category, registration);

    console.log(`✅ Category registered with factory: ${category}`);
  }

  /**
   * Unregister a category
   */
  unregisterCategory(category: BusinessCategory): void {
    // Remove from instances
    this.instances.delete(category);
    this.loadingPromises.delete(category);

    // Unregister from registry
    categoryRegistry.unregister(category);

    console.log(`🗑️ Category unregistered from factory: ${category}`);
  }

  /**
   * Get all registered categories
   */
  getRegisteredCategories(): BusinessCategory[] {
    return categoryRegistry.getActiveCategories();
  }

  /**
   * Validate category configuration
   */
  validateCategoryConfig(config: CategoryConfig): ValidationResult {
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> = [];

    // Required fields
    if (!config.category) {
      errors.push({
        field: 'category',
        message: 'Category is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!config.displayName) {
      errors.push({
        field: 'displayName',
        message: 'Display name is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!config.description) {
      errors.push({
        field: 'description',
        message: 'Description is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!config.icon) {
      errors.push({
        field: 'icon',
        message: 'Icon is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!config.templatePath) {
      errors.push({
        field: 'templatePath',
        message: 'Template path is required',
        code: 'REQUIRED_FIELD',
      });
    }

    // Validate features
    if (config.features) {
      config.features.forEach((feature, index) => {
        if (!feature.name) {
          errors.push({
            field: `features[${index}].name`,
            message: 'Feature name is required',
            code: 'REQUIRED_FIELD',
          });
        }
      });
    }

    // Validate validation rules
    if (config.validationRules) {
      config.validationRules.forEach((rule, index) => {
        if (!rule.field) {
          errors.push({
            field: `validationRules[${index}].field`,
            message: 'Validation rule field is required',
            code: 'REQUIRED_FIELD',
          });
        }

        if (!rule.type) {
          errors.push({
            field: `validationRules[${index}].type`,
            message: 'Validation rule type is required',
            code: 'REQUIRED_FIELD',
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
   * Refresh a category instance
   */
  async refreshCategoryInstance(category: BusinessCategory): Promise<CategoryInstance> {
    // Remove existing instance
    this.instances.delete(category);
    
    // Create new instance
    return this.createCategoryInstance(category);
  }

  /**
   * Get category instance statistics
   */
  getInstanceStatistics(): {
    totalInstances: number;
    loadedCategories: BusinessCategory[];
    memoryUsage: number;
  } {
    return {
      totalInstances: this.instances.size,
      loadedCategories: Array.from(this.instances.keys()),
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Clear all instances (for testing)
   */
  clear(): void {
    this.instances.clear();
    this.loadingPromises.clear();
    console.log('🧹 Category factory cleared');
  }

  /**
   * Load category instance from registry
   */
  private async loadCategoryInstance(category: BusinessCategory): Promise<CategoryInstance> {
    const registration = categoryRegistry.get(category);
    if (!registration) {
      throw new Error(`Category ${category} is not registered`);
    }

    const startTime = Date.now();

    try {
      // Load template
      const template = await registration.loader();
      
      // Validate template
      const validation = registration.validator(template);
      if (!validation.isValid) {
        throw new Error(`Invalid template for ${category}: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Create instance
      const instance = new CategoryInstanceImpl(category, template, registration.config);

      // Record usage statistics
      const loadTime = Date.now() - startTime;
      categoryRegistry.recordUsage(category, loadTime);

      console.log(`✅ Category instance created: ${category} (${loadTime}ms)`);
      return instance;
    } catch (error) {
      console.error(`❌ Failed to create category instance for ${category}:`, error);
      throw error;
    }
  }

  /**
   * Load template from local templates or remote source
   */
  private async loadTemplate(category: BusinessCategory): Promise<NicheTemplate> {
    // Import templates dynamically to avoid circular dependencies
    const { getTemplateByCategory } = await import('../templates');
    
    const template = getTemplateByCategory(category);
    if (!template) {
      throw new Error(`No template found for category: ${category}`);
    }
    
    return template;
  }

  /**
   * Validate template structure
   */
  private validateTemplate(template: NicheTemplate): ValidationResult {
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> = [];

    // Required fields
    if (!template.id) {
      errors.push({
        field: 'id',
        message: 'Template ID is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!template.code) {
      errors.push({
        field: 'code',
        message: 'Template code is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!template.displayName) {
      errors.push({
        field: 'displayName',
        message: 'Template display name is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!template.terminology) {
      errors.push({
        field: 'terminology',
        message: 'Template terminology is required',
        code: 'REQUIRED_FIELD',
      });
    }

    // Validate terminology structure
    if (template.terminology) {
      const requiredTerms = ['customer', 'staff', 'service', 'appointment', 'resource'];
      for (const term of requiredTerms) {
        if (!template.terminology[term as keyof TerminologyConfig]) {
          errors.push({
            field: `terminology.${term}`,
            message: `Terminology for ${term} is required`,
            code: 'REQUIRED_TERMINOLOGY',
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Estimate memory usage (rough calculation)
   */
  private estimateMemoryUsage(): number {
    // Rough estimate: each instance is approximately 50KB
    return this.instances.size * 50 * 1024;
  }
}

// Singleton instance
export const categoryFactory = new CategoryFactoryImpl();

// Export the class for testing
export { CategoryFactoryImpl };