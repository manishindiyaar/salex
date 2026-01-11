/**
 * Category Context
 * 
 * React Context for managing category-specific data and functionality.
 * Provides centralized access to terminology, modules, and category configuration
 * throughout the application component tree.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { BusinessCategory } from '../../../types/business';
import {
  CategoryContextValue,
  CategoryProviderProps,
  NicheTemplate,
  TerminologyConfig,
  ModuleConfig,
  WorkflowConfig,
} from '../types';
import { categoryFactory } from '../../registry';
import { templateLoader } from '../../registry/TemplateLoader';

// Create the context
const CategoryContext = createContext<CategoryContextValue | null>(null);

/**
 * Category Provider Component
 * 
 * Wraps the application and provides category-specific data to all child components.
 * Handles loading, caching, and updating of category templates.
 */
export const CategoryProvider: React.FC<CategoryProviderProps> = ({
  businessId,
  children,
  fallbackCategory = BusinessCategory.SALON,
}) => {
  // State management
  const [category, setCategory] = useState<BusinessCategory>(fallbackCategory);
  const [template, setTemplate] = useState<NicheTemplate | null>(null);
  const [terminology, setTerminology] = useState<TerminologyConfig | null>(null);
  const [modules, setModules] = useState<ModuleConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Custom terminology overrides
  const [terminologyOverrides, setTerminologyOverrides] = useState<Partial<TerminologyConfig>>({});

  /**
   * Load category data
   */
  const loadCategoryData = useCallback(async (targetCategory: BusinessCategory) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔄 Loading category data for: ${targetCategory}`);

      // Create or get category instance
      const instance = await categoryFactory.createCategoryInstance(targetCategory);
      
      // Update state
      setTemplate(instance.template);
      setTerminology(instance.getTerminology());
      setModules(instance.getModules());
      setCategory(targetCategory);

      console.log(`✅ Category data loaded: ${targetCategory}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load category data';
      console.error(`❌ Failed to load category ${targetCategory}:`, err);
      setError(errorMessage);

      // Fallback to default category if current category fails
      if (targetCategory !== fallbackCategory) {
        console.log(`🔄 Falling back to default category: ${fallbackCategory}`);
        try {
          const fallbackInstance = await categoryFactory.createCategoryInstance(fallbackCategory);
          setTemplate(fallbackInstance.template);
          setTerminology(fallbackInstance.getTerminology());
          setModules(fallbackInstance.getModules());
          setCategory(fallbackCategory);
          setError(`Failed to load ${targetCategory}, using ${fallbackCategory} instead`);
        } catch (fallbackErr) {
          console.error(`❌ Fallback category also failed:`, fallbackErr);
          setError('Failed to load any category data');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [fallbackCategory]);

  /**
   * Get terminology term with context support
   */
  const getTerm = useCallback((key: string, context?: string): string => {
    if (!terminology) return key;

    // Check for overrides first
    const overrideKey = context ? `${context}.${key}` : key;
    const override = terminologyOverrides[overrideKey as keyof TerminologyConfig];
    if (override) {
      if (typeof override === 'object' && override && 'singular' in override) {
        return (override as any).singular;
      }
      if (typeof override === 'string') {
        return override;
      }
    }

    // Check context-specific terminology
    if (context && terminology.contexts && terminology.contexts[context]) {
      const contextEntry = terminology.contexts[context];
      if (contextEntry.variations && contextEntry.variations[key]) {
        return contextEntry.variations[key];
      }
    }

    // Get base terminology
    const termEntry = terminology[key as keyof TerminologyConfig];
    if (termEntry && typeof termEntry === 'object' && 'singular' in termEntry) {
      return (termEntry as any).singular;
    }

    // Fallback to key if not found
    console.warn(`⚠️ Terminology not found for key: ${key} (context: ${context})`);
    return key;
  }, [terminology, terminologyOverrides]);

  /**
   * Get plural form of terminology
   */
  const getPluralTerm = useCallback((key: string, context?: string): string => {
    if (!terminology) return key;

    // Check for overrides first
    const overrideKey = context ? `${context}.${key}` : key;
    const override = terminologyOverrides[overrideKey as keyof TerminologyConfig];
    if (override) {
      if (typeof override === 'object' && override && 'plural' in override) {
        return (override as any).plural;
      }
    }

    // Check context-specific terminology
    if (context && terminology.contexts && terminology.contexts[context]) {
      const contextEntry = terminology.contexts[context];
      if (contextEntry.variations && contextEntry.variations[`${key}_plural`]) {
        return contextEntry.variations[`${key}_plural`];
      }
    }

    // Get base terminology
    const termEntry = terminology[key as keyof TerminologyConfig];
    if (termEntry && typeof termEntry === 'object' && 'plural' in termEntry) {
      return (termEntry as any).plural;
    }

    // Fallback to key + 's' if not found
    console.warn(`⚠️ Plural terminology not found for key: ${key} (context: ${context})`);
    return `${key}s`;
  }, [terminology, terminologyOverrides]);

  /**
   * Check if a module is enabled
   */
  const isModuleEnabled = useCallback((moduleCode: string): boolean => {
    return modules.some(module => module.code === moduleCode && module.enabledByDefault);
  }, [modules]);

  /**
   * Get workflow configuration
   */
  const getWorkflow = useCallback((workflowType: string): WorkflowConfig | null => {
    if (!template || !template.workflows) return null;

    const workflow = template.workflows.find(w => w.name === workflowType || w.id === workflowType);
    if (!workflow) return null;

    // Convert WorkflowTemplate to WorkflowConfig
    return {
      ...workflow,
      executionHistory: [],
      successRate: 1.0,
    };
  }, [template]);

  /**
   * Update category
   */
  const updateCategory = useCallback(async (newCategory: BusinessCategory): Promise<void> => {
    if (newCategory === category) return;
    
    console.log(`🔄 Updating category from ${category} to ${newCategory}`);
    await loadCategoryData(newCategory);
  }, [category, loadCategoryData]);

  /**
   * Refresh current template
   */
  const refreshTemplate = useCallback(async (): Promise<void> => {
    console.log(`🔄 Refreshing template for category: ${category}`);
    
    // Reload template bypassing cache
    await templateLoader.reloadTemplate(category);
    
    // Reload category data
    await loadCategoryData(category);
  }, [category, loadCategoryData]);

  /**
   * Customize terminology
   */
  const customizeTerminology = useCallback((overrides: Partial<TerminologyConfig>): void => {
    console.log('🎨 Applying terminology customizations:', overrides);
    setTerminologyOverrides(prev => ({ ...prev, ...overrides }));
  }, []);

  /**
   * Get available modules for current category
   */
  const getAvailableModules = useCallback((): ModuleConfig[] => {
    return modules.filter(module => 
      module.requiredForCategories.length === 0 || 
      module.requiredForCategories.includes(category)
    );
  }, [modules, category]);

  /**
   * Get enabled modules for current category
   */
  const getEnabledModules = useCallback((): ModuleConfig[] => {
    return modules.filter(module => module.enabledByDefault);
  }, [modules]);

  /**
   * Check if category supports a feature
   */
  const supportsFeature = useCallback((featureCode: string): boolean => {
    if (!template) return false;
    
    // Check if any module provides this feature
    return modules.some(module => 
      module.enabledByDefault && 
      module.uiConfig?.customComponents?.some(component => 
        component.name === featureCode
      )
    );
  }, [template, modules]);

  // Load initial category data
  useEffect(() => {
    loadCategoryData(category);
  }, [loadCategoryData, category]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<CategoryContextValue>(() => ({
    // Current category data
    category,
    template,
    terminology,
    modules,
    
    // Loading states
    isLoading,
    error,
    
    // Helper functions
    getTerm,
    getPluralTerm,
    isModuleEnabled,
    getWorkflow,
    
    // Extended helper functions
    getAvailableModules,
    getEnabledModules,
    supportsFeature,
    
    // State management
    updateCategory,
    refreshTemplate,
    customizeTerminology,
  }), [
    category,
    template,
    terminology,
    modules,
    isLoading,
    error,
    getTerm,
    getPluralTerm,
    isModuleEnabled,
    getWorkflow,
    getAvailableModules,
    getEnabledModules,
    supportsFeature,
    updateCategory,
    refreshTemplate,
    customizeTerminology,
  ]);

  return (
    <CategoryContext.Provider value={contextValue}>
      {children}
    </CategoryContext.Provider>
  );
};

/**
 * Hook to use category context
 * 
 * Provides access to category-specific data and functions.
 * Must be used within a CategoryProvider.
 */
export const useCategoryContext = (): CategoryContextValue => {
  const context = useContext(CategoryContext);
  
  if (!context) {
    throw new Error('useCategoryContext must be used within a CategoryProvider');
  }
  
  return context;
};

/**
 * Hook to check if category context is available
 */
export const useHasCategoryContext = (): boolean => {
  const context = useContext(CategoryContext);
  return context !== null;
};

/**
 * Higher-order component to inject category context
 */
export const withCategoryContext = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P & { categoryContext?: CategoryContextValue }> => {
  return (props: P) => {
    const categoryContext = useContext(CategoryContext);
    
    return (
      <Component 
        {...props} 
        categoryContext={categoryContext || undefined}
      />
    );
  };
};

// Export context for advanced usage
export { CategoryContext };