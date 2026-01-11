/**
 * Categories System - Main Index
 * 
 * Main entry point for the entire category-based dynamic UI system.
 * This is the primary import point for the category system throughout the app.
 */

// Core system (context, components, types)
export * from './core';

// Registry system
export * from './registry';

// Templates
export * from './templates';

// Setup and initialization - explicit exports to avoid conflicts
export { 
  setupCategorySystem, 
  initializeCategory, 
  getCategoryConfig,
  isCategorySupported,
  getAllCategoryConfigs 
} from './setup';

// Category-specific implementations will be added here as they're created
// export * from './salon';
// export * from './clinic';
// export * from './spa';
// export * from './beauty-parlor';
// export * from './barber-shop';
// export * from './fitness';

// Main setup function for the entire category system
export { setupCategorySystem as initializeCategories } from './setup';

// Quick start function for development
export const quickStartCategories = async () => {
  console.log('🚀 Quick starting category system...');
  
  const { setupCategorySystem } = await import('./setup');
  return setupCategorySystem();
};