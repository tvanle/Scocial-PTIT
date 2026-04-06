import { LoginCredentials, RegisterData, AuthResponse, User } from '../../types';
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../../constants/api';

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER, data);
    return response.data;
  }

  async logout(refreshToken?: string): Promise<void> {
    await apiClient.post(ENDPOINTS.AUTH.LOGOUT, { refreshToken });
  }

  async logoutAll(): Promise<void> {
    await apiClient.post(ENDPOINTS.AUTH.LOGOUT_ALL);
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await apiClient.post(ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken });
    return response.data;
  }

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  }

  async verifyResetCode(email: string, code: string): Promise<{ resetToken: string }> {
    const response = await apiClient.post(ENDPOINTS.AUTH.VERIFY_RESET_CODE, { email, code });
    return response.data;
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    await apiClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, { email, code, newPassword });
  }

  async verifyEmail(email: string, code: string): Promise<void> {
    await apiClient.post(ENDPOINTS.AUTH.VERIFY_EMAIL_PUBLIC, { email, code });
  }

  async resendVerification(email: string): Promise<void> {
    await apiClient.post(ENDPOINTS.AUTH.RESEND_VERIFICATION, { email });
  }

  async sendVerification(): Promise<void> {
    await apiClient.post(ENDPOINTS.AUTH.SEND_VERIFICATION);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, { currentPassword, newPassword });
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>(ENDPOINTS.AUTH.ME);
    return response.data;
  }

  // Two-Factor Authentication (2FA)
  async setup2FA(): Promise<TwoFactorSetupResponse> {
    const response = await apiClient.post<TwoFactorSetupResponse>(ENDPOINTS.AUTH.SETUP_2FA);
    return response.data;
  }

  async enable2FA(code: string): Promise<{ backupCodes: string[] }> {
    const response = await apiClient.post(ENDPOINTS.AUTH.ENABLE_2FA, { code });
    return response.data;
  }

  async disable2FA(code: string): Promise<void> {
    await apiClient.post(ENDPOINTS.AUTH.DISABLE_2FA, { code });
  }
}

export const authService = new AuthService();
export default authService;
