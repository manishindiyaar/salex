import { MD3DarkTheme } from 'react-native-paper';
import { Colors, CalculatorTypography } from './config';

/**
 * High-Strength Salex Theme
 * 
 * Deep Black backgrounds, Salex Green accents, Calculator-style fonts
 */
export const salexTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Primary - Salex Green for money/success
    primary: Colors.PRIMARY,
    secondary: Colors.SECONDARY,
    // Backgrounds - Deep Black
    background: Colors.BACKGROUND,
    surface: Colors.SURFACE,
    surfaceVariant: Colors.SURFACE_VARIANT,
    // Text colors - High-Vis White
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
    ...MD3DarkTheme.fonts,
    headlineSmall: { fontFamily: 'System', fontSize: 28, fontWeight: '700' },
    bodyLarge: { fontFamily: 'System', fontSize: 16, fontWeight: '400' },
    bodyMedium: { fontFamily: 'System', fontSize: 14, fontWeight: '400' },
    labelLarge: { fontFamily: 'System', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  },
  roundness: 2,
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
