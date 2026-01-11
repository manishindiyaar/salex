/**
 * Category System Setup
 * 
 * Initializes the category system by registering all available categories
 * with their templates and configurations.
 */

import { BusinessCategory } from '../types/business';
import { CategoryConfig } from './core/types';
import { getSupportedCategories } from './templates';

/**
 * Category configurations for registration
 */
const CATEGORY_CONFIGS: Record<BusinessCategory, CategoryConfig> = {
  [BusinessCategory.SALON]: {
    category: BusinessCategory.SALON,
    displayName: 'Hair Salon',
    description: 'Professional hair styling, coloring, and treatment services',
    icon: '💄',
    templatePath: '/templates/salon.template.ts',
    features: [
      { name: 'hair_services', enabled: true, configuration: {}, dependencies: [] },
      { name: 'color_services', enabled: true, configuration: {}, dependencies: [] },
      { name: 'treatment_services', enabled: true, configuration: {}, dependencies: [] },
    ],
    validationRules: [
      { field: 'service_duration', type: 'required', parameters: {}, message: 'Service duration is required' },
      { field: 'stylist_assignment', type: 'required', parameters: {}, message: 'Stylist assignment is required' },
    ],
    customizationOptions: [],
  },
  
  [BusinessCategory.CLINIC]: {
    category: BusinessCategory.CLINIC,
    displayName: 'Beauty Clinic',
    description: 'Medical aesthetics, skincare, and beauty treatments',
    icon: '🧴',
    templatePath: '/templates/clinic.template.ts',
    features: [
      { name: 'consultation_services', enabled: true, configuration: {}, dependencies: [] },
      { name: 'aesthetic_treatments', enabled: true, configuration: {}, dependencies: [] },
      { name: 'medical_records', enabled: true, configuration: {}, dependencies: [] },
    ],
    validationRules: [
      { field: 'medical_history', type: 'required', parameters: {}, message: 'Medical history is required' },
      { field: 'consent_form', type: 'required', parameters: {}, message: 'Consent form is required' },
    ],
    customizationOptions: [],
  },
  
  [BusinessCategory.SPA]: {
    category: BusinessCategory.SPA,
    displayName: 'Wellness Spa',
    description: 'Holistic wellness, massage therapy, and relaxation services',
    icon: '💅',
    templatePath: '/templates/spa.template.ts',
    features: [
      { name: 'massage_therapy', enabled: true, configuration: {}, dependencies: [] },
      { name: 'wellness_packages', enabled: true, configuration: {}, dependencies: [] },
      { name: 'membership_program', enabled: true, configuration: {}, dependencies: [] },
    ],
    validationRules: [
      { field: 'wellness_goals', type: 'format', parameters: { format: 'array' }, message: 'Wellness goals must be an array' },
      { field: 'pressure_preference', type: 'required', parameters: {}, message: 'Pressure preference is required' },
    ],
    customizationOptions: [],
  },
  
  [BusinessCategory.BEAUTY_PARLOR]: {
    category: BusinessCategory.BEAUTY_PARLOR,
    displayName: 'Beauty Parlor',
    description: 'Comprehensive beauty services, bridal packages, and event styling',
    icon: '💄',
    templatePath: '/templates/beauty-parlor.template.ts',
    features: [
      { name: 'makeup_services', enabled: true, configuration: {}, dependencies: [] },
      { name: 'bridal_packages', enabled: true, configuration: {}, dependencies: [] },
      { name: 'hair_styling', enabled: true, configuration: {}, dependencies: [] },
      { name: 'nail_services', enabled: true, configuration: {}, dependencies: [] },
    ],
    validationRules: [
      { field: 'skin_tone', type: 'required', parameters: {}, message: 'Skin tone is required' },
      { field: 'event_date', type: 'format', parameters: { format: 'date' }, message: 'Event date must be a valid date' },
    ],
    customizationOptions: [],
  },
  
  [BusinessCategory.FITNESS]: {
    category: BusinessCategory.FITNESS,
    displayName: 'Fitness Center',
    description: 'Personal training, group classes, and fitness programs',
    icon: '💪',
    templatePath: '/templates/fitness.template.ts',
    features: [
      { name: 'personal_training', enabled: true, configuration: {}, dependencies: [] },
      { name: 'group_classes', enabled: true, configuration: {}, dependencies: [] },
      { name: 'membership_management', enabled: true, configuration: {}, dependencies: [] },
      { name: 'progress_tracking', enabled: true, configuration: {}, dependencies: [] },
    ],
    validationRules: [
      { field: 'fitness_level', type: 'required', parameters: {}, message: 'Fitness level is required' },
      { field: 'fitness_goals', type: 'format', parameters: { format: 'array' }, message: 'Fitness goals must be an array' },
    ],
    customizationOptions: [],
  },
  
  [BusinessCategory.OTHER]: {
    category: BusinessCategory.OTHER,
    displayName: 'Other Business',
    description: 'General service business with customizable features',
    icon: '🏢',
    templatePath: '/templates/salon.template.ts', // Use salon as fallback
    features: [
      { name: 'general_services', enabled: true, configuration: {}, dependencies: [] },
      { name: 'appointment_booking', enabled: true, configuration: {}, dependencies: [] },
    ],
    validationRules: [
      { field: 'service_duration', type: 'required', parameters: {}, message: 'Service duration is required' },
    ],
    customizationOptions: [],
  },
};

/**
 * Setup the category system
 */
export const setupCategorySystem = async (): Promise<void> => {
  console.log('🚀 Setting up category system...');
  
  try {
    // Dynamic import to avoid circular dependencies
    const { categoryFactory } = await import('./registry/CategoryFactory');
    
    // Get all supported categories
    const supportedCategories = getSupportedCategories();
    
    // Register each category
    for (const category of supportedCategories) {
      const config = CATEGORY_CONFIGS[category];
      if (config) {
        categoryFactory.registerCategory(category, config);
        console.log(`✅ Registered category: ${category}`);
      } else {
        console.warn(`⚠️ No config found for category: ${category}`);
      }
    }
    
    console.log(`🎉 Category system setup complete! Registered ${supportedCategories.length} categories.`);
  } catch (error) {
    console.error('❌ Failed to setup category system:', error);
    throw error;
  }
};

/**
 * Initialize a specific category for immediate use
 */
export const initializeCategory = async (category: BusinessCategory): Promise<void> => {
  console.log(`🔄 Initializing category: ${category}`);
  
  try {
    // Dynamic import to avoid circular dependencies
    const { categoryFactory } = await import('./registry/CategoryFactory');
    
    // Ensure category is registered
    const config = CATEGORY_CONFIGS[category];
    if (!config) {
      throw new Error(`No configuration found for category: ${category}`);
    }
    
    // Register if not already registered
    if (!categoryFactory.getCategoryInstance(category)) {
      categoryFactory.registerCategory(category, config);
    }
    
    // Create instance to warm up the cache
    await categoryFactory.createCategoryInstance(category);
    
    console.log(`✅ Category initialized: ${category}`);
  } catch (error) {
    console.error(`❌ Failed to initialize category ${category}:`, error);
    throw error;
  }
};

/**
 * Get category configuration
 */
export const getCategoryConfig = (category: BusinessCategory): CategoryConfig | null => {
  return CATEGORY_CONFIGS[category] || null;
};

/**
 * Check if category is supported
 */
export const isCategorySupported = (category: string): category is BusinessCategory => {
  return category in CATEGORY_CONFIGS;
};

/**
 * Get all category configurations
 */
export const getAllCategoryConfigs = (): Record<BusinessCategory, CategoryConfig> => {
  return CATEGORY_CONFIGS;
};

export default setupCategorySystem;