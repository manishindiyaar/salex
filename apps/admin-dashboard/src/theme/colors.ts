/**
 * Admin Dashboard Theme Colors
 * Matches the High-Strength merchant app design system
 */

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
  success: '#00FF00',              // Salex Green - same as primary
  warning: '#FFB800',              // Amber - pending, caution
  error: '#FF3333',                // Alert Red - errors, deny, cancel

  // UI elements
  border: '#333333',
  borderFocus: '#00FF00',          // Green focus border
  disabled: '#444444',
  variant: '#1A1A1A',
};

export const StatusColors = {
  PENDING: '#FFB800',              // Amber
  ACTIVE: '#00FF00',               // Green
  TRIAL: '#00AAFF',                // Blue
  GRACE: '#FFB800',                // Amber
  EXPIRED: '#FF3333',              // Red
  CANCELLED: '#FF3333',            // Red
  COMPLETED: '#00FF00',            // Green
  CONFIRMED: '#00FF00',            // Green
};

export const StatusBgColors = {
  PENDING: 'rgba(255, 184, 0, 0.1)',
  ACTIVE: 'rgba(0, 255, 0, 0.1)',
  TRIAL: 'rgba(0, 170, 255, 0.1)',
  GRACE: 'rgba(255, 184, 0, 0.1)',
  EXPIRED: 'rgba(255, 51, 51, 0.1)',
  CANCELLED: 'rgba(255, 51, 51, 0.1)',
  COMPLETED: 'rgba(0, 255, 0, 0.1)',
  CONFIRMED: 'rgba(0, 255, 0, 0.1)',
};
