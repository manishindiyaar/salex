/**
 * Category Context - Index
 * 
 * Centralized export for all category context components and hooks.
 * Provides a single import point for category context functionality.
 */

// Context and Provider
export {
  CategoryProvider,
  useCategoryContext,
  useHasCategoryContext,
  withCategoryContext,
  CategoryContext,
} from './CategoryContext';

// Category Hooks
export {
  useTerminology,
  useSmartText,
  useModules,
  useFeatureGate,
  useCategory,
  useServices,
  useWorkflows,
  useCategoryCache,
  useDebouncedCategoryOperation,
} from './CategoryHooks';

// Re-export types for convenience
export type {
  CategoryContextValue,
  CategoryProviderProps,
} from '../types';