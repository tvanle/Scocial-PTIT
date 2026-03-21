import { create } from 'zustand';
import { User, LoginCredentials, RegisterData } from '../../types';
import { authService } from '../../services/auth/authService';
import {
  saveTokens,
  getTokens,
  clearTokens,
  saveUserData,
  getUserData,
} from '../../utils/tokenStorage';

interface AuthStore {
  // State
  user: User | null;
  accessToken: string | null;
  refreshTokenValue: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  // Actions
  initializeAuth: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshTokenValue: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,

      initializeAuth: async () => {
        if (get().isInitialized) return;
        try {
          const { accessToken, refreshToken } = await getTokens();
          if (!accessToken || !refreshToken) {
            set({ isInitialized: true });
            return;
          }

          // Restore tokens and cached user data immediately
          const cachedUser = await getUserData();
          set({
            accessToken,
            refreshTokenValue: refreshToken,
            isAuthenticated: true,
            user: cachedUser,
          });

          // Verify token with server and get fresh user data
          try {
            const user = await authService.getCurrentUser();
            set({ user });
            await saveUserData(user);
          } catch {
            // Access token expired — try refreshing
            try {
              const response = await authService.refreshToken(refreshToken);
              set({
                accessToken: response.accessToken,
                refreshTokenValue: response.refreshToken,
              });
              await saveTokens(response.accessToken, response.refreshToken);

              const user = await authService.getCurrentUser();
              set({ user });
              await saveUserData(user);
            } catch {
              // Refresh also failed — session is truly expired
              set({
                user: null,
                accessToken: null,
                refreshTokenValue: null,
                isAuthenticated: false,
              });
              await clearTokens();
            }
          }
        } catch {
          // Storage read failed — start fresh
          set({
            user: null,
            accessToken: null,
            refreshTokenValue: null,
            isAuthenticated: false,
          });
        } finally {
          set({ isInitialized: true });
        }
      },

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(credentials);
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshTokenValue: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          await saveTokens(response.accessToken, response.refreshToken);
          await saveUserData(response.user);
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Đăng nhập thất bại',
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(data);
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshTokenValue: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          await saveTokens(response.accessToken, response.refreshToken);
          await saveUserData(response.user);
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Đăng ký thất bại',
          });
          throw error;
        }
      },

      logout: async () => {
        const { refreshTokenValue } = get();
        set({
          user: null,
          accessToken: null,
          refreshTokenValue: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        await clearTokens();
        try {
          await authService.logout(refreshTokenValue || undefined);
        } catch (error) {
          // Ignore logout errors — state is already cleared
        }
      },

      refreshToken: async () => {
        const { refreshTokenValue } = get();
        if (!refreshTokenValue) {
          throw new Error('No refresh token');
        }

        try {
          const response = await authService.refreshToken(refreshTokenValue);
          set({
            accessToken: response.accessToken,
            refreshTokenValue: response.refreshToken,
          });
          await saveTokens(response.accessToken, response.refreshToken);
        } catch (error) {
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, ...userData };
          set({ user: updatedUser });
          saveUserData(updatedUser).catch(() => {});
        }
      },

      clearError: () => set({ error: null }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),
    })
);

export default useAuthStore;
