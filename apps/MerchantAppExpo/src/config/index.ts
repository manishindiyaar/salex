/**
 * Application Configuration
 * 
 * Centralized configuration for the React Native app including
 * development toggles and feature flags.
 */

// Environment-based configuration
const isDev = __DEV__;

// Authentication Toggle Configuration
// Auth is ALWAYS enabled - we use real OTP flow
export const AUTH_CONFIG = {
  // Always enable auth - use real OTP flow with backend
  ENABLE_AUTH: true,
  
  // Dev mode uses magic OTP "123456" on backend
  DEV_MAGIC_OTP: '123456',
} as const;

// API Configuration
export const API_CONFIG = {
  BASE_URL: isDev 
    ? 'http://localhost:3001/api/v1'
    : 'https://api.salex.app/api/v1',
  
  TIMEOUT_MS: 10000,
  
  // Always include auth headers when we have a token
  INCLUDE_AUTH_HEADERS: true,
} as const;

// App Configuration
export const APP_CONFIG = {
  // Never skip auth screens - always require login
  SKIP_AUTH_SCREENS: false,
  
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