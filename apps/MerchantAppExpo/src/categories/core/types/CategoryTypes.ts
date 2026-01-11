/**
 * Core Category System Types
 * 
 * Defines the fundamental types and interfaces for the category-based dynamic UI system.
 * These types are shared across all business categories and provide the foundation
 * for smart components, template processing, and category management.
 */

import { BusinessCategory } from '../../../types/business';

// ============================================
// REGISTRY TYPES
// ============================================

export interface CategoryRegistry {
  register(category: BusinessCategory, config: CategoryRegistration): void;
  unregister(category: BusinessCategory): void;
  get(category: BusinessCategory): CategoryRegistration | null;
  getAll(): CategoryRegistration[];
  exists(category: BusinessCategory): boolean;
  getMetadata(category: BusinessCategory): CategoryMetadata | null;
  updateMetadata(category: BusinessCategory, updates: Partial<CategoryMetadata>): void;
  onRegistration(callback: (category: BusinessCategory) => void): void;
  onUnregistration(callback: (category: BusinessCategory) => void): void;
  getActiveCategories(): BusinessCategory[];
  getHealthStatus(): Record<BusinessCategory, 'healthy' | 'warning' | 'error'>;
  recordUsage(category: BusinessCategory, loadTime?: number): void;
  performHealthCheck(category: BusinessCategory): Promise<'healthy' | 'warning' | 'error'>;
  getStatistics(): {
    totalCategories: number;
    activeCategories: number;
    totalUsage: number;
    averageLoadTime: number;
    healthyCategories: number;
  };
  clear(): void;
}

export interface CategoryRegistration {
  category: BusinessCategory;
  config: CategoryConfig;
  loader: () => Promise<NicheTemplate>;
  validator: (template: NicheTemplate) => ValidationResult;
  registeredAt: Date;
  version: string;
  author: string;
  dependencies: string[];
  conflicts: string[];
}

export interface CategoryMetadata {
  category: BusinessCategory;
  displayName: string;
  description: string;
  icon: string;
  usageCount: number;
  averageLoadTime: number;
  isActive: boolean;
  healthStatus: 'healthy' | 'warning' | 'error';
  lastHealthCheck: Date;
  lastUsed?: Date;
}

export interface CategoryConfig {
  category: BusinessCategory;
  displayName: string;
  description: string;
  icon: string;
  templatePath: string;
  features: CategoryFeature[];
  validationRules: CategoryValidationRule[];
  customizationOptions: CategoryCustomizationOption[];
}

export interface CategoryFeature {
  name: string;
  enabled: boolean;
  configuration: Record<string, any>;
  dependencies: string[];
}

export interface CategoryValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'custom';
  parameters: Record<string, any>;
  message: string;
}

export interface CategoryCustomizationOption {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect';
  label: string;
  description: string; // Make required to match TemplateTypes
  defaultValue: any;
  options?: Array<{ value: any; label: string }>;
}

export interface CategoryFactory {
  createCategoryInstance(category: BusinessCategory): Promise<CategoryInstance>;
  getCategoryInstance(category: BusinessCategory): CategoryInstance | null;
  registerCategory(category: BusinessCategory, config: CategoryConfig): void;
  unregisterCategory(category: BusinessCategory): void;
  getRegisteredCategories(): BusinessCategory[];
  validateCategoryConfig(config: CategoryConfig): ValidationResult;
  refreshCategoryInstance(category: BusinessCategory): Promise<CategoryInstance>;
  getInstanceStatistics(): {
    totalInstances: number;
    loadedCategories: BusinessCategory[];
    memoryUsage: number;
  };
  clear(): void;
}

export interface TemplateLoader {
  loadTemplate(category: BusinessCategory): Promise<NicheTemplate>;
  loadAllTemplates(): Promise<NicheTemplate[]>;
  reloadTemplate(category: BusinessCategory): Promise<NicheTemplate>;
  validateTemplateStructure(template: any): ValidationResult;
  validateTemplateContent(template: NicheTemplate): ValidationResult;
  preloadTemplates(categories: BusinessCategory[]): Promise<void>;
  getLoadingStatus(category: BusinessCategory): TemplateLoadingStatus;
  getCacheStatistics(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  };
  clearCache(): void;
}

export interface TemplateLoadingStatus {
  category: BusinessCategory;
  status: 'not_loaded' | 'loading' | 'loaded' | 'error';
  lastLoaded?: Date;
  error?: string;
  retryCount: number;
}

export interface CategoryInstance {
  readonly category: BusinessCategory;
  readonly template: NicheTemplate;
  readonly config: CategoryConfig;
  readonly isInitialized: boolean;
  readonly lastUpdated: Date;
  readonly version: string;
  
  getTerminology(): TerminologyConfig;
  getModules(): ModuleConfig[];
  getServices(): ServiceTemplate[];
  getWorkflows(): WorkflowTemplate[];
}

// ============================================
// CORE CATEGORY TYPES
// ============================================

export interface CategoryContextValue {
  // Current category data
  category: BusinessCategory;
  template: NicheTemplate | null;
  terminology: TerminologyConfig | null;
  modules: ModuleConfig[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Helper functions
  getTerm: (key: string, context?: string) => string;
  isModuleEnabled: (moduleCode: string) => boolean;
  getWorkflow: (workflowType: string) => WorkflowConfig | null;
  
  // State management
  updateCategory: (category: BusinessCategory) => Promise<void>;
  refreshTemplate: () => Promise<void>;
  customizeTerminology: (overrides: Partial<TerminologyConfig>) => void;
}

export interface CategoryProviderProps {
  businessId: string;
  children: React.ReactNode;
  fallbackCategory?: BusinessCategory;
}

// ============================================
// TEMPLATE TYPES
// ============================================

export interface NicheTemplate {
  id: string;
  code: BusinessCategory;
  displayName: string;
  icon: string;
  description: string;
  
  // Core configurations
  terminology: TerminologyConfig;
  modules: ModuleConfig[];
  services: ServiceTemplate[];
  workflows: WorkflowTemplate[];
  
  // Advanced configurations
  analytics: AnalyticsConfig;
  integrations: IntegrationConfig[];
  customizations: CustomizationConfig;
  
  // Metadata
  version: string;
  parentTemplate?: string;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessedTemplate {
  terminology: ProcessedTerminology;
  modules: ProcessedModule[];
  services: ProcessedService[];
  workflows: ProcessedWorkflow[];
  analytics: ProcessedAnalytics;
}

// ============================================
// TERMINOLOGY TYPES
// ============================================

export interface TerminologyConfig {
  // Core entities
  customer: TerminologyEntry;
  staff: TerminologyEntry;
  service: TerminologyEntry;
  appointment: TerminologyEntry;
  resource: TerminologyEntry;
  
  // Actions
  book: TerminologyEntry;
  schedule: TerminologyEntry;
  cancel: TerminologyEntry;
  complete: TerminologyEntry;
  
  // Contexts
  contexts: Record<string, TerminologyEntry>;
  
  // Multi-language support
  languages: Record<string, Partial<TerminologyConfig>>;
}

export interface TerminologyEntry {
  singular: string;
  plural: string;
  variations: Record<string, string>;
  description?: string;
}

export interface ProcessedTerminology extends TerminologyConfig {
  // Processed fields for performance
  lookupCache: Map<string, string>;
  contextCache: Map<string, TerminologyEntry>;
}

// ============================================
// MODULE TYPES
// ============================================

export interface ModuleConfig {
  code: string;
  name: string;
  description: string;
  category: ModuleCategory;
  
  // Enablement rules
  enabledByDefault: boolean;
  requiredForCategories: BusinessCategory[];
  incompatibleWith: string[];
  dependencies: string[];
  
  // Configuration
  settings: ModuleSettings;
  permissions: Permission[];
  
  // UI Configuration
  uiConfig: ModuleUIConfig;
}

export interface ProcessedModule extends ModuleConfig {
  isEnabled: boolean;
  dependenciesResolved: boolean;
  conflictsResolved: boolean;
}

export interface ModuleUIConfig {
  menuItems: MenuItem[];
  dashboardWidgets: Widget[];
  formFields: FormField[];
  customComponents: ComponentConfig[];
}

export type ModuleCategory = 
  | 'booking'
  | 'management'
  | 'analytics'
  | 'integration'
  | 'workflow'
  | 'ui';

export interface ModuleSettings {
  [key: string]: any;
}

export interface Permission {
  action: string;
  resource: string;
  conditions?: Record<string, any>;
}

// ============================================
// SERVICE TYPES
// ============================================

export interface ServiceTemplate {
  name: string;
  description: string;
  category: ServiceCategory;
  
  // Pricing
  basePrice: number;
  currency: string;
  priceVariations: PriceVariation[];
  
  // Timing
  duration: number;
  bufferTime: number;
  
  // Requirements
  requiredResources: ResourceRequirement[];
  requiredStaff: StaffRequirement[];
  
  // Category-specific configurations
  categorySpecific: CategorySpecificServiceConfig;
}

export interface ProcessedService extends ServiceTemplate {
  finalPrice: number;
  availableSlots: TimeSlot[];
  resourceAvailability: ResourceAvailability[];
}

export interface CategorySpecificServiceConfig {
  clinic?: ClinicServiceConfig;
  spa?: SpaServiceConfig;
  salon?: SalonServiceConfig;
  beautyParlor?: BeautyParlorServiceConfig;
  barberShop?: BarberShopServiceConfig;
  fitness?: FitnessServiceConfig;
}

export interface ClinicServiceConfig {
  requiresConsultation: boolean;
  followUpRequired: boolean;
  prescriptionEnabled: boolean;
  insuranceCoverage?: InsuranceCoverage[];
}

export interface SpaServiceConfig {
  wellnessCategory: 'relaxation' | 'therapeutic' | 'beauty' | 'detox';
  packageCompatible: boolean;
  membershipDiscount?: number;
  seasonalAvailability?: SeasonalConfig;
}

export interface SalonServiceConfig {
  hairType?: 'all' | 'curly' | 'straight' | 'wavy';
  colorCompatible: boolean;
  stylistLevel?: 'junior' | 'senior' | 'master';
}

export interface BeautyParlorServiceConfig {
  skinType?: 'all' | 'oily' | 'dry' | 'combination' | 'sensitive';
  bridalPackage: boolean;
  eventService: boolean;
}

export interface BarberShopServiceConfig {
  gender: 'male' | 'female' | 'all';
  quickService: boolean;
  walkInFriendly: boolean;
}

export interface FitnessServiceConfig {
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced' | 'all';
  equipmentRequired: string[];
  groupSize?: number;
}

// ============================================
// WORKFLOW TYPES
// ============================================

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: BusinessCategory[];
  
  // Trigger configuration
  triggers: WorkflowTrigger[];
  conditions: WorkflowCondition[];
  
  // Actions
  actions: WorkflowAction[];
  
  // Configuration
  isActive: boolean;
  priority: number;
}

export interface WorkflowConfig extends WorkflowTemplate {
  // Runtime configuration
  executionHistory: WorkflowExecution[];
  lastExecuted?: Date;
  successRate: number;
}

export interface ProcessedWorkflow extends WorkflowConfig {
  isEligible: boolean;
  nextExecution?: Date;
  estimatedDuration: number;
}

export interface WorkflowTrigger {
  type: 'service_complete' | 'booking_created' | 'payment_received' | 'time_based';
  conditions: Record<string, any>;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface WorkflowAction {
  type: 'send_message' | 'create_booking' | 'update_record' | 'trigger_integration';
  parameters: Record<string, any>;
  delay?: number;
}

export interface WorkflowExecution {
  id: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface AnalyticsConfig {
  metrics: AnalyticsMetric[];
  dashboards: AnalyticsDashboard[];
  reports: AnalyticsReport[];
}

export interface ProcessedAnalytics extends AnalyticsConfig {
  computedMetrics: ComputedMetric[];
  insights: AnalyticsInsight[];
}

export interface AnalyticsMetric {
  id: string;
  name: string;
  description: string;
  category: BusinessCategory[];
  
  // Calculation
  formula: string;
  aggregation: 'sum' | 'average' | 'count' | 'percentage';
  timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface ComputedMetric extends AnalyticsMetric {
  currentValue: number;
  previousValue: number;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
}

export interface AnalyticsDashboard {
  id: string;
  name: string;
  category: BusinessCategory[];
  widgets: AnalyticsWidget[];
}

export interface AnalyticsWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'gauge';
  title: string;
  metricIds: string[];
  configuration: Record<string, any>;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  description: string;
  category: BusinessCategory[];
  schedule: ReportSchedule;
}

export interface AnalyticsInsight {
  id: string;
  title: string;
  description: string;
  type: 'opportunity' | 'warning' | 'achievement';
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
}

// ============================================
// INTEGRATION TYPES
// ============================================

export interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  category: BusinessCategory[];
  
  // Configuration
  provider: string;
  apiVersion: string;
  endpoints: IntegrationEndpoint[];
  
  // Authentication
  authType: 'api_key' | 'oauth' | 'basic' | 'custom';
  credentials: Record<string, any>;
  
  // Data mapping
  dataMapping: DataMapping[];
  
  // Status
  isActive: boolean;
  lastSync?: Date;
}

export interface IntegrationEndpoint {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  parameters: Record<string, any>;
}

export interface DataMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  required: boolean;
}

// ============================================
// CUSTOMIZATION TYPES
// ============================================

export interface CustomizationConfig {
  terminology: Partial<TerminologyConfig>;
  modules: ModuleOverride[];
  services: ServiceOverride[];
  workflows: WorkflowOverride[];
  ui: UICustomization;
}

export interface ModuleOverride {
  moduleCode: string;
  isEnabled: boolean;
  settings: Record<string, any>;
}

export interface ServiceOverride {
  serviceId: string;
  modifications: Partial<ServiceTemplate>;
}

export interface WorkflowOverride {
  workflowId: string;
  modifications: Partial<WorkflowTemplate>;
}

export interface UICustomization {
  theme: ThemeOverride;
  layout: LayoutOverride;
  components: ComponentOverride[];
}

// ============================================
// UI COMPONENT TYPES
// ============================================

export interface SmartTextProps {
  termKey: string;
  context?: string;
  fallback?: string;
  transform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  plural?: boolean;
  style?: any; // React Native TextStyle
  children?: React.ReactNode;
}

export interface SmartButtonProps {
  actionType: 'book' | 'schedule' | 'reserve' | 'create' | 'update' | 'delete' | 'cancel' | 'complete';
  entityType: 'appointment' | 'service' | 'staff' | 'resource' | 'customer';
  onPress: () => void;
  style?: any; // React Native ViewStyle
  textStyle?: any; // React Native TextStyle
  disabled?: boolean;
  loading?: boolean;
}

export interface ConditionalFeatureProps {
  requiredModules: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
  operator?: 'AND' | 'OR';
}

export interface ModuleGateProps {
  moduleCode: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  requireEnabled?: boolean;
}

// ============================================
// UTILITY TYPES
// ============================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  expiresAt: Date;
  version: string;
}

export interface CacheManager {
  get<T>(key: string): CacheEntry<T> | null;
  set<T>(key: string, data: T, ttl?: number): void;
  invalidate(key: string): void;
  clear(): void;
  size(): number;
}

// ============================================
// HELPER TYPES
// ============================================

export type ServiceCategory = string;
export type TimeSlot = {
  start: Date;
  end: Date;
  available: boolean;
};

export type ResourceAvailability = {
  resourceId: string;
  available: boolean;
  nextAvailable?: Date;
};

export type PriceVariation = {
  condition: string;
  modifier: number;
  type: 'percentage' | 'fixed';
};

export interface ResourceRequirement {
  type: string;
  quantity: number;
  optional: boolean;
  resourceId?: string;
  specifications?: Record<string, any>;
}

export interface StaffRequirement {
  role: string;
  skills: string[];
  experience?: string;
  optional: boolean;
  staffId?: string;
  certifications?: string[];
}

export type InsuranceCoverage = {
  provider: string;
  coverage: number;
  conditions: string[];
};

export type SeasonalConfig = {
  seasons: string[];
  availability: boolean;
  priceModifier?: number;
};

export type MenuItem = {
  id: string;
  label: string;
  icon: string;
  route: string;
  permissions: string[];
};

export type Widget = {
  id: string;
  type: string;
  title: string;
  configuration: Record<string, any>;
};

export type FormField = {
  name: string;
  type: string;
  label: string;
  required: boolean;
  validation: Record<string, any>;
};

export type ComponentConfig = {
  name: string;
  props: Record<string, any>;
  conditions: Record<string, any>;
};

export type ReportSchedule = {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  recipients: string[];
};

export type ThemeOverride = {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  spacing: Record<string, number>;
};

export type LayoutOverride = {
  navigation: Record<string, any>;
  screens: Record<string, any>;
};

export type ComponentOverride = {
  componentName: string;
  overrides: Record<string, any>;
};