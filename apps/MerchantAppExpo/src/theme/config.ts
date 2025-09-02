/**
 * Theme config scaffold to satisfy imports from '@theme/config'.
 * Adjust values to match your design system.
 */
export const Colors = {
  // Modern gradient-based theme as per UI specification
  primary: '#FF416C', // Primary red from gradient
  primaryDark: '#FF4B2B', // Secondary red from gradient
  secondary: '#FF4B2B',
  background: '#121212', // Main app background
  surface: '#1E1E1E', // Card backgrounds, modals
  text: '#FFFFFF', // Primary text (headings and primary content)
  muted: '#B3B3B3', // Secondary text (subtitles, descriptions)
  success: '#2ECC71', // Confirmation messages
  warning: '#F59E0B',
  error: '#E74C3C', // Error messages, destructive actions

  // Uppercase aliases to avoid ts(2551) in legacy code paths.
  PRIMARY: '#FF416C',
  PRIMARY_DARK: '#FF4B2B',
  SECONDARY: '#FF4B2B',
  BACKGROUND: '#121212',
  SURFACE: '#1E1E1E',
  TEXT: '#FFFFFF',
  TEXT_SECONDARY: '#B3B3B3',
  TEXT_TERTIARY: '#777777',
  SUCCESS: '#2ECC71',
  WARNING: '#F59E0B',
  ERROR: '#E74C3C',

  // Additional tokens for modern UI
  SURFACE_VARIANT: '#2A2A2A',
  BORDER: '#333333',
  BORDER_FOCUS: '#FF416C',
  DISABLED: '#555555',
  COMPLETED: '#2ECC71',
  CONFIRMED: '#FF416C',
  PENDING: '#F59E0B',
  CANCELLED: '#E74C3C',
  
  // Gradient colors for buttons and highlights
  GRADIENT_START: '#FF416C',
  GRADIENT_END: '#FF4B2B',
};

export const Typography = {
  // Primary typography (Playfair Display for headings as per UI spec)
  heading1: { fontSize: 34, fontWeight: '700' as const, fontFamily: 'PlayfairDisplay_700Bold' },
  heading2: { fontSize: 28, fontWeight: '700' as const, fontFamily: 'PlayfairDisplay_700Bold' },
  heading3: { fontSize: 20, fontWeight: '600' as const, fontFamily: 'PlayfairDisplay_600SemiBold' },
  // Secondary typography (Inter for body/UI as per UI spec)
  body: { fontSize: 16, fontWeight: '400' as const, fontFamily: 'Inter_400Regular' },
  caption: { fontSize: 14, fontWeight: '400' as const, fontFamily: 'Inter_400Regular' },

  // Uppercase/legacy aliases used throughout the app
  H1: { fontSize: 34, fontWeight: '700' as const, fontFamily: 'PlayfairDisplay_700Bold' },
  H2: { fontSize: 28, fontWeight: '700' as const, fontFamily: 'PlayfairDisplay_700Bold' },
  H3: { fontSize: 20, fontWeight: '600' as const, fontFamily: 'PlayfairDisplay_600SemiBold' },
  H4: { fontSize: 16, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold' },
  Body1: { fontSize: 16, fontWeight: '400' as const, fontFamily: 'Inter_400Regular' },
  Body2: { fontSize: 14, fontWeight: '400' as const, fontFamily: 'Inter_400Regular' },
  Caption: { fontSize: 12, fontWeight: '400' as const, fontFamily: 'Inter_400Regular' },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,

  // Uppercase aliases
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 24,
  XXL: 32,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,

  // Uppercase aliases
  SM: 6,
  MD: 10,
  LG: 14,
  XL: 20,
  ROUND: 999,
};

// Cross-platform shadow tokens - optimized for performance
export const Shadows = {
  SM: {
    // Use borderWidth for better performance instead of shadows
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  MD: {
    // Minimal shadow for important elements only
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  LG: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
};

export const TouchTarget = {
  // Minimum recommended touch sizes (in dp)
  MIN: 44,   // Apple's Human Interface Guidelines
  MD: 48,    // Common Material guideline
  LG: 56,
};

export const OnboardingConfig = {
  OTP_TIMEOUT_SECONDS: 60,
};

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTarget,
  OnboardingConfig,
};
