/**
 * Premium Calm Editorial Theme Configurations
 * Inspired by premium minimal web experiences (e.g. Origin)
 */

export const Colors = {
  // Light Background - Warm Paper White
  background: '#FCFCFA',
  white: '#FFFFFF',
  
  // Ink colors
  primaryInk: '#03031F',       // Near-navy black
  secondaryText: '#6F6D7A',    // Muted slate gray
  mutedBorder: '#C9C7CF',      // Soft border
  
  // Accent states
  disabledSurface: '#F1F0EF',  // Very light gray
  selectedSurface: '#F5F3F1',  // Warm selected surface
  
  // Feedback
  success: '#12A36D',
  error: '#C62020',
  
  // Restrained premium accents (illustrations/badges only)
  accentGold: '#C5A880',
  accentRose: '#D9B0A8',
  accentOlive: '#7C826A',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 20,      // Floating input corner radius 20-24px
  xl: 24,
  pill: 999,   // Full pill buttons
};

export const Typography = {
  // Hero Display Headline
  heroHeadline: {
    fontFamily: 'InstrumentSerif-Regular',
    fontSize: 36,
    lineHeight: 42,
    color: Colors.primaryInk,
  },
  
  // Editorial sections
  sectionHeadline: {
    fontFamily: 'InstrumentSerif-Regular',
    fontSize: 38,
    lineHeight: 44,
    color: Colors.primaryInk,
  },
  
  // Body copy
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 17,
    lineHeight: 24,
    color: Colors.secondaryText,
  },
  bodyMedium: {
    fontFamily: 'Inter-Medium',
    fontSize: 17,
    lineHeight: 24,
    color: Colors.primaryInk,
  },
  bodyBold: {
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    lineHeight: 24,
    color: Colors.primaryInk,
  },
  
  // Input fields
  inputText: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    lineHeight: 24,
    color: Colors.primaryInk,
  },
  
  // Mono Buttons / Labels
  ctaMono: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 14,
    letterSpacing: 4,
    color: Colors.primaryInk,
  },
  
  // Tiny captions
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.secondaryText,
  },
};

export const Shadows = {
  soft: {
    shadowColor: Colors.primaryInk,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.primaryInk,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
};

export default {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
};
