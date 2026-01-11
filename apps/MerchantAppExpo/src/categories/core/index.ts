/**
 * Category Core - Index
 * 
 * Centralized export for all core category system components.
 * Provides types, context, hooks, and smart components.
 */

// Types (only from CategoryTypes to avoid conflicts)
export * from './types/CategoryTypes';

// Context and Hooks
export * from './context/CategoryContext';
export * from './context/CategoryHooks';

// Smart Components
export * from './components/SmartText';
export * from './components/SmartButton';
export * from './components/ConditionalFeature';