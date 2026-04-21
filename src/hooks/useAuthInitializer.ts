import { useEffect } from 'react';
import { useAuthStore } from '../store/slices/authSlice';
import { useThemeStore } from '../store/slices/themeSlice';

export function useAuthInitializer() {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const initializeTheme = useThemeStore((s) => s.initializeTheme);

  useEffect(() => {
    initializeAuth();
    initializeTheme();
  }, [initializeAuth, initializeTheme]);

  return { isInitialized };
}
