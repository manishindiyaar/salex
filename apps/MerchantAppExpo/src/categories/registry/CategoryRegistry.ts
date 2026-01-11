/**
 * Category Registry
 * 
 * Central registry for managing business category configurations and metadata.
 * Provides registration, lookup, and lifecycle management for all supported categories.
 */

import { BusinessCategory } from '../../types/business';
import {
  CategoryRegistry as ICategoryRegistry,
  CategoryRegistration,
  CategoryMetadata,
  CategoryConfig,
  NicheTemplate,
  ValidationResult,
} from '../core/types';

class CategoryRegistryImpl implements ICategoryRegistry {
  private registrations = new Map<BusinessCategory, CategoryRegistration>();
  private metadata = new Map<BusinessCategory, CategoryMetadata>();
  private registrationCallbacks: ((category: BusinessCategory) => void)[] = [];
  private unregistrationCallbacks: ((category: BusinessCategory) => void)[] = [];

  /**
   * Register a new business category
   */
  register(category: BusinessCategory, config: CategoryRegistration): void {
    // Validate the registration
    this.validateRegistration(category, config);

    // Store the registration
    this.registrations.set(category, {
      ...config,
      registeredAt: new Date(),
    });

    // Initialize metadata
    this.metadata.set(category, {
      category,
      displayName: config.config.displayName,
      description: config.config.description,
      icon: config.config.icon,
      usageCount: 0,
      averageLoadTime: 0,
      isActive: true,
      healthStatus: 'healthy',
      lastHealthCheck: new Date(),
    });

    // Notify callbacks
    this.registrationCallbacks.forEach(callback => callback(category));

    console.log(`✅ Category registered: ${category}`);
  }

  /**
   * Unregister a business category
   */
  unregister(category: BusinessCategory): void {
    if (!this.registrations.has(category)) {
      console.warn(`⚠️ Attempted to unregister non-existent category: ${category}`);
      return;
    }

    this.registrations.delete(category);
    this.metadata.delete(category);

    // Notify callbacks
    this.unregistrationCallbacks.forEach(callback => callback(category));

    console.log(`🗑️ Category unregistered: ${category}`);
  }

  /**
   * Get category registration
   */
  get(category: BusinessCategory): CategoryRegistration | null {
    return this.registrations.get(category) || null;
  }

  /**
   * Get all registered categories
   */
  getAll(): CategoryRegistration[] {
    return Array.from(this.registrations.values());
  }

  /**
   * Check if category exists
   */
  exists(category: BusinessCategory): boolean {
    return this.registrations.has(category);
  }

  /**
   * Get category metadata
   */
  getMetadata(category: BusinessCategory): CategoryMetadata | null {
    return this.metadata.get(category) || null;
  }

  /**
   * Update category metadata
   */
  updateMetadata(category: BusinessCategory, updates: Partial<CategoryMetadata>): void {
    const existing = this.metadata.get(category);
    if (!existing) {
      console.warn(`⚠️ Attempted to update metadata for non-existent category: ${category}`);
      return;
    }

    this.metadata.set(category, {
      ...existing,
      ...updates,
    });
  }

  /**
   * Register callback for category registration events
   */
  onRegistration(callback: (category: BusinessCategory) => void): void {
    this.registrationCallbacks.push(callback);
  }

  /**
   * Register callback for category unregistration events
   */
  onUnregistration(callback: (category: BusinessCategory) => void): void {
    this.unregistrationCallbacks.push(callback);
  }

  /**
   * Get categories by status
   */
  getActiveCategories(): BusinessCategory[] {
    return Array.from(this.metadata.entries())
      .filter(([_, metadata]) => metadata.isActive)
      .map(([category, _]) => category);
  }

  /**
   * Get category health status
   */
  getHealthStatus(): Record<BusinessCategory, 'healthy' | 'warning' | 'error'> {
    const status: Record<string, 'healthy' | 'warning' | 'error'> = {};
    
    this.metadata.forEach((metadata, category) => {
      status[category] = metadata.healthStatus;
    });

    return status as Record<BusinessCategory, 'healthy' | 'warning' | 'error'>;
  }

  /**
   * Update usage statistics
   */
  recordUsage(category: BusinessCategory, loadTime?: number): void {
    const metadata = this.metadata.get(category);
    if (!metadata) return;

    const updatedMetadata = {
      ...metadata,
      usageCount: metadata.usageCount + 1,
      lastUsed: new Date(),
    };

    if (loadTime !== undefined) {
      // Calculate rolling average load time
      const totalLoadTime = metadata.averageLoadTime * (metadata.usageCount - 1) + loadTime;
      updatedMetadata.averageLoadTime = totalLoadTime / metadata.usageCount;
    }

    this.metadata.set(category, updatedMetadata);
  }

  /**
   * Perform health check on category
   */
  async performHealthCheck(category: BusinessCategory): Promise<'healthy' | 'warning' | 'error'> {
    const registration = this.registrations.get(category);
    if (!registration) return 'error';

    try {
      // Try to load the template
      const template = await registration.loader();
      
      // Validate the template
      const validation = registration.validator(template);
      
      let status: 'healthy' | 'warning' | 'error' = 'healthy';
      
      if (!validation.isValid) {
        status = validation.errors.length > 0 ? 'error' : 'warning';
      }

      // Update metadata
      this.updateMetadata(category, {
        healthStatus: status,
        lastHealthCheck: new Date(),
      });

      return status;
    } catch (error) {
      console.error(`❌ Health check failed for category ${category}:`, error);
      
      this.updateMetadata(category, {
        healthStatus: 'error',
        lastHealthCheck: new Date(),
      });

      return 'error';
    }
  }

  /**
   * Get category statistics
   */
  getStatistics(): {
    totalCategories: number;
    activeCategories: number;
    totalUsage: number;
    averageLoadTime: number;
    healthyCategories: number;
  } {
    const metadataArray = Array.from(this.metadata.values());
    
    return {
      totalCategories: metadataArray.length,
      activeCategories: metadataArray.filter(m => m.isActive).length,
      totalUsage: metadataArray.reduce((sum, m) => sum + m.usageCount, 0),
      averageLoadTime: metadataArray.reduce((sum, m) => sum + m.averageLoadTime, 0) / metadataArray.length || 0,
      healthyCategories: metadataArray.filter(m => m.healthStatus === 'healthy').length,
    };
  }

  /**
   * Clear all registrations (for testing)
   */
  clear(): void {
    this.registrations.clear();
    this.metadata.clear();
    console.log('🧹 Category registry cleared');
  }

  /**
   * Validate category registration
   */
  private validateRegistration(category: BusinessCategory, config: CategoryRegistration): void {
    if (!category) {
      throw new Error('Category is required');
    }

    if (!config.config) {
      throw new Error('Category config is required');
    }

    if (!config.loader) {
      throw new Error('Template loader is required');
    }

    if (!config.validator) {
      throw new Error('Template validator is required');
    }

    if (this.registrations.has(category)) {
      throw new Error(`Category ${category} is already registered`);
    }

    // Validate config structure
    const requiredConfigFields = ['displayName', 'description', 'icon', 'templatePath'];
    for (const field of requiredConfigFields) {
      if (!config.config[field as keyof CategoryConfig]) {
        throw new Error(`Category config missing required field: ${field}`);
      }
    }
  }
}

// Singleton instance
export const categoryRegistry = new CategoryRegistryImpl();

// Export the class for testing
export { CategoryRegistryImpl };