/**
 * Smart Components - Index
 * 
 * Centralized export for all smart components in the category system.
 * These components automatically adapt based on business category context.
 */

// Smart Text Components
export {
  SmartText,
  SmartTextSpan,
  SmartLabel,
  SmartPlural,
  SmartAction,
  useSmartText,
} from './SmartText';

// Smart Button Components
export {
  SmartButton,
  SmartActionButton,
  SmartBookingButton,
  SmartIconButton,
} from './SmartButton';

// Conditional Feature Components
export {
  ConditionalFeature,
  ModuleGate,
  FeatureFlag,
  CategorySpecificFeature,
  AdvancedFeatureGate,
  FeaturePlaceholder,
  useFeatureAvailability,
} from './ConditionalFeature';

// Re-export types for convenience
export type {
  SmartTextProps,
  SmartButtonProps,
  ConditionalFeatureProps,
  ModuleGateProps,
} from '../types';