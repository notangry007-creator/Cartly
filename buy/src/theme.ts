import { MD3LightTheme, MD3Theme } from 'react-native-paper';
import { useThemeStore } from './stores/themeStore';

// ─── Static light theme (used as PaperProvider default and for non-React contexts) ──
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#E53935',
    primaryContainer: '#FFEBEE',
    secondary: '#FF8F00',
    secondaryContainer: '#FFF8E1',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceVariant: '#F8F8F8',
    error: '#B00020',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    outline: '#E0E0E0',
  },
};

export type AppTheme = typeof theme;

// ─── Layout constants ────────────────────────────────────────────────────────
export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const RADIUS = { sm: 6, md: 10, lg: 16, xl: 24, full: 999 } as const;

// ─── Semantic colour palette ─────────────────────────────────────────────────
// Light-mode values. Components should prefer useAppColors() for dark-mode
// support, but these are used in contexts where hooks aren't available.
/** Semantic colour palette. Derive an interface with plain string values so
 *  light and dark palettes are both assignable to the same type. */
export interface AppColors {
  text: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  border: string;
  divider: string;
  cardBg: string;
  screenBg: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export const colors: AppColors = {
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
};

// ─── Dark-mode colour overrides ──────────────────────────────────────────────
const darkColors: AppColors = {
  text: '#F5F5F5',
  textSecondary: '#AEAEB2',
  textMuted: '#636366',
  textDisabled: '#48484A',
  border: '#3A3A3C',
  divider: '#2C2C2E',
  cardBg: '#1C1C1E',
  screenBg: '#111111',
  success: '#66BB6A',
  warning: '#FFB300',
  error: '#CF6679',
  info: '#42A5F5',
};

// ─── React hooks ─────────────────────────────────────────────────────────────

/**
 * Returns the active MD3Theme (light or dark) from the theme store.
 * Use this anywhere you need `theme.colors.primary` etc. in a component.
 */
export function useAppTheme(): MD3Theme {
  return useThemeStore(s => s.currentTheme);
}

/**
 * Returns the semantic colour palette that adapts to the current theme.
 * Prefer this over hard-coded hex strings in StyleSheet / inline styles.
 *
 * @example
 * const c = useAppColors();
 * const s = StyleSheet.create({ title: { color: c.text } });
 */
export function useAppColors(): AppColors {
  const isDark = useThemeStore(s => s.isDark);
  return isDark ? darkColors : colors;
}
