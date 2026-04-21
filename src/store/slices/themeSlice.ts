import { create } from 'zustand';
import { Appearance } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'app_theme_mode';

interface ThemeStore {
  mode: ThemeMode;
  isDark: boolean;
  isInitialized: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  initializeTheme: () => Promise<void>;
}

const getSystemTheme = () => Appearance.getColorScheme() === 'dark';

export const useThemeStore = create<ThemeStore>()((set, get) => ({
  mode: 'system',
  isDark: getSystemTheme(),
  isInitialized: false,

  initializeTheme: async () => {
    try {
      const savedMode = await SecureStore.getItemAsync(THEME_KEY) as ThemeMode | null;
      if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
        const isDark = savedMode === 'system' ? getSystemTheme() : savedMode === 'dark';
        set({ mode: savedMode, isDark, isInitialized: true });
      } else {
        set({ isInitialized: true });
      }
    } catch {
      set({ isInitialized: true });
    }
  },

  setMode: (mode: ThemeMode) => {
    const isDark = mode === 'system' ? getSystemTheme() : mode === 'dark';
    set({ mode, isDark });
    SecureStore.setItemAsync(THEME_KEY, mode).catch(() => {});
  },

  toggleTheme: () => {
    const { mode } = get();
    const newMode = mode === 'light' ? 'dark' : 'light';
    set({ mode: newMode, isDark: newMode === 'dark' });
    SecureStore.setItemAsync(THEME_KEY, newMode).catch(() => {});
  },
}));

// Listen for system theme changes
Appearance.addChangeListener(({ colorScheme }) => {
  const { mode } = useThemeStore.getState();
  if (mode === 'system') {
    useThemeStore.setState({ isDark: colorScheme === 'dark' });
  }
});

export default useThemeStore;
