/**
 * Template System Types
 * 
 * Defines types specifically for template processing, validation, and management.
 * These types support the template engine and category factory systems.
 */

import { BusinessCategory } from '../../../types/business';
import { 
  NicheTemplate, 
  TerminologyConfig, 
  ModuleConfig, 
  ServiceTemplate,
  WorkflowTemplate,
  ValidationResult,
  CategoryConfig,
  CategoryRegistration,
  CategoryMetadata,
  CategoryInstance,
  CategoryFactory as ICategoryFactory,
  CategoryRegistry as ICategoryRegistry,
  CategoryCustomizationOption,
  CategoryValidationRule as ValidationRule,
  ResourceRequirement,
  StaffRequirement
} from './CategoryTypes';

// ============================================
// TEMPLATE ENGINE TYPES
// ============================================

export interface TemplateEngine {
  // Template processing
  processTemplate: (template: NicheTemplate) => Promise<ProcessedTemplate>;
  validateTemplate: (template: NicheTemplate) => ValidationResult;
  mergeTemplates: (base: NicheTemplate, custom: Partial<NicheTemplate>) => NicheTemplate;
  
  // Configuration application
  applyToOnboarding: (template: NicheTemplate) => OnboardingConfig;
  applyToUI: (template: NicheTemplate) => UIConfig;
  applyToWorkflows: (template: NicheTemplate) => WorkflowTemplate[];
  
  // Cache management
  getCachedTemplate: (category: BusinessCategory) => NicheTemplate | null;
  setCachedTemplate: (category: BusinessCategory, template: NicheTemplate) => void;
  invalidateCache: (category?: BusinessCategory) => void;
}

export interface ProcessedTemplate {
  // Core data
  template: NicheTemplate;
  
  // Processed components
  terminology: ProcessedTerminology;
  modules: ProcessedModule[];
  services: ProcessedService[];
  workflows: ProcessedWorkflow[];
  
  // Metadata
  processedAt: Date;
  version: string;
  checksum: string;
}

export interface ProcessedTerminology {
  config: TerminologyConfig;
  lookupMap: Map<string, string>;
  contextMap: Map<string, Map<string, string>>;
  fallbackChain: string[];
}

export interface ProcessedModule {
  config: ModuleConfig;
  isEnabled: boolean;
  dependencies: ProcessedModule[];
  conflicts: string[];
  resolvedSettings: Record<string, any>;
}

export interface ProcessedService {
  template: ServiceTemplate;
  finalConfiguration: ServiceConfiguration;
  availability: ServiceAvailability;
  pricing: ServicePricing;
}

export interface ProcessedWorkflow {
  template: WorkflowTemplate;
  compiledConditions: CompiledCondition[];
  scheduledActions: ScheduledAction[];
  dependencies: string[];
}

// ============================================
// TEMPLATE LOADER TYPES
// ============================================

export interface TemplateLoader {
  // Loading operations
  loadTemplate: (category: BusinessCategory) => Promise<NicheTemplate>;
  loadAllTemplates: () => Promise<NicheTemplate[]>;
  reloadTemplate: (category: BusinessCategory) => Promise<NicheTemplate>;
  
  // Validation
  validateTemplateStructure: (template: any) => ValidationResult;
  validateTemplateContent: (template: NicheTemplate) => ValidationResult;
  
  // Caching
  preloadTemplates: (categories: BusinessCategory[]) => Promise<void>;
  getLoadingStatus: (category: BusinessCategory) => TemplateLoadingStatus;
}

export interface TemplateLoadingStatus {
  category: BusinessCategory;
  status: 'not_loaded' | 'loading' | 'loaded' | 'error';
  lastLoaded?: Date;
  error?: string;
  retryCount: number;
}

// ============================================
// CATEGORY FACTORY TYPES (Re-export from CategoryTypes)
// ============================================

export type { 
  CategoryFactory,
  CategoryInstance,
  CategoryConfig,
  CategoryRegistration,
  CategoryMetadata,
  CategoryRegistry
} from './CategoryTypes';

// ============================================
// TEMPLATE-SPECIFIC FACTORY TYPES
// ============================================

// ============================================
// CATEGORY REGISTRY TYPES (Re-export from CategoryTypes)
// ============================================

// Note: CategoryRegistry is already exported from CategoryTypes, no need to re-export

// ============================================
// TEMPLATE-SPECIFIC REGISTRY TYPES
// ============================================

// ============================================
// ONBOARDING TYPES
// ============================================

export interface OnboardingConfig {
  steps: OnboardingStep[];
  flow: OnboardingFlow;
  validation: OnboardingValidation;
  customization: OnboardingCustomization;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string; // Component name to render
  
  // Configuration
  required: boolean;
  order: number;
  dependencies: string[];
  
  // Category-specific data
  categorySpecific: CategorySpecificOnboarding;
  
  // Validation
  validation: StepValidation;
  
  // Navigation
  canSkip: boolean;
  skipConditions: SkipCondition[];
}

export interface CategorySpecificOnboarding {
  terminology: Record<string, string>;
  fields: OnboardingField[];
  defaultValues: Record<string, any>;
  helpText: Record<string, string>;
}

export interface OnboardingField {
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date' | 'time';
  label: string;
  placeholder?: string;
  required: boolean;
  validation: FieldValidation;
  options?: FieldOption[];
  dependsOn?: string[];
}

export interface FieldOption {
  value: any;
  label: string;
  description?: string;
  icon?: string;
}

export interface FieldValidation {
  rules: ValidationRule[];
  messages: Record<string, string>;
}

export interface StepValidation {
  rules: ValidationRule[];
  async?: boolean;
  dependencies: string[];
}

export interface SkipCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'exists' | 'not_exists';
  value?: any;
}

export interface OnboardingFlow {
  startStep: string;
  endStep: string;
  transitions: FlowTransition[];
  branches: FlowBranch[];
}

export interface FlowTransition {
  from: string;
  to: string;
  condition?: TransitionCondition;
  action?: TransitionAction;
}

export interface FlowBranch {
  condition: BranchCondition;
  steps: string[];
  merge?: string;
}

export interface TransitionCondition {
  field: string;
  operator: string;
  value: any;
}

export interface BranchCondition {
  field: string;
  operator: string;
  value: any;
}

export interface TransitionAction {
  type: 'set_field' | 'call_api' | 'validate' | 'custom';
  parameters: Record<string, any>;
}

export interface OnboardingValidation {
  globalRules: ValidationRule[];
  stepRules: Record<string, ValidationRule[]>;
  crossStepRules: CrossStepValidationRule[];
}

export interface CrossStepValidationRule {
  steps: string[];
  rule: ValidationRule;
  message: string;
}

export interface OnboardingCustomization {
  theme: OnboardingTheme;
  layout: OnboardingLayout;
  behavior: OnboardingBehavior;
}

export interface OnboardingTheme {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  spacing: Record<string, number>;
  animations: Record<string, any>;
}

export interface OnboardingLayout {
  stepLayout: 'vertical' | 'horizontal' | 'wizard' | 'tabs';
  progressIndicator: 'bar' | 'steps' | 'percentage' | 'none';
  navigation: 'buttons' | 'swipe' | 'both';
}

export interface OnboardingBehavior {
  autoSave: boolean;
  autoAdvance: boolean;
  allowBackNavigation: boolean;
  showProgress: boolean;
  exitConfirmation: boolean;
}

// ============================================
// UI CONFIGURATION TYPES
// ============================================

export interface UIConfig {
  theme: UITheme;
  layout: UILayout;
  components: UIComponentConfig[];
  navigation: UINavigation;
  terminology: UITerminology;
}

export interface UITheme {
  name: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSize: Record<string, number>;
  fontWeight: Record<string, string>;
  lineHeight: Record<string, number>;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeBorderRadius {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  round: number;
}

export interface ThemeShadows {
  sm: any; // React Native shadow style
  md: any;
  lg: any;
  xl: any;
}

export interface UILayout {
  screens: Record<string, ScreenLayout>;
  components: Record<string, ComponentLayout>;
  navigation: NavigationLayout;
}

export interface ScreenLayout {
  name: string;
  layout: 'stack' | 'tabs' | 'drawer' | 'modal';
  components: string[];
  configuration: Record<string, any>;
}

export interface ComponentLayout {
  name: string;
  position: 'header' | 'body' | 'footer' | 'sidebar' | 'overlay';
  size: 'small' | 'medium' | 'large' | 'full';
  responsive: boolean;
}

export interface NavigationLayout {
  type: 'stack' | 'tabs' | 'drawer' | 'hybrid';
  structure: NavigationStructure[];
  configuration: NavigationConfiguration;
}

export interface NavigationStructure {
  name: string;
  type: 'screen' | 'stack' | 'tabs' | 'drawer';
  children?: NavigationStructure[];
  configuration: Record<string, any>;
}

export interface NavigationConfiguration {
  headerShown: boolean;
  tabBarShown: boolean;
  gestureEnabled: boolean;
  animationEnabled: boolean;
  customization: Record<string, any>;
}

export interface UIComponentConfig {
  name: string;
  type: string;
  props: Record<string, any>;
  style: Record<string, any>;
  children?: UIComponentConfig[];
  conditions?: ComponentCondition[];
}

export interface ComponentCondition {
  type: 'module' | 'permission' | 'feature' | 'custom';
  parameters: Record<string, any>;
}

export interface UINavigation {
  structure: NavigationItem[];
  configuration: NavigationConfig;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  children?: NavigationItem[];
  
  // Access control
  requiredModules: string[];
  requiredPermissions: string[];
  
  // Customization
  badge?: NavigationBadge;
  customization: Record<string, any>;
}

export interface NavigationBadge {
  text: string;
  color: string;
  condition: string;
}

export interface NavigationConfig {
  defaultRoute: string;
  fallbackRoute: string;
  authenticationRequired: boolean;
  deepLinking: boolean;
}

export interface UITerminology {
  overrides: Record<string, string>;
  contextual: Record<string, Record<string, string>>;
  pluralization: Record<string, PluralRule>;
}

export interface PluralRule {
  singular: string;
  plural: string;
  conditions: PluralCondition[];
}

export interface PluralCondition {
  count: number | 'zero' | 'one' | 'few' | 'many' | 'other';
  form: string;
}

// ============================================
// HELPER TYPES
// ============================================

export interface ServiceConfiguration {
  pricing: PricingConfiguration;
  scheduling: SchedulingConfiguration;
  resources: ResourceConfiguration;
  staff: StaffConfiguration;
}

export interface ServiceAvailability {
  timeSlots: AvailableTimeSlot[];
  resources: ResourceAvailability[];
  staff: StaffAvailability[];
}

export interface ServicePricing {
  basePrice: number;
  modifiers: PriceModifier[];
  finalPrice: number;
  currency: string;
}

export interface PricingConfiguration {
  strategy: 'fixed' | 'dynamic' | 'tiered' | 'custom';
  basePrice: number;
  modifiers: PriceModifier[];
  discounts: DiscountRule[];
}

export interface SchedulingConfiguration {
  duration: number;
  bufferTime: number;
  advanceBooking: AdvanceBookingRule;
  cancellation: CancellationRule;
}

export interface ResourceConfiguration {
  required: ResourceRequirement[];
  optional: ResourceRequirement[];
  alternatives: ResourceAlternative[];
}

export interface StaffConfiguration {
  required: StaffRequirement[];
  preferred: StaffPreference[];
  alternatives: StaffAlternative[];
}

export interface AvailableTimeSlot {
  start: Date;
  end: Date;
  resourceId?: string;
  staffId?: string;
  price?: number;
}

export interface ResourceAvailability {
  resourceId: string;
  available: boolean;
  nextAvailable?: Date;
  restrictions: string[];
}

export interface StaffAvailability {
  staffId: string;
  available: boolean;
  nextAvailable?: Date;
  skills: string[];
}

export interface PriceModifier {
  name: string;
  type: 'percentage' | 'fixed' | 'multiplier';
  value: number;
  condition: string;
  priority: number;
}

export interface DiscountRule {
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  conditions: DiscountCondition[];
  stackable: boolean;
}

export interface DiscountCondition {
  field: string;
  operator: string;
  value: any;
}

export interface AdvanceBookingRule {
  minAdvance: number; // minutes
  maxAdvance: number; // minutes
  restrictions: BookingRestriction[];
}

export interface CancellationRule {
  allowCancellation: boolean;
  minNotice: number; // minutes
  penalty: CancellationPenalty;
}

export interface BookingRestriction {
  type: 'time' | 'date' | 'resource' | 'staff' | 'custom';
  parameters: Record<string, any>;
}

export interface CancellationPenalty {
  type: 'none' | 'percentage' | 'fixed';
  value: number;
  conditions: string[];
}

export interface ResourceAlternative {
  originalId: string;
  alternativeId: string;
  conditions: string[];
  priority: number;
}

export interface StaffPreference {
  staffId: string;
  preference: number; // 1-10 scale
  conditions: string[];
}

export interface StaffAlternative {
  originalId: string;
  alternativeId: string;
  conditions: string[];
  priority: number;
}

export interface CompiledCondition {
  original: string;
  compiled: (context: any) => boolean;
  dependencies: string[];
}

export interface ScheduledAction {
  action: any;
  scheduledFor: Date;
  dependencies: string[];
  retryPolicy: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelay: number;
  maxDelay: number;
}