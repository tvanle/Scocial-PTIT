import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { GATEWAY_URL, API_CONFIG } from '../../constants/api';
import { useAuthStore } from '../../store/slices/authSlice';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: GATEWAY_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const { accessToken } = useAuthStore.getState();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshTokenValue } = useAuthStore.getState();

        if (refreshTokenValue) {
          await useAuthStore.getState().refreshToken();
          const { accessToken } = useAuthStore.getState();

          if (accessToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, logout user
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const errorMessage = getErrorMessage(error);
    return Promise.reject(new Error(errorMessage));
  }
);

// Helper function to extract error message
function getErrorMessage(error: AxiosError): string {
  if (error.response?.data) {
    const data = error.response.data as { message?: string; error?: string };
    return data.message || data.error || 'Có lỗi xảy ra';
  }

  if (error.code === 'ECONNABORTED') {
    return 'Kết nối quá thời gian, vui lòng thử lại';
  }

  if (!error.response) {
    return 'Không thể kết nối đến server';
  }

  switch (error.response.status) {
    case 400:
      return 'Yêu cầu không hợp lệ';
    case 401:
      return 'Phiên đăng nhập hết hạn';
    case 403:
      return 'Bạn không có quyền thực hiện thao tác này';
    case 404:
      return 'Không tìm thấy dữ liệu';
    case 409:
      return 'Dữ liệu đã tồn tại';
    case 422:
      return 'Dữ liệu không hợp lệ';
    case 429:
      return 'Quá nhiều yêu cầu, vui lòng thử lại sau';
    case 500:
      return 'Lỗi máy chủ, vui lòng thử lại sau';
    default:
      return 'Có lỗi xảy ra';
  }
}

export default apiClient;
