/**
 * Application Configuration
 * 
 * Centralized configuration for the React Native app including
 * development toggles and feature flags.
 */

// Environment-based configuration
const isDev = __DEV__;

// Authentication Toggle Configuration
export const AUTH_CONFIG = {
  // Always enable auth
  ENABLE_AUTH: true,
  
  // Auth mode: 'password' for admin-provisioned accounts, 'otp' when OTP is enabled
  AUTH_MODE: 'password' as const,
} as const;

// API Configuration
// Use your Mac's LAN IP for dev so physical devices on the same WiFi can reach the API.
// Update LAN_IP if your network changes.
const LAN_IP = '192.168.1.10';

export const API_CONFIG = {
  BASE_URL: isDev 
    ? `http://${LAN_IP}:3001/api/v1`
    : 'https://salex-api-staging-staging.up.railway.app/api/v1',
  
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
