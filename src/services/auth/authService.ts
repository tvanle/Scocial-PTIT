import { LoginCredentials, RegisterData, AuthResponse, User } from '../../types';
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../../constants/api';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, credentials);
    // Backend: { success, data: { user, accessToken, refreshToken } }
    return response.data.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER, data);
    return response.data.data;
  }

  async logout(refreshToken?: string): Promise<void> {
    await apiClient.post(ENDPOINTS.AUTH.LOGOUT, { refreshToken });
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await apiClient.post(ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken });
    // Backend: { success, data: { accessToken, refreshToken } }
    return response.data.data;
  }

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, { token, newPassword });
  }

  async verifyEmail(email: string, code: string): Promise<void> {
    await apiClient.post(ENDPOINTS.AUTH.VERIFY_EMAIL, { email, code });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, { currentPassword, newPassword });
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>(ENDPOINTS.AUTH.ME);
    return response.data;
  }
}

export const authService = new AuthService();
export default authService;
