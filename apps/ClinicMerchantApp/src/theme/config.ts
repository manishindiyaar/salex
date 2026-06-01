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
export const Colors = {
  // Primary backgrounds - Deep Black for maximum contrast
  background: '#000000',           // Deep Black - main app background
  surface: '#0A0A0A',              // Slightly lighter black - cards
  surfaceElevated: '#141414',      // Elevated surfaces - modals, drawers

  // Text colors - High visibility
  text: '#FFFFFF',                 // High-Vis White - primary text
  muted: '#888888',                // Muted gray - secondary text
  textTertiary: '#555555',         // Very muted - hints

  // Accent colors
  primary: '#00FF00',              // Salex Green - money, success, primary actions
  primaryDark: '#00CC00',          // Darker green for pressed states
  secondary: '#00AAFF',            // Blue - in progress, info
  info: '#00AAFF',                 // Blue - neutral info messaging
  success: '#00FF00',              // Salex Green - same as primary
  warning: '#FFB800',              // Amber - pending, caution
  error: '#FF3333',                // Alert Red - errors, deny, cancel

  // Chai-Break states
  mutedRed: '#331111',             // Muted red background when closed
  mutedRedBorder: '#661111',       // Border for closed state

  // Uppercase aliases for backward compatibility
  PRIMARY: '#00FF00',              // Salex Green
  PRIMARY_DARK: '#00CC00',
  SECONDARY: '#00AAFF',
  INFO: '#00AAFF',
  BACKGROUND: '#000000',           // Deep Black
  SURFACE: '#0A0A0A',
  SURFACE_ELEVATED: '#141414',
  TEXT: '#FFFFFF',                 // High-Vis White
  TEXT_SECONDARY: '#888888',
  TEXT_TERTIARY: '#555555',
  SUCCESS: '#00FF00',              // Salex Green
  WARNING: '#FFB800',              // Amber
  ERROR: '#FF3333',                // Alert Red
  SALEX_GREEN: '#00FF00',          // Main accent color for money/success

  // Status colors for bookings
  STATUS_PENDING: '#FFB800',       // Amber - waiting for action
  STATUS_CONFIRMED: '#00FF00',     // Green - ready to serve
  STATUS_IN_PROGRESS: '#00AAFF',   // Blue - currently serving
  STATUS_COMPLETED: '#00FF00',     // Green - done
  STATUS_CANCELLED: '#FF3333',     // Red - cancelled
  STATUS_NO_SHOW: '#888888',       // Gray - customer didn't arrive

  // Status background colors (20% opacity versions)
  STATUS_PENDING_BG: 'rgba(255, 184, 0, 0.2)',
  STATUS_CONFIRMED_BG: 'rgba(0, 255, 0, 0.2)',
  STATUS_IN_PROGRESS_BG: 'rgba(0, 170, 255, 0.2)',
  STATUS_COMPLETED_BG: 'rgba(0, 255, 0, 0.2)',
  STATUS_CANCELLED_BG: 'rgba(255, 51, 51, 0.2)',

  // UI elements
  SURFACE_VARIANT: '#1A1A1A',
  BORDER: '#333333',
  BORDER_FOCUS: '#00FF00',         // Green focus border
  DISABLED: '#444444',

  // Legacy aliases (keeping for backward compatibility)
  COMPLETED: '#00FF00',
  CONFIRMED: '#00FF00',
  PENDING: '#FFB800',
  CANCELLED: '#FF3333',

  // Gradient colors (keeping for any gradient buttons)
  GRADIENT_START: '#00FF00',
  GRADIENT_END: '#00CC00',

  // Chai-Break specific
  CHAI_BREAK_OFF_BG: '#331111',
  CHAI_BREAK_OFF_BORDER: '#661111',
};

// =============================================================================
// CALCULATOR TYPOGRAPHY - Massive bold fonts for critical numbers
// =============================================================================
export const CalculatorTypography = {
  // Font family - use system condensed bold for maximum impact
  fontFamily: 'System',
  fontWeight: '900' as const,

  // Size variants
  sm: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900' as const,
  },
  md: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '900' as const,
  },
  lg: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: '900' as const,
  },
  xl: {
    fontSize: 96,
    lineHeight: 104,
    fontWeight: '900' as const,
  },
  xxl: {
    fontSize: 128,
    lineHeight: 136,
    fontWeight: '900' as const,
  },
};

// =============================================================================
// STANDARD TYPOGRAPHY
// =============================================================================
export const Typography = {
  // Primary typography (keeping existing structure)
  heading1: { fontSize: 34, fontWeight: '700' as const, fontFamily: 'System' },
  heading2: { fontSize: 28, fontWeight: '700' as const, fontFamily: 'System' },
  heading3: { fontSize: 20, fontWeight: '600' as const, fontFamily: 'System' },
  body: { fontSize: 16, fontWeight: '400' as const, fontFamily: 'System' },
  caption: { fontSize: 14, fontWeight: '400' as const, fontFamily: 'System' },

  // Uppercase/legacy aliases
  H1: { fontSize: 34, fontWeight: '700' as const, fontFamily: 'System' },
  H2: { fontSize: 28, fontWeight: '700' as const, fontFamily: 'System' },
  H3: { fontSize: 20, fontWeight: '600' as const, fontFamily: 'System' },
  H4: { fontSize: 16, fontWeight: '600' as const, fontFamily: 'System' },
  Body1: { fontSize: 16, fontWeight: '400' as const, fontFamily: 'System' },
  Body2: { fontSize: 14, fontWeight: '400' as const, fontFamily: 'System' },
  Caption: { fontSize: 12, fontWeight: '400' as const, fontFamily: 'System' },
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

// =============================================================================
// SHADOWS - With subtle green tint for High-Strength design
// =============================================================================
export const Shadows = {
  SM: {
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.1)',  // Subtle green tint
  },
  MD: {
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  LG: {
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  XL: {
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
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
