import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#E53935', primaryContainer: '#FFEBEE',
    secondary: '#FF8F00', secondaryContainer: '#FFF8E1',
    background: '#F5F5F5', surface: '#FFFFFF', surfaceVariant: '#F8F8F8',
    error: '#B00020', onPrimary: '#FFFFFF', onSecondary: '#FFFFFF', outline: '#E0E0E0',
  },
};
export type AppTheme = typeof theme;
export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const RADIUS = { sm: 6, md: 10, lg: 16, xl: 24, full: 999 } as const;

// ─── Light mode color tokens ──────────────────────────────────────────────────
export const colors = {
  text: '#222222',
  textSecondary: '#555555',
  textMuted: '#888888',
  textDisabled: '#bbbbbb',
  border: '#e0e0e0',
  divider: '#f0f0f0',
  cardBg: '#ffffff',
  screenBg: '#F5F5F5',
  success: '#2E7D32',
  warning: '#FF8F00',
  error: '#B71C1C',
  info: '#1565C0',
} as const;

// ─── Dark mode color tokens ───────────────────────────────────────────────────
export const darkColors = {
  text: '#F5F5F5',
  textSecondary: '#AEAEB2',
  textMuted: '#8E8E93',
  textDisabled: '#636366',
  border: '#3A3A3C',
  divider: '#2C2C2E',
  cardBg: '#1C1C1E',
  screenBg: '#111111',
  success: '#4CAF50',
  warning: '#FFB300',
  error: '#CF6679',
  info: '#64B5F6',
} as const;

export type ColorTokens = typeof colors;

/**
 * Returns the correct color tokens based on the current theme mode.
 * Import and use this in screens instead of hardcoded hex strings.
 *
 * Usage:
 *   import { useAppColors } from '../src/theme';
 *   const c = useAppColors();
 *   <Text style={{ color: c.text }}>Hello</Text>
 */
export function useAppColors(isDark: boolean): ColorTokens {
  return isDark ? darkColors : colors;
}
