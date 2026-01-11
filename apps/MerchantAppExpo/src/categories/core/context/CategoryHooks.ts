/**
 * Category Hooks
 * 
 * Custom React hooks for accessing category-specific functionality.
 * Provides convenient access to terminology, modules, and other category features
 * with built-in caching and performance optimizations.
 */

import React, { useMemo, useCallback, useContext } from 'react';
import { BusinessCategory } from '../../../types/business';
import {
  TerminologyConfig,
  TerminologyEntry,
  ModuleConfig,
  ServiceTemplate,
  WorkflowConfig,
} from '../types';
import { CategoryContext } from './CategoryContext';

// ============================================
// TERMINOLOGY HOOKS
// ============================================

/**
 * Hook for accessing terminology with caching and context support
 */
export const useTerminology = () => {
  // Use optional context - don't throw if not available
  const context = React.useContext(CategoryContext);
  
  // If no context, return safe defaults
  if (!context) {
    return {
      terminology: null,
      error: null,
      getTerm: (key: string) => key,
      getPluralTerm: (key: string) => `${key}s`,
      getTermWithContext: (key: string, _context?: string) => key,
      hasTerminology: false,
      getVariation: (key: string, _variation: string) => key,
      getAllTerms: () => ({}),
    };
  }

  const { terminology, getTerm, error } = context;

  // Memoized terminology functions
  const terminologyHelpers = useMemo(() => {
    if (!terminology) {
      return {
        getTerm: (key: string) => key,
        getPluralTerm: (key: string) => `${key}s`,
        getTermWithContext: (key: string, context?: string) => key,
        hasTerminology: false,
        getVariation: (key: string, variation: string) => key,
        getAllTerms: () => ({}),
      };
    }

    return {
      /**
       * Get singular form of a term
       */
      getTerm: (key: string, context?: string): string => {
        return getTerm(key, context);
      },

      /**
       * Get plural form of a term
       */
      getPluralTerm: (key: string, context?: string): string => {
        const termEntry = terminology[key as keyof TerminologyConfig];
        if (termEntry && typeof termEntry === 'object' && 'plural' in termEntry) {
          return (termEntry as TerminologyEntry).plural;
        }
        return `${getTerm(key, context)}s`;
      },

      /**
       * Get term with specific context
       */
      getTermWithContext: (key: string, context?: string): string => {
        return getTerm(key, context);
      },

      /**
       * Check if terminology is available
       */
      hasTerminology: true,

      /**
       * Get a specific variation of a term
       */
      getVariation: (key: string, variation: string): string => {
        const termEntry = terminology[key as keyof TerminologyConfig];
        if (termEntry && typeof termEntry === 'object' && 'variations' in termEntry) {
          return (termEntry as TerminologyEntry).variations[variation] || getTerm(key);
        }
        return getTerm(key);
      },

      /**
       * Get all available terms
       */
      getAllTerms: (): Record<string, TerminologyEntry> => {
        const terms: Record<string, TerminologyEntry> = {};
        Object.entries(terminology).forEach(([key, value]) => {
          if (typeof value === 'object' && value && 'singular' in value) {
            terms[key] = value as TerminologyEntry;
          }
        });
        return terms;
      },
    };
  }, [terminology, getTerm]);

  return {
    terminology,
    error,
    ...terminologyHelpers,
  };
};

/**
 * Hook for smart text formatting with terminology
 */
export const useSmartText = () => {
  const { getTerm } = useTerminology();

  return useCallback((
    key: string,
    options: {
      context?: string;
      plural?: boolean;
      count?: number;
      transform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
      fallback?: string;
    } = {}
  ): string => {
    const {
      context,
      plural = false,
      count,
      transform = 'none',
      fallback = key,
    } = options;

    let text: string;

    // Determine if we need plural based on count
    const needsPlural = plural || (count !== undefined && count !== 1);

    if (needsPlural) {
      const termEntry = getTerm(key, context);
      // Simple pluralization - in a real app, you'd use a proper pluralization library
      text = termEntry.endsWith('s') ? termEntry : `${termEntry}s`;
    } else {
      text = getTerm(key, context);
    }

    // Apply text transformations
    switch (transform) {
      case 'uppercase':
        return text.toUpperCase();
      case 'lowercase':
        return text.toLowerCase();
      case 'capitalize':
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
      default:
        return text;
    }
  }, [getTerm]);
};

// ============================================
// MODULE HOOKS
// ============================================

/**
 * Hook for accessing module configuration and status
 */
export const useModules = () => {
  // Use optional context - don't throw if not available
  const context = useContext(CategoryContext);
  
  // If no context, return safe defaults
  if (!context) {
    return {
      modules: [],
      isModuleEnabled: () => false,
      error: null,
      getAllModules: () => [],
      getEnabledModules: () => [],
      getDisabledModules: () => [],
      getModule: () => null,
      hasModule: () => false,
      getModulesByCategory: () => [],
      getModuleDependencies: () => [],
      areDependenciesSatisfied: () => true,
      getModuleConflicts: () => [],
      hasConflicts: () => false,
    };
  }

  const { modules, isModuleEnabled, error } = context;

  // Memoized module helpers
  const moduleHelpers = useMemo(() => ({
    /**
     * Get all available modules
     */
    getAllModules: (): ModuleConfig[] => modules,

    /**
     * Get enabled modules only
     */
    getEnabledModules: (): ModuleConfig[] => {
      return modules.filter(module => isModuleEnabled(module.code));
    },

    /**
     * Get disabled modules
     */
    getDisabledModules: (): ModuleConfig[] => {
      return modules.filter(module => !isModuleEnabled(module.code));
    },

    /**
     * Get module by code
     */
    getModule: (code: string): ModuleConfig | null => {
      return modules.find(module => module.code === code) || null;
    },

    /**
     * Check if module exists
     */
    hasModule: (code: string): boolean => {
      return modules.some(module => module.code === code);
    },

    /**
     * Get modules by category
     */
    getModulesByCategory: (category: string): ModuleConfig[] => {
      return modules.filter(module => module.category === category);
    },

    /**
     * Get module dependencies
     */
    getModuleDependencies: (code: string): string[] => {
      const module = modules.find(m => m.code === code);
      return module?.dependencies || [];
    },

    /**
     * Check if module dependencies are satisfied
     */
    areDependenciesSatisfied: (code: string): boolean => {
      const module = modules.find(m => m.code === code);
      if (!module || !module.dependencies.length) return true;

      return module.dependencies.every(dep => isModuleEnabled(dep));
    },

    /**
     * Get module conflicts
     */
    getModuleConflicts: (code: string): string[] => {
      const module = modules.find(m => m.code === code);
      return module?.incompatibleWith || [];
    },

    /**
     * Check if module has conflicts with enabled modules
     */
    hasConflicts: (code: string): boolean => {
      const module = modules.find(m => m.code === code);
      if (!module || !module.incompatibleWith.length) return false;

      return module.incompatibleWith.some(conflict => isModuleEnabled(conflict));
    },
  }), [modules, isModuleEnabled]);

  return {
    modules,
    isModuleEnabled,
    error,
    ...moduleHelpers,
  };
};

/**
 * Hook for conditional feature rendering based on modules
 */
export const useFeatureGate = () => {
  const { isModuleEnabled } = useModules();

  return useCallback((
    requiredModules: string | string[],
    operator: 'AND' | 'OR' = 'AND'
  ): boolean => {
    // If no context, return false (feature not available)
    if (!isModuleEnabled) return false;
    
    const moduleArray = Array.isArray(requiredModules) ? requiredModules : [requiredModules];

    if (operator === 'OR') {
      return moduleArray.some(module => isModuleEnabled(module));
    } else {
      return moduleArray.every(module => isModuleEnabled(module));
    }
  }, [isModuleEnabled]);
};

// ============================================
// CATEGORY HOOKS
// ============================================

/**
 * Hook for accessing current category information
 */
export const useCategory = () => {
  // Use optional context - don't throw if not available
  const context = useContext(CategoryContext);
  
  // If no context, return safe defaults
  if (!context) {
    return {
      category: BusinessCategory.SALON,
      template: null,
      updateCategory: async () => {},
      refreshTemplate: async () => {},
      isLoading: false,
      error: null,
      getCategoryInfo: () => null,
      isCategory: () => false,
      isCategoryOneOf: () => false,
      getCategoryConfig: () => null,
      supportsFeature: () => false,
    };
  }

  const {
    category,
    template,
    updateCategory,
    refreshTemplate,
    isLoading,
    error,
  } = context;

  // Memoized category helpers
  const categoryHelpers = useMemo(() => ({
    /**
     * Get category display information
     */
    getCategoryInfo: () => {
      if (!template) return null;
      return {
        code: category,
        displayName: template.displayName,
        description: template.description,
        icon: template.icon,
      };
    },

    /**
     * Check if current category matches
     */
    isCategory: (targetCategory: BusinessCategory): boolean => {
      return category === targetCategory;
    },

    /**
     * Check if category is one of multiple options
     */
    isCategoryOneOf: (categories: BusinessCategory[]): boolean => {
      return categories.includes(category);
    },

    /**
     * Get category-specific configuration
     */
    getCategoryConfig: () => template,

    /**
     * Check if category supports a feature
     */
    supportsFeature: (featureCode: string): boolean => {
      if (!template) return false;
      // This would check template features in a real implementation
      return true;
    },
  }), [category, template]);

  return {
    category,
    template,
    updateCategory,
    refreshTemplate,
    isLoading,
    error,
    ...categoryHelpers,
  };
};

// ============================================
// SERVICE HOOKS
// ============================================

/**
 * Hook for accessing category-specific services
 */
export const useServices = () => {
  // Use optional context - don't throw if not available
  const context = useContext(CategoryContext);
  const template = context?.template;

  // Memoized service helpers
  const serviceHelpers = useMemo(() => {
    const services = template?.services || [];

    return {
      /**
       * Get all services for current category
       */
      getAllServices: (): ServiceTemplate[] => services,

      /**
       * Get service by name
       */
      getService: (name: string): ServiceTemplate | null => {
        return services.find(service => service.name === name) || null;
      },

      /**
       * Get services by category
       */
      getServicesByCategory: (category: string): ServiceTemplate[] => {
        return services.filter(service => service.category === category);
      },

      /**
       * Get default services for onboarding
       */
      getDefaultServices: (): ServiceTemplate[] => {
        return services.filter(service => service.basePrice > 0);
      },

      /**
       * Calculate service price with modifiers
       */
      calculateServicePrice: (serviceName: string, modifiers: Record<string, any> = {}): number => {
        const service = services.find(s => s.name === serviceName);
        if (!service) return 0;

        let price = service.basePrice;
        
        // Apply price variations based on modifiers
        service.priceVariations?.forEach(variation => {
          // Simple modifier application - in real app, this would be more sophisticated
          if (variation.type === 'percentage') {
            price *= (1 + variation.modifier / 100);
          } else if (variation.type === 'fixed') {
            price += variation.modifier;
          }
        });

        return Math.round(price * 100) / 100; // Round to 2 decimal places
      },
    };
  }, [template]);

  return serviceHelpers;
};

// ============================================
// WORKFLOW HOOKS
// ============================================

/**
 * Hook for accessing category-specific workflows
 */
export const useWorkflows = () => {
  // Use optional context - don't throw if not available
  const context = useContext(CategoryContext);
  const template = context?.template;
  const getWorkflow = context?.getWorkflow || (() => null);

  // Memoized workflow helpers
  const workflowHelpers = useMemo(() => {
    const workflows = template?.workflows || [];

    return {
      /**
       * Get all workflows for current category
       */
      getAllWorkflows: (): WorkflowConfig[] => {
        return workflows.map(workflow => ({
          ...workflow,
          executionHistory: [],
          successRate: 1.0,
        }));
      },

      /**
       * Get workflow by name or ID
       */
      getWorkflow: (identifier: string): WorkflowConfig | null => {
        return getWorkflow(identifier);
      },

      /**
       * Get active workflows
       */
      getActiveWorkflows: (): WorkflowConfig[] => {
        return workflows
          .filter(workflow => workflow.isActive)
          .map(workflow => ({
            ...workflow,
            executionHistory: [],
            successRate: 1.0,
          }));
      },

      /**
       * Get workflows by trigger type
       */
      getWorkflowsByTrigger: (triggerType: string): WorkflowConfig[] => {
        return workflows
          .filter(workflow => 
            workflow.triggers.some(trigger => trigger.type === triggerType)
          )
          .map(workflow => ({
            ...workflow,
            executionHistory: [],
            successRate: 1.0,
          }));
      },

      /**
       * Check if workflow should execute for given context
       */
      shouldExecuteWorkflow: (workflowId: string, context: Record<string, any>): boolean => {
        const workflow = workflows.find(w => w.id === workflowId);
        if (!workflow || !workflow.isActive) return false;

        // Check conditions - simplified implementation
        return workflow.conditions.every(condition => {
          const value = context[condition.field];
          switch (condition.operator) {
            case 'equals':
              return value === condition.value;
            case 'not_equals':
              return value !== condition.value;
            case 'greater_than':
              return value > condition.value;
            case 'less_than':
              return value < condition.value;
            case 'contains':
              return Array.isArray(value) ? value.includes(condition.value) : 
                     typeof value === 'string' ? value.includes(condition.value) : false;
            default:
              return true;
          }
        });
      },
    };
  }, [template, getWorkflow]);

  return workflowHelpers;
};

// ============================================
// PERFORMANCE HOOKS
// ============================================

/**
 * Hook for caching category-related computations
 */
export const useCategoryCache = <T>(
  key: string,
  computeFn: () => T,
  dependencies: any[]
): T => {
  return useMemo(computeFn, [key, ...dependencies]);
};

/**
 * Hook for debounced category operations
 */
export const useDebouncedCategoryOperation = <T extends any[]>(
  operation: (...args: T) => void,
  delay: number = 300
) => {
  // Use optional context - don't throw if not available
  const context = useContext(CategoryContext);
  const isLoading = context?.isLoading || false;

  return useCallback(
    (...args: T) => {
      if (isLoading) return;

      const timeoutId = setTimeout(() => {
        operation(...args);
      }, delay);

      return () => clearTimeout(timeoutId);
    },
    [operation, delay, isLoading]
  );
};