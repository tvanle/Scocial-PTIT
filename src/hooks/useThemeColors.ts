import { useMemo } from 'react';
import { useThemeStore } from '../store/slices/themeSlice';
import { LightColors, DarkColors } from '../constants/theme';

export const useThemeColors = () => {
  const isDark = useThemeStore((state) => state.isDark);

  const colors = useMemo(() => {
    return isDark ? DarkColors : LightColors;
  }, [isDark]);

  return colors;
};

export const useTheme = () => {
  const isDark = useThemeStore((state) => state.isDark);
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const colors = useMemo(() => {
    return isDark ? DarkColors : LightColors;
  }, [isDark]);

  return {
    isDark,
    mode,
    colors,
    setMode,
    toggleTheme,
  };
};

export default useThemeColors;
