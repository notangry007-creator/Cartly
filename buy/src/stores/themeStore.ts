import { create } from 'zustand';
import { getItem, setItem } from '../utils/storage';
import { MD3DarkTheme, MD3LightTheme, MD3Theme } from 'react-native-paper';
import { theme as lightTheme } from '../theme';

const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#EF5350',
    primaryContainer: '#4A0E0E',
    secondary: '#FFB300',
    secondaryContainer: '#3D2800',
    background: '#111111',
    surface: '#1C1C1E',
    surfaceVariant: '#2C2C2E',
    outline: '#3A3A3C',
    onSurface: '#F5F5F5',
    onSurfaceVariant: '#AEAEB2',
    onBackground: '#F5F5F5',
    onPrimary: '#FFFFFF',
    error: '#CF6679',
  },
};

interface ThemeState {
  isDark: boolean;
  currentTheme: MD3Theme;
  toggle: () => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,
  currentTheme: lightTheme,

  loadTheme: async () => {
    const saved = await getItem<{ isDark: boolean }>('buy_theme');
    if (saved?.isDark) {
      set({ isDark: true, currentTheme: darkTheme });
    }
  },

  toggle: async () => {
    const { isDark } = get();
    const next = !isDark;
    await setItem('buy_theme', { isDark: next });
    set({ isDark: next, currentTheme: next ? darkTheme : lightTheme });
  },
}));
