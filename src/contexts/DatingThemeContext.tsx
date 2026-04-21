/**
 * Dating Theme Context
 *
 * Provides theme-aware colors and utilities for Dating module
 * Syncs with main app's theme store for consistent theming
 */

import React, { createContext, useContext, useMemo } from 'react';
import {
  BRAND,
  SEMANTIC,
  LIGHT,
  DARK,
  SHADOWS,
  GLOWS,
  type ThemeMode,
} from '../constants/dating/design-system';
import { useThemeStore } from '../store/slices/themeSlice';

// ═══════════════════════════════════════════════════════════════
// THEME TYPES
// ═══════════════════════════════════════════════════════════════

interface DatingTheme {
  mode: ThemeMode;
  brand: typeof BRAND;
  semantic: typeof SEMANTIC;
  bg: typeof LIGHT.bg | typeof DARK.bg;
  text: typeof LIGHT.text | typeof DARK.text;
  border: typeof LIGHT.border | typeof DARK.border;
  card: typeof LIGHT.card | typeof DARK.card;
  button: typeof LIGHT.button | typeof DARK.button;
  nav: typeof LIGHT.nav | typeof DARK.nav;
  shadows: typeof SHADOWS.light | typeof SHADOWS.dark;
  glows: typeof GLOWS;
}

interface DatingThemeContextValue {
  theme: DatingTheme;
  isDark: boolean;
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════

const DatingThemeContext = createContext<DatingThemeContextValue | null>(null);

// ═══════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════

interface DatingThemeProviderProps {
  children: React.ReactNode;
  forcedMode?: ThemeMode; // Override system theme
}

export const DatingThemeProvider: React.FC<DatingThemeProviderProps> = ({
  children,
  forcedMode,
}) => {
  // Use main app's theme store instead of useColorScheme directly
  const appIsDark = useThemeStore((state) => state.isDark);
  const mode: ThemeMode = forcedMode ?? (appIsDark ? 'dark' : 'light');

  const theme = useMemo<DatingTheme>(() => {
    const isDark = mode === 'dark';
    const themeColors = isDark ? DARK : LIGHT;
    const themeShadows = isDark ? SHADOWS.dark : SHADOWS.light;

    return {
      mode,
      brand: BRAND,
      semantic: SEMANTIC,
      bg: themeColors.bg,
      text: themeColors.text,
      border: themeColors.border,
      card: themeColors.card,
      button: themeColors.button,
      nav: themeColors.nav,
      shadows: themeShadows,
      glows: GLOWS,
    };
  }, [mode]);

  const value = useMemo(
    () => ({
      theme,
      isDark: mode === 'dark',
    }),
    [theme, mode],
  );

  return (
    <DatingThemeContext.Provider value={value}>
      {children}
    </DatingThemeContext.Provider>
  );
};

// ═══════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════

export const useDatingTheme = (): DatingThemeContextValue => {
  const context = useContext(DatingThemeContext);

  if (!context) {
    // Return default light theme if used outside provider
    const defaultTheme: DatingTheme = {
      mode: 'light',
      brand: BRAND,
      semantic: SEMANTIC,
      bg: LIGHT.bg,
      text: LIGHT.text,
      border: LIGHT.border,
      card: LIGHT.card,
      button: LIGHT.button,
      nav: LIGHT.nav,
      shadows: SHADOWS.light,
      glows: GLOWS,
    };

    return {
      theme: defaultTheme,
      isDark: false,
    };
  }

  return context;
};

// Convenience hook for just the theme object
export const useTheme = () => useDatingTheme().theme;

// Convenience hook for just checking dark mode
export const useIsDarkMode = () => useDatingTheme().isDark;

export default DatingThemeContext;
