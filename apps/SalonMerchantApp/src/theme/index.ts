import { MD3LightTheme } from 'react-native-paper';
import { Colors } from './config';

/**
 * Premium Calm Editorial Salex Theme
 * 
 * Warm paper backgrounds, deep navy ink accents, editorial serif headlines
 */
export const salexTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Primary - Deep Navy Ink
    primary: Colors.PRIMARY,
    secondary: Colors.SECONDARY,
    // Backgrounds - Warm Paper
    background: Colors.BACKGROUND,
    surface: Colors.SURFACE,
    surfaceVariant: Colors.SURFACE_VARIANT,
    // Text colors - Deep Ink
    onSurface: Colors.TEXT,
    onSurfaceVariant: Colors.TEXT_SECONDARY,
    // Feedback colors
    error: Colors.ERROR,
    success: Colors.SUCCESS,
    // Accent colors
    accent1: Colors.PRIMARY,
    accent2: Colors.SECONDARY,
    accent3: Colors.WARNING,
  },
  fonts: {
    ...MD3LightTheme.fonts,
    headlineSmall: { fontFamily: 'InstrumentSerif-Regular', fontSize: 28, fontWeight: '700' as const },
    bodyLarge: { fontFamily: 'Inter-Regular', fontSize: 16, fontWeight: '400' as const },
    bodyMedium: { fontFamily: 'Inter-Regular', fontSize: 14, fontWeight: '400' as const },
    labelLarge: { fontFamily: 'SpaceMono-Bold', fontSize: 16, fontWeight: '700' as const, letterSpacing: 1.5 },
  },
  roundness: 12,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

/**
 * High-Strength Gradients
 * Using Salex Green for primary actions
 */
export const gradients = {
  primary: [Colors.PRIMARY, Colors.PRIMARY_DARK],
  secondary: [Colors.SECONDARY, '#0088CC'],
  dark: [Colors.BACKGROUND, Colors.SURFACE],
  card: [Colors.SURFACE, Colors.SURFACE_VARIANT],
  success: [Colors.SUCCESS, Colors.PRIMARY_DARK],
};

// Re-export theme config for convenience
export { Colors, CalculatorTypography } from './config';

export type SalexTheme = typeof salexTheme;
