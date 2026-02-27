import { create } from 'zustand';
import { getItem, setItem } from '../utils/storage';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { theme as lightTheme } from '../theme';

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#EF5350',
    primaryContainer: '#4A1010',
    secondary: '#FFB300',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2A2A2A',
    onSurface: '#EEEEEE',
    onBackground: '#EEEEEE',
  },
};

interface ThemeState {
  isDark: boolean;
  currentTheme: typeof lightTheme;
  toggle: () => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,
  currentTheme: lightTheme,

  loadTheme: async () => {
    const saved = await getItem<{ isDark: boolean }>('buy_theme');
    if (saved?.isDark) {
      set({ isDark: true, currentTheme: darkTheme as any });
    }
  },

  toggle: async () => {
    const { isDark } = get();
    const next = !isDark;
    await setItem('buy_theme', { isDark: next });
    set({ isDark: next, currentTheme: (next ? darkTheme : lightTheme) as any });
  },
}));
