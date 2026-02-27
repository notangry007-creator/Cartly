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
export const SPACING = { xs:4, sm:8, md:12, lg:16, xl:24, xxl:32 } as const;
export const RADIUS = { sm:6, md:10, lg:16, xl:24, full:999 } as const;
