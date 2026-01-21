import { Notification, NotificationSettings, DeviceToken } from '../models';
import {
  CreateNotificationDto,
  GetNotificationsQuery,
  PaginatedResponse,
  INotification,
  UpdateNotificationSettingsDto,
  RegisterDeviceTokenDto,
  NotificationType,
  PushNotificationResult,
} from '../types';
import { NOTIFICATION_TYPE_SETTINGS_MAP, DEFAULTS } from '../constants';
import { sendPushNotification } from './push-notification.service';

export class NotificationService {
  async getNotifications(
    userId: string,
    query: GetNotificationsQuery
  ): Promise<PaginatedResponse<INotification>> {
    const page = parseInt(query.page || String(DEFAULTS.PAGINATION.PAGE), 10);
    const limit = parseInt(query.limit || String(DEFAULTS.PAGINATION.LIMIT), 10);
    const unreadOnly = query.unreadOnly === 'true';

    const skip = (page - 1) * limit;

    const filter: any = { userId };
    if (unreadOnly) {
      filter.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await Notification.countDocuments({ userId, isRead: false });
  }

  async markAsRead(userId: string, notificationId: string): Promise<INotification | null> {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany({ userId, isRead: false }, { isRead: true, readAt: new Date() });
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    await Notification.findOneAndDelete({ _id: notificationId, userId });
  }

  async clearAllNotifications(userId: string): Promise<void> {
    await Notification.deleteMany({ userId });
  }

  async registerDeviceToken(userId: string, dto: RegisterDeviceTokenDto): Promise<void> {
    const { token, platform } = dto;

    // Deactivate old tokens with same value for different users
    await DeviceToken.updateMany({ token, userId: { $ne: userId } }, { isActive: false });

    // Upsert device token
    await DeviceToken.findOneAndUpdate(
      { userId, token },
      { userId, token, platform, isActive: true, lastUsedAt: new Date() },
      { upsert: true }
    );
  }

  async removeDeviceToken(userId: string, token: string): Promise<void> {
    await DeviceToken.findOneAndUpdate({ userId, token }, { isActive: false });
  }

  async getNotificationSettings(userId: string) {
    let settings = await NotificationSettings.findOne({ userId });

    if (!settings) {
      settings = await NotificationSettings.create({ userId });
    }

    return settings;
  }

  async updateNotificationSettings(userId: string, updates: UpdateNotificationSettingsDto) {
    return await NotificationSettings.findOneAndUpdate({ userId }, { ...updates }, { new: true, upsert: true });
  }

  async createNotification(dto: CreateNotificationDto, io?: any): Promise<PushNotificationResult> {
    const { userId, type, title, body, data } = dto;

    // Check user's notification settings
    const settings = await NotificationSettings.findOne({ userId });

    // Check if this type of notification is enabled
    if (settings) {
      const settingKey = NOTIFICATION_TYPE_SETTINGS_MAP[type as NotificationType];
      if (settingKey && (settings as any)[settingKey] === false) {
        // Still create notification but don't send push
        const notification = await Notification.create({ userId, type, title, body, data });
        return {
          notification,
          pushSent: false,
          reason: 'notification_disabled',
        };
      }

      // Check quiet hours
      if (settings.quietHoursEnabled && settings.quietHoursStart && settings.quietHoursEnd) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        if (currentTime >= settings.quietHoursStart && currentTime <= settings.quietHoursEnd) {
          // Still save notification but don't send push
          const notification = await Notification.create({ userId, type, title, body, data });
          return {
            notification,
            pushSent: false,
            reason: 'quiet_hours',
          };
        }
      }
    }

    // Create notification
    const notification = await Notification.create({
      userId,
      type,
      title,
      body,
      data,
    });

    // Send push notification
    const pushSent = await sendPushNotification(userId, title, body, data);

    // Emit socket event
    if (io) {
      io.to(`user:${userId}`).emit('new_notification', notification);
    }

    return {
      notification,
      pushSent,
    };
  }
}
