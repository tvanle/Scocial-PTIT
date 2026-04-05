/**
 * Dating Settings Service
 *
 * Handles dating-specific settings like notification preferences and privacy
 */

import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  NOTIFICATION_MATCHES: 'dating_notif_matches',
  NOTIFICATION_LIKES: 'dating_notif_likes',
  NOTIFICATION_MESSAGES: 'dating_notif_messages',
  PRIVACY_SHOW_DISTANCE: 'dating_privacy_distance',
  PRIVACY_SHOW_ACTIVE: 'dating_privacy_active',
} as const;

export interface DatingNotificationSettings {
  matches: boolean;
  likes: boolean;
  messages: boolean;
}

export interface DatingPrivacySettings {
  showDistance: boolean;
  showActiveStatus: boolean;
}

export interface DatingSettings {
  notifications: DatingNotificationSettings;
  privacy: DatingPrivacySettings;
}

const DEFAULT_SETTINGS: DatingSettings = {
  notifications: {
    matches: true,
    likes: true,
    messages: true,
  },
  privacy: {
    showDistance: true,
    showActiveStatus: true,
  },
};

class DatingSettingsService {
  /**
   * Get all dating settings
   */
  async getSettings(): Promise<DatingSettings> {
    try {
      const [
        matchesStr,
        likesStr,
        messagesStr,
        distanceStr,
        activeStr,
      ] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.NOTIFICATION_MATCHES),
        SecureStore.getItemAsync(STORAGE_KEYS.NOTIFICATION_LIKES),
        SecureStore.getItemAsync(STORAGE_KEYS.NOTIFICATION_MESSAGES),
        SecureStore.getItemAsync(STORAGE_KEYS.PRIVACY_SHOW_DISTANCE),
        SecureStore.getItemAsync(STORAGE_KEYS.PRIVACY_SHOW_ACTIVE),
      ]);

      return {
        notifications: {
          matches: matchesStr !== null ? matchesStr === 'true' : DEFAULT_SETTINGS.notifications.matches,
          likes: likesStr !== null ? likesStr === 'true' : DEFAULT_SETTINGS.notifications.likes,
          messages: messagesStr !== null ? messagesStr === 'true' : DEFAULT_SETTINGS.notifications.messages,
        },
        privacy: {
          showDistance: distanceStr !== null ? distanceStr === 'true' : DEFAULT_SETTINGS.privacy.showDistance,
          showActiveStatus: activeStr !== null ? activeStr === 'true' : DEFAULT_SETTINGS.privacy.showActiveStatus,
        },
      };
    } catch (error) {
      console.error('[DatingSettings] Get error:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings: Partial<DatingNotificationSettings>): Promise<void> {
    try {
      const promises: Promise<void>[] = [];

      if (settings.matches !== undefined) {
        promises.push(SecureStore.setItemAsync(STORAGE_KEYS.NOTIFICATION_MATCHES, String(settings.matches)));
      }
      if (settings.likes !== undefined) {
        promises.push(SecureStore.setItemAsync(STORAGE_KEYS.NOTIFICATION_LIKES, String(settings.likes)));
      }
      if (settings.messages !== undefined) {
        promises.push(SecureStore.setItemAsync(STORAGE_KEYS.NOTIFICATION_MESSAGES, String(settings.messages)));
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('[DatingSettings] Update notification error:', error);
      throw error;
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(settings: Partial<DatingPrivacySettings>): Promise<void> {
    try {
      const promises: Promise<void>[] = [];

      if (settings.showDistance !== undefined) {
        promises.push(SecureStore.setItemAsync(STORAGE_KEYS.PRIVACY_SHOW_DISTANCE, String(settings.showDistance)));
      }
      if (settings.showActiveStatus !== undefined) {
        promises.push(SecureStore.setItemAsync(STORAGE_KEYS.PRIVACY_SHOW_ACTIVE, String(settings.showActiveStatus)));
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('[DatingSettings] Update privacy error:', error);
      throw error;
    }
  }

  /**
   * Check if notifications are enabled for a specific type
   */
  async isNotificationEnabled(type: keyof DatingNotificationSettings): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.notifications[type];
  }

  /**
   * Check if distance should be shown
   */
  async shouldShowDistance(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.privacy.showDistance;
  }

  /**
   * Reset all settings to defaults
   */
  async resetToDefaults(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.NOTIFICATION_MATCHES),
        SecureStore.deleteItemAsync(STORAGE_KEYS.NOTIFICATION_LIKES),
        SecureStore.deleteItemAsync(STORAGE_KEYS.NOTIFICATION_MESSAGES),
        SecureStore.deleteItemAsync(STORAGE_KEYS.PRIVACY_SHOW_DISTANCE),
        SecureStore.deleteItemAsync(STORAGE_KEYS.PRIVACY_SHOW_ACTIVE),
      ]);
    } catch (error) {
      console.error('[DatingSettings] Reset error:', error);
    }
  }
}

export const datingSettingsService = new DatingSettingsService();
export default datingSettingsService;
