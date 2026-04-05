import { useEffect } from 'react';
import { useAuthStore } from '../store/slices/authSlice';

export function useAuthInitializer() {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initializeAuth = useAuthStore((s) => s.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return { isInitialized };
}
