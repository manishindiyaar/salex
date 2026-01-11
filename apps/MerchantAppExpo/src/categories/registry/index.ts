/**
 * Category Registry - Index
 * 
 * Centralized export for all registry components.
 * Provides singleton instances and factory functions for the category system.
 */

import { BusinessCategory } from '../../types/business';

// Registry components
export { categoryRegistry, CategoryRegistryImpl } from './CategoryRegistry';
export { categoryFactory, CategoryFactoryImpl } from './CategoryFactory';
export { templateLoader, TemplateLoaderImpl, MemoryCacheManager } from './TemplateLoader';

// Convenience function to initialize the category system
export const initializeCategorySystem = async () => {
  console.log('🚀 Initializing category system...');
  
  try {
    // Import the singleton instances
    const { templateLoader } = await import('./TemplateLoader');
    
    // Preload common templates
    await templateLoader.preloadTemplates([BusinessCategory.SALON, BusinessCategory.CLINIC, BusinessCategory.SPA]);
    
    console.log('✅ Category system initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize category system:', error);
    return false;
  }
};

// Convenience function to register all default categories
export const registerDefaultCategories = async () => {
  console.log('📝 Registering default categories...');
  
  try {
    // Import the singleton instances
    const { categoryFactory } = await import('./CategoryFactory');
    
    const categories = [
      {
        category: 'SALON' as const,
        config: {
          category: 'SALON' as const,
          displayName: 'Hair Salon',
          description: 'Hair styling, coloring & treatments',
          icon: '💄',
          templatePath: '/templates/salon.json',
          features: [],
          validationRules: [],
          customizationOptions: [],
        },
      },
      {
        category: 'CLINIC' as const,
        config: {
          category: 'CLINIC' as const,
          displayName: 'Medical Clinic',
          description: 'Medical consultation and treatment services',
          icon: '🏥',
          templatePath: '/templates/clinic.json',
          features: [],
          validationRules: [],
          customizationOptions: [],
        },
      },
      {
        category: 'SPA' as const,
        config: {
          category: 'SPA' as const,
          displayName: 'Wellness Spa',
          description: 'Wellness, massage & relaxation',
          icon: '🧘',
          templatePath: '/templates/spa.json',
          features: [],
          validationRules: [],
          customizationOptions: [],
        },
      },
      {
        category: 'BEAUTY_PARLOR' as const,
        config: {
          category: 'BEAUTY_PARLOR' as const,
          displayName: 'Beauty Parlor',
          description: 'Beauty and cosmetic services',
          icon: '💅',
          templatePath: '/templates/beauty-parlor.json',
          features: [],
          validationRules: [],
          customizationOptions: [],
        },
      },
      {
        category: 'FITNESS' as const,
        config: {
          category: 'FITNESS' as const,
          displayName: 'Fitness Center',
          description: 'Fitness training and wellness services',
          icon: '💪',
          templatePath: '/templates/fitness.json',
          features: [],
          validationRules: [],
          customizationOptions: [],
        },
      },
      {
        category: 'OTHER' as const,
        config: {
          category: 'OTHER' as const,
          displayName: 'Other Business',
          description: 'General service business',
          icon: '🏢',
          templatePath: '/templates/salon.json', // Use salon as fallback
          features: [],
          validationRules: [],
          customizationOptions: [],
        },
      },
    ];

    categories.forEach(({ category, config }) => {
      try {
        categoryFactory.registerCategory(category, config);
      } catch (error) {
        console.error(`Failed to register category ${category}:`, error);
      }
    });

    console.log('✅ Default categories registered');
  } catch (error) {
    console.error('❌ Failed to register default categories:', error);
    throw error;
  }
};

// Convenience function to get category statistics
export const getCategorySystemStats = async () => {
  try {
    // Import the singleton instances
    const { categoryRegistry } = await import('./CategoryRegistry');
    const { categoryFactory } = await import('./CategoryFactory');
    const { templateLoader } = await import('./TemplateLoader');
    
    const registryStats = categoryRegistry.getStatistics();
    const factoryStats = categoryFactory.getInstanceStatistics();
    const cacheStats = templateLoader.getCacheStatistics();

    return {
      registry: registryStats,
      factory: factoryStats,
      cache: cacheStats,
      healthStatus: categoryRegistry.getHealthStatus(),
    };
  } catch (error) {
    console.error('❌ Failed to get category system stats:', error);
    return null;
  }
};