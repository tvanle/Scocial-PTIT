/**
 * Push Notification Service
 *
 * Handles push notification registration, permissions, and listeners
 * using expo-notifications
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import notificationService from '../notification/notificationService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationData {
  type: 'match' | 'like' | 'super_like' | 'message' | 'general';
  targetId?: string;
  userId?: string;
  fromUserId?: string;
  conversationId?: string;
  matchedUserId?: string;
  title?: string;
  body?: string;
}

class PushNotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  /**
   * Initialize push notifications
   * Should be called when app starts and user is authenticated
   */
  async initialize(): Promise<string | null> {
    try {
      // Check and request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Push] Permission not granted');
        return null;
      }

      // Get push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      if (!projectId) {
        console.log('[Push] No project ID found');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = tokenData.data;
      console.log('[Push] Token:', this.expoPushToken);

      // Register device with backend
      await this.registerDeviceWithBackend();

      // Set up Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF4458',
        });

        await Notifications.setNotificationChannelAsync('dating', {
          name: 'Dating',
          description: 'Thong bao hen ho - match, like, tin nhan',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF4458',
        });
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('[Push] Initialize error:', error);
      return null;
    }
  }

  /**
   * Register device token with backend
   */
  private async registerDeviceWithBackend(): Promise<void> {
    if (!this.expoPushToken) return;

    try {
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      await notificationService.registerDevice(this.expoPushToken, platform);
      console.log('[Push] Device registered with backend');
    } catch (error) {
      console.error('[Push] Failed to register device:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  setupListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void,
  ): void {
    // Listener for when notification is received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Push] Notification received:', notification);
      onNotificationReceived?.(notification);
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[Push] Notification response:', response);
      onNotificationResponse?.(response);
    });
  }

  /**
   * Remove notification listeners
   */
  removeListeners(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
  }

  /**
   * Unregister device from backend (on logout)
   */
  async unregister(): Promise<void> {
    try {
      await notificationService.unregisterDevice();
      this.expoPushToken = null;
      this.removeListeners();
      console.log('[Push] Device unregistered');
    } catch (error) {
      console.error('[Push] Unregister error:', error);
    }
  }

  /**
   * Get current push token
   */
  getToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Check if push notifications are enabled
   */
  async checkPermission(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Request push notification permission
   */
  async requestPermission(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
    await this.setBadgeCount(0);
  }

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: PushNotificationData,
    seconds: number = 1,
  ): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data as any,
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false },
    });
    return id;
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
