import { LoginCredentials, RegisterData, AuthResponse, User } from '../../types';
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../../constants/api';

// Mock data for development
const mockUser: User = {
  id: '1',
  email: 'student@ptit.edu.vn',
  fullName: 'Nguyễn Văn A',
  studentId: 'B21DCCN001',
  avatar: 'https://i.pravatar.cc/150?img=1',
  coverPhoto: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800',
  bio: 'Sinh viên Công nghệ Thông tin - PTIT',
  faculty: 'Công nghệ Thông tin',
  className: 'D21CQCN01-B',
  phone: '0912345678',
  birthday: '2003-01-15',
  hometown: 'Hà Nội',
  currentCity: 'Hà Nội',
  relationship: 'single',
  gender: 'male',
  isOnline: true,
  isVerified: true,
  createdAt: '2023-09-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
  friendsCount: 256,
  followersCount: 128,
  followingCount: 89,
  postsCount: 42,
};

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // For development, return mock data
    // In production, uncomment the API call below

    // const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, credentials);
    // return response.data;

    // Mock implementation
    await this.simulateDelay();

    if (credentials.email === 'test@ptit.edu.vn' && credentials.password === '123456') {
      return {
        user: mockUser,
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
      };
    }

    // Simulate successful login for any valid-looking email
    if (credentials.email.includes('@') && credentials.password.length >= 6) {
      return {
        user: {
          ...mockUser,
          email: credentials.email,
          fullName: credentials.email.split('@')[0].replace(/[._]/g, ' '),
        },
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
      };
    }

    throw new Error('Email hoặc mật khẩu không đúng');
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    // const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.REGISTER, data);
    // return response.data;

    // Mock implementation
    await this.simulateDelay();

    return {
      user: {
        ...mockUser,
        id: Date.now().toString(),
        email: data.email,
        fullName: data.fullName,
        studentId: data.studentId,
        faculty: data.faculty,
        className: data.className,
        phone: data.phone,
        isVerified: false,
      },
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
    };
  }

  async logout(): Promise<void> {
    // await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
    await this.simulateDelay(500);
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // const response = await apiClient.post(ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken });
    // return response.data;

    await this.simulateDelay();
    return {
      accessToken: 'mock-new-access-token-' + Date.now(),
      refreshToken: 'mock-new-refresh-token-' + Date.now(),
    };
  }

  async forgotPassword(email: string): Promise<void> {
    // await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    await this.simulateDelay();
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // await apiClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, { token, newPassword });
    await this.simulateDelay();
  }

  async verifyEmail(email: string, code: string): Promise<void> {
    // await apiClient.post(ENDPOINTS.AUTH.VERIFY_EMAIL, { email, code });
    await this.simulateDelay();
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    // await apiClient.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, { currentPassword, newPassword });
    await this.simulateDelay();
  }

  async getCurrentUser(): Promise<User> {
    // const response = await apiClient.get<User>(ENDPOINTS.AUTH.ME);
    // return response.data;

    await this.simulateDelay();
    return mockUser;
  }

  private simulateDelay(ms: number = 1000): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const authService = new AuthService();
export default authService;
