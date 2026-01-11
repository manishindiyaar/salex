/**
 * ConditionalFeature Component
 * 
 * A component that conditionally renders its children based on enabled modules
 * and category-specific feature flags. Provides graceful fallbacks and supports
 * complex module dependency logic.
 */

import React, { useMemo } from 'react';
import { View, ViewProps } from 'react-native';
import { ConditionalFeatureProps, ModuleGateProps } from '../types';
import { useModules, useFeatureGate, useHasCategoryContext } from '../context';
import { SmartText } from './SmartText';

/**
 * ConditionalFeature Component
 * 
 * Renders children only if all required modules are enabled.
 * Supports AND/OR logic for module requirements.
 */
export const ConditionalFeature: React.FC<ConditionalFeatureProps> = ({
  requiredModules,
  fallback = null,
  children,
  operator = 'AND',
}) => {
  const hasCategoryContext = useHasCategoryContext();
  const { isModuleEnabled, areDependenciesSatisfied, hasConflicts } = useModules();

  // Memoize the feature availability check
  const isFeatureAvailable = useMemo(() => {
    // If no category context, allow rendering (graceful degradation)
    if (!hasCategoryContext) {
      console.warn('⚠️ ConditionalFeature used without category context - allowing render');
      return true;
    }

    // Check module requirements
    if (operator === 'OR') {
      // At least one module must be enabled
      const hasAnyModule = requiredModules.some(moduleCode => {
        const enabled = isModuleEnabled(moduleCode);
        const depsOk = areDependenciesSatisfied(moduleCode);
        const noConflicts = !hasConflicts(moduleCode);
        
        return enabled && depsOk && noConflicts;
      });
      
      return hasAnyModule;
    } else {
      // All modules must be enabled (AND logic)
      const hasAllModules = requiredModules.every(moduleCode => {
        const enabled = isModuleEnabled(moduleCode);
        const depsOk = areDependenciesSatisfied(moduleCode);
        const noConflicts = !hasConflicts(moduleCode);
        
        return enabled && depsOk && noConflicts;
      });
      
      return hasAllModules;
    }
  }, [
    hasCategoryContext,
    requiredModules,
    operator,
    isModuleEnabled,
    areDependenciesSatisfied,
    hasConflicts,
  ]);

  // Render children if feature is available, otherwise render fallback
  if (isFeatureAvailable) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

/**
 * ModuleGate Component
 * 
 * A simpler version of ConditionalFeature for single module checks.
 */
export const ModuleGate: React.FC<ModuleGateProps> = ({
  moduleCode,
  fallback = null,
  children,
  requireEnabled = true,
}) => {
  const hasCategoryContext = useHasCategoryContext();
  const { isModuleEnabled, hasModule } = useModules();

  const shouldRender = useMemo(() => {
    // If no category context, allow rendering (graceful degradation)
    if (!hasCategoryContext) {
      return true;
    }

    // Check if module exists
    if (!hasModule(moduleCode)) {
      console.warn(`⚠️ ModuleGate: Module '${moduleCode}' does not exist`);
      return false;
    }

    // Check if module is enabled (if required)
    if (requireEnabled) {
      return isModuleEnabled(moduleCode);
    }

    // If not requiring enabled state, just check existence
    return true;
  }, [hasCategoryContext, moduleCode, requireEnabled, isModuleEnabled, hasModule]);

  if (shouldRender) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

/**
 * FeatureFlag Component
 * 
 * A component for feature flagging based on category-specific configurations.
 */
export const FeatureFlag: React.FC<{
  flag: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({
  flag,
  fallback = null,
  children,
}) => {
  const hasCategoryContext = useHasCategoryContext();
  // In a real implementation, this would check feature flags from the template
  // For now, we'll use a simple check
  
  const isEnabled = useMemo(() => {
    if (!hasCategoryContext) {
      return true; // Graceful degradation
    }

    // This would check against template feature flags in a real implementation
    // For now, we'll assume all flags are enabled
    return true;
  }, [hasCategoryContext, flag]);

  if (isEnabled) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

/**
 * CategorySpecificFeature Component
 * 
 * Renders children only for specific business categories.
 */
export const CategorySpecificFeature: React.FC<{
  categories: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({
  categories,
  fallback = null,
  children,
}) => {
  const hasCategoryContext = useHasCategoryContext();
  // We'll get category from the category context instead of modules
  // For now, we'll use a placeholder implementation

  const shouldRender = useMemo(() => {
    if (!hasCategoryContext) {
      return true; // Graceful degradation
    }

    // TODO: Get actual category from category context
    // For now, we'll allow all categories to render
    return true;
  }, [hasCategoryContext, categories]);

  if (shouldRender) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

/**
 * AdvancedFeatureGate Component
 * 
 * A more sophisticated feature gate that supports complex conditions.
 */
export const AdvancedFeatureGate: React.FC<{
  conditions: {
    modules?: {
      required?: string[];
      optional?: string[];
      forbidden?: string[];
      operator?: 'AND' | 'OR';
    };
    categories?: string[];
    features?: string[];
    customCheck?: () => boolean;
  };
  fallback?: React.ReactNode;
  children: React.ReactNode;
  debug?: boolean;
}> = ({
  conditions,
  fallback = null,
  children,
  debug = false,
}) => {
  const hasCategoryContext = useHasCategoryContext();
  const { isModuleEnabled, hasModule } = useModules();
  const featureGate = useFeatureGate();

  const shouldRender = useMemo(() => {
    if (!hasCategoryContext) {
      if (debug) console.log('AdvancedFeatureGate: No category context, allowing render');
      return true;
    }

    // Check module conditions
    if (conditions.modules) {
      const { required = [], optional = [], forbidden = [], operator = 'AND' } = conditions.modules;

      // Check required modules
      if (required.length > 0) {
        const hasRequired = featureGate(required, operator);
        if (!hasRequired) {
          if (debug) console.log('AdvancedFeatureGate: Required modules not satisfied', required);
          return false;
        }
      }

      // Check forbidden modules (none should be enabled)
      if (forbidden.length > 0) {
        const hasForbidden = forbidden.some(moduleCode => isModuleEnabled(moduleCode));
        if (hasForbidden) {
          if (debug) console.log('AdvancedFeatureGate: Forbidden modules are enabled', forbidden);
          return false;
        }
      }

      // Optional modules don't affect the result, they're just nice to have
    }

    // Check category conditions
    if (conditions.categories) {
      // This would check current category in a real implementation
      // For now, we'll assume it passes
    }

    // Check feature flags
    if (conditions.features) {
      // This would check feature flags in a real implementation
      // For now, we'll assume they pass
    }

    // Check custom condition
    if (conditions.customCheck) {
      try {
        const customResult = conditions.customCheck();
        if (!customResult) {
          if (debug) console.log('AdvancedFeatureGate: Custom check failed');
          return false;
        }
      } catch (error) {
        console.error('AdvancedFeatureGate: Custom check threw error:', error);
        return false;
      }
    }

    if (debug) console.log('AdvancedFeatureGate: All conditions passed');
    return true;
  }, [
    hasCategoryContext,
    conditions,
    isModuleEnabled,
    featureGate,
    debug,
  ]);

  if (shouldRender) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

/**
 * FeaturePlaceholder Component
 * 
 * A placeholder component that shows when a feature is not available.
 */
export const FeaturePlaceholder: React.FC<{
  title?: string;
  message?: string;
  style?: ViewProps['style'];
}> = ({
  title = 'Feature Not Available',
  message = 'This feature is not enabled for your business category.',
  style,
}) => {
  return (
    <View style={[placeholderStyle, style]}>
      <SmartText
        termKey="feature_unavailable_title"
        fallback={title}
        style={placeholderTitleStyle}
      />
      <SmartText
        termKey="feature_unavailable_message"
        fallback={message}
        style={placeholderMessageStyle}
      />
    </View>
  );
};

/**
 * Hook for checking feature availability
 */
export const useFeatureAvailability = () => {
  const hasCategoryContext = useHasCategoryContext();
  const { isModuleEnabled, hasModule, areDependenciesSatisfied, hasConflicts } = useModules();
  const featureGate = useFeatureGate();

  return useMemo(() => ({
    /**
     * Check if a feature is available based on module requirements
     */
    isFeatureAvailable: (
      requiredModules: string | string[],
      operator: 'AND' | 'OR' = 'AND'
    ): boolean => {
      if (!hasCategoryContext) return true;
      return featureGate(requiredModules, operator);
    },

    /**
     * Check if a single module is available and properly configured
     */
    isModuleAvailable: (moduleCode: string): boolean => {
      if (!hasCategoryContext) return true;
      
      return (
        hasModule(moduleCode) &&
        isModuleEnabled(moduleCode) &&
        areDependenciesSatisfied(moduleCode) &&
        !hasConflicts(moduleCode)
      );
    },

    /**
     * Get unavailable modules from a list
     */
    getUnavailableModules: (moduleList: string[]): string[] => {
      if (!hasCategoryContext) return [];
      
      return moduleList.filter(moduleCode => !isModuleEnabled(moduleCode));
    },

    /**
     * Get module status information
     */
    getModuleStatus: (moduleCode: string) => {
      if (!hasCategoryContext) {
        return { exists: true, enabled: true, available: true, issues: [] };
      }

      const exists = hasModule(moduleCode);
      const enabled = isModuleEnabled(moduleCode);
      const depsOk = areDependenciesSatisfied(moduleCode);
      const noConflicts = !hasConflicts(moduleCode);
      
      const issues: string[] = [];
      if (!exists) issues.push('Module does not exist');
      if (!enabled) issues.push('Module is not enabled');
      if (!depsOk) issues.push('Module dependencies not satisfied');
      if (!noConflicts) issues.push('Module has conflicts with enabled modules');

      return {
        exists,
        enabled,
        available: exists && enabled && depsOk && noConflicts,
        issues,
      };
    },

    /**
     * Check if category context is available
     */
    hasContext: hasCategoryContext,
  }), [
    hasCategoryContext,
    isModuleEnabled,
    hasModule,
    areDependenciesSatisfied,
    hasConflicts,
    featureGate,
  ]);
};

// Styles
const placeholderStyle = {
  padding: 20,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  backgroundColor: '#F5F5F5',
  borderRadius: 8,
  margin: 10,
};

const placeholderTitleStyle = {
  fontSize: 16,
  fontWeight: '600' as const,
  color: '#666',
  marginBottom: 8,
  textAlign: 'center' as const,
};

const placeholderMessageStyle = {
  fontSize: 14,
  color: '#888',
  textAlign: 'center' as const,
  lineHeight: 20,
};

// Export default as ConditionalFeature
export default ConditionalFeature;