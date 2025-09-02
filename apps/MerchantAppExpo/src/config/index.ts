/**
 * Application Configuration
 * 
 * Centralized configuration for the React Native app including
 * development toggles and feature flags.
 */

// Environment-based configuration
const isDev = __DEV__;

// Authentication Toggle Configuration
// Set to false for development/testing to skip Firebase authentication
// Set to true for production to enable full authentication flow
export const AUTH_CONFIG = {
  // For development, we can disable auth to match backend ENABLE_AUTH=false
  ENABLE_AUTH: isDev ? false : true,
  
  // Mock user data when auth is disabled
  MOCK_USER: {
    uid: 'test-user-id',
    phoneNumber: '+1234567890',
    displayName: 'Test User',
  },
} as const;

// API Configuration
export const API_CONFIG = {
  BASE_URL: isDev 
    ? 'http://localhost:3000/api/v1'
    : 'https://api.salex.app/api/v1',
  
  TIMEOUT_MS: 10000,
  
  // Skip token injection when auth is disabled
  INCLUDE_AUTH_HEADERS: AUTH_CONFIG.ENABLE_AUTH,
} as const;

// App Configuration
export const APP_CONFIG = {
  // Skip onboarding/auth screens when auth is disabled
  SKIP_AUTH_SCREENS: !AUTH_CONFIG.ENABLE_AUTH,
  
  // Development helpers
  ENABLE_DEV_LOGS: isDev,
  ENABLE_DEBUG_MODE: isDev,
} as const;

// Export for easy access
export default {
  AUTH: AUTH_CONFIG,
  API: API_CONFIG,
  APP: APP_CONFIG,
};