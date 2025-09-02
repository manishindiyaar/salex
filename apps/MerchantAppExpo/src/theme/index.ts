import { MD3DarkTheme } from 'react-native-paper';

export const salexTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Primary gradient colors
    primary: '#FF416C',
    secondary: '#FF4B2B',
    // Backgrounds
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2A2A2A',
    // Text colors
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#B3B3B3',
    // Feedback colors
    error: '#E74C3C',
    success: '#2ECC71',
    // Accent colors for highlights
    accent1: '#FF416C',
    accent2: '#FF4B2B',
    accent3: '#FF6B8A',
  },
  fonts: {
    ...MD3DarkTheme.fonts,
    headlineSmall: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 28 },
    bodyLarge: { fontFamily: 'Inter-Regular', fontSize: 16 },
    bodyMedium: { fontFamily: 'Inter-Regular', fontSize: 14 },
    labelLarge: { fontFamily: 'Inter-Bold', fontSize: 16, letterSpacing: 0.5 },
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

export const gradients = {
  primary: ['#FF416C', '#FF4B2B'],
  secondary: ['#FF6B8A', '#FF8E53'],
  dark: ['#121212', '#1E1E1E'],
  card: ['#1E1E1E', '#2A2A2A'],
};

export type SalexTheme = typeof salexTheme;