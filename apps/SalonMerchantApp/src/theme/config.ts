/**
 * High-Strength Theme Configuration
 * 
 * Design Philosophy:
 * - Deep Black backgrounds for maximum contrast
 * - Salex Green (#00FF00) for money and success
 * - Calculator-style bold fonts for critical numbers
 * - Physical, tactile feel for all interactions
 */

// =============================================================================
// HIGH-STRENGTH COLOR PALETTE
// =============================================================================
// =============================================================================
// PREMIUM LIGHT COLOR PALETTE
// =============================================================================
export const Colors = {
  // Primary backgrounds - warm paper and clean white
  background: '#FCFCFA',           // Warm Paper
  surface: '#FFFFFF',              // White paper - cards
  surfaceElevated: '#FFFFFF',      // Elevated surfaces

  // Text colors - High visibility ink
  text: '#03031F',                 // Near-navy black
  muted: '#6F6D7A',                // Slate grey - secondary text
  textTertiary: '#C9C7CF',         // Muted border style - hints

  // Accent colors
  primary: '#03031F',              // Deep Ink
  primaryDark: '#03031F',
  secondary: '#6F6D7A',            // Slate grey
  success: '#12A36D',              // Premium calm success green
  warning: '#9C7A4A',              // Restrained gold
  error: '#C62020',                // Crimson error red
  info: '#6F6D7A',                 // Slate grey for informational messages

  // Chai-Break states
  mutedRed: '#F9ECEB',             // Light red background when closed
  mutedRedBorder: '#E8C5C2',       // Border for closed state

  // Uppercase aliases for backward compatibility
  PRIMARY: '#03031F',
  PRIMARY_DARK: '#03031F',
  SECONDARY: '#6F6D7A',
  BACKGROUND: '#FCFCFA',
  SURFACE: '#FFFFFF',
  SURFACE_ELEVATED: '#FFFFFF',
  TEXT: '#03031F',
  TEXT_SECONDARY: '#6F6D7A',
  TEXT_TERTIARY: '#C9C7CF',
  SUCCESS: '#12A36D',
  WARNING: '#9C7A4A',
  ERROR: '#C62020',
  INFO: '#6F6D7A',
  SALEX_GREEN: '#12A36D',          // Redefined from neon to premium green

  // Status colors for bookings
  STATUS_PENDING: '#9C7A4A',       // Gold
  STATUS_CONFIRMED: '#12A36D',     // Green
  STATUS_IN_PROGRESS: '#6F6D7A',   // Slate
  STATUS_COMPLETED: '#12A36D',     // Green
  STATUS_CANCELLED: '#C62020',     // Crimson
  STATUS_NO_SHOW: '#C9C7CF',       // Soft grey

  // Status background colors (20% opacity versions)
  STATUS_PENDING_BG: 'rgba(197, 168, 128, 0.15)',
  STATUS_CONFIRMED_BG: 'rgba(18, 163, 109, 0.15)',
  STATUS_IN_PROGRESS_BG: 'rgba(111, 109, 122, 0.15)',
  STATUS_COMPLETED_BG: 'rgba(18, 163, 109, 0.15)',
  STATUS_CANCELLED_BG: 'rgba(198, 32, 32, 0.15)',

  // UI elements
  SURFACE_VARIANT: '#F5F3F1',      // Selected surface
  BORDER: '#C9C7CF',
  BORDER_FOCUS: '#03031F',
  DISABLED: '#F1F0EF',

  // Legacy aliases (keeping for backward compatibility)
  COMPLETED: '#12A36D',
  CONFIRMED: '#12A36D',
  PENDING: '#C5A880',
  CANCELLED: '#C62020',

  // Gradient colors (keeping for any gradient buttons)
  GRADIENT_START: '#03031F',
  GRADIENT_END: '#03031F',

  // Chai-Break specific
  CHAI_BREAK_OFF_BG: '#F9ECEB',
  CHAI_BREAK_OFF_BORDER: '#E8C5C2',
};

// =============================================================================
// PREMIUM TYPOGRAPHY
// =============================================================================
export const CalculatorTypography = {
  fontFamily: 'Inter-Bold',
  fontWeight: '700' as const,

  // Size variants
  sm: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700' as const,
  },
  md: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700' as const,
  },
  lg: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: '700' as const,
  },
  xl: {
    fontSize: 96,
    lineHeight: 104,
    fontWeight: '700' as const,
  },
  xxl: {
    fontSize: 128,
    lineHeight: 136,
    fontWeight: '700' as const,
  },
};

// =============================================================================
// STANDARD TYPOGRAPHY
// =============================================================================
export const Typography = {
  heading1: { fontSize: 38, fontWeight: '400' as const, fontFamily: 'InstrumentSerif-Regular' },
  heading2: { fontSize: 30, fontWeight: '400' as const, fontFamily: 'InstrumentSerif-Regular' },
  heading3: { fontSize: 24, fontWeight: '400' as const, fontFamily: 'InstrumentSerif-Regular' },
  body: { fontSize: 16, fontWeight: '400' as const, fontFamily: 'Inter-Regular' },
  caption: { fontSize: 14, fontWeight: '400' as const, fontFamily: 'Inter-Regular' },

  // Uppercase/legacy aliases
  H1: { fontSize: 38, fontWeight: '400' as const, fontFamily: 'InstrumentSerif-Regular' },
  H2: { fontSize: 30, fontWeight: '400' as const, fontFamily: 'InstrumentSerif-Regular' },
  H3: { fontSize: 24, fontWeight: '400' as const, fontFamily: 'InstrumentSerif-Regular' },
  H4: { fontSize: 16, fontWeight: '600' as const, fontFamily: 'Inter-SemiBold' },
  Body1: { fontSize: 16, fontWeight: '400' as const, fontFamily: 'Inter-Regular' },
  Body2: { fontSize: 14, fontWeight: '400' as const, fontFamily: 'Inter-Regular' },
  Caption: { fontSize: 12, fontWeight: '400' as const, fontFamily: 'Inter-Regular' },
};

// =============================================================================
// SPACING
// =============================================================================
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

// =============================================================================
// BORDER RADIUS
// =============================================================================
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 24,

  // Uppercase aliases
  SM: 8,
  MD: 12,
  LG: 20,
  XL: 24,
  ROUND: 999,
};

// =============================================================================
// SHADOWS - Soft visual drop shadows
// =============================================================================
export const Shadows = {
  SM: {
    borderWidth: 1,
    borderColor: 'rgba(3, 3, 31, 0.08)',
  },
  MD: {
    shadowColor: '#03031F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  LG: {
    shadowColor: '#03031F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  XL: {
    shadowColor: '#03031F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
};

// =============================================================================
// TOUCH TARGETS - Larger for High-Strength physical feel
// =============================================================================
export const TouchTarget = {
  MIN: 44,   // Apple's Human Interface Guidelines
  MD: 48,    // Common Material guideline
  LG: 56,
  XL: 80,    // Impact Zone preset buttons
};

// =============================================================================
// ANIMATION DURATIONS
// =============================================================================
export const AnimationDurations = {
  fast: 150,
  normal: 300,
  slow: 500,
  revenueBurst: 2000,  // Revenue burst celebration
};

// =============================================================================
// HAPTIC INTENSITIES
// =============================================================================
export const HapticIntensity = {
  light: 'light' as const,
  medium: 'medium' as const,
  heavy: 'heavy' as const,
};

// =============================================================================
// ONBOARDING CONFIG
// =============================================================================
export const OnboardingConfig = {
  OTP_TIMEOUT_SECONDS: 60,
};

// =============================================================================
// REVENUE MILESTONE CONFIG
// =============================================================================
export const RevenueConfig = {
  DEFAULT_MILESTONE: 5000,  // ₹5,000 default milestone
  CURRENCY_SYMBOL: '₹',
  CURRENCY_CODE: 'INR',
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================
export default {
  Colors,
  CalculatorTypography,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTarget,
  AnimationDurations,
  HapticIntensity,
  OnboardingConfig,
  RevenueConfig,
};
