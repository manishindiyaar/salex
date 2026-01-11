/**
 * Core Category Types - Index
 * 
 * Centralized export for all category system types.
 * This provides a single import point for all category-related types.
 */

// Core category types
export * from './CategoryTypes';
export * from './TemplateTypes';

// Re-export commonly used types for convenience
export type {
  CategoryContextValue,
  CategoryProviderProps,
  NicheTemplate,
  TerminologyConfig,
  TerminologyEntry,
  ModuleConfig,
  ServiceTemplate,
  WorkflowTemplate,
  SmartTextProps,
  SmartButtonProps,
  ConditionalFeatureProps,
  ModuleGateProps,
  ValidationResult,
  CacheManager,
} from './CategoryTypes';

export type {
  TemplateEngine,
  TemplateLoader,
  CategoryFactory,
  CategoryRegistry,
  OnboardingConfig,
  UIConfig,
  ProcessedTemplate,
} from './TemplateTypes';