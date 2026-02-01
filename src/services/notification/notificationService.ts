import { Notification, PaginatedResponse, PaginationParams } from '../../types';
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../../constants/api';

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  likes: boolean;
  comments: boolean;
  mentions: boolean;
  follows: boolean;
  groupInvites: boolean;
  messages: boolean;
}

class NotificationService {
  async getNotifications(params?: PaginationParams): Promise<PaginatedResponse<Notification>> {
    const response = await apiClient.get(ENDPOINTS.NOTIFICATION.LIST, { params });
    return response.data;
  }

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.NOTIFICATION.MARK_READ(notificationId));
  }

  async markAllAsRead(): Promise<void> {
    await apiClient.post(ENDPOINTS.NOTIFICATION.MARK_ALL_READ);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.NOTIFICATION.DELETE(notificationId));
  }

  async getSettings(): Promise<NotificationSettings> {
    const response = await apiClient.get(ENDPOINTS.NOTIFICATION.SETTINGS);
    return response.data;
  }

  async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const response = await apiClient.put(ENDPOINTS.NOTIFICATION.UPDATE_SETTINGS, settings);
    return response.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get(ENDPOINTS.NOTIFICATION.UNREAD_COUNT);
    return response.data.count;
  }

  async registerDevice(token: string, platform: 'ios' | 'android'): Promise<void> {
    await apiClient.post(ENDPOINTS.NOTIFICATION.REGISTER_DEVICE, { token, platform });
  }

  async unregisterDevice(): Promise<void> {
    await apiClient.delete(ENDPOINTS.NOTIFICATION.UNREGISTER_DEVICE);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
