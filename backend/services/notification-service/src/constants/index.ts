// Success messages
export const SUCCESS_MESSAGES = {
  NOTIFICATION_READ: 'Notification marked as read',
  ALL_NOTIFICATIONS_READ: 'All notifications marked as read',
  NOTIFICATION_DELETED: 'Notification deleted successfully',
  ALL_NOTIFICATIONS_CLEARED: 'All notifications cleared successfully',
  DEVICE_TOKEN_REGISTERED: 'Device token registered successfully',
  DEVICE_TOKEN_REMOVED: 'Device token removed successfully',
  SETTINGS_UPDATED: 'Notification settings updated successfully',
  NOTIFICATION_CREATED: 'Notification created successfully',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  NOTIFICATION_NOT_FOUND: 'Notification not found',
  INVALID_NOTIFICATION_ID: 'Invalid notification ID',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  INVALID_TOKEN_OR_PLATFORM: 'Token and platform are required',
  FAILED_TO_GET_NOTIFICATIONS: 'Failed to get notifications',
  FAILED_TO_GET_UNREAD_COUNT: 'Failed to get unread count',
  FAILED_TO_MARK_AS_READ: 'Failed to mark notification as read',
  FAILED_TO_MARK_ALL_AS_READ: 'Failed to mark all notifications as read',
  FAILED_TO_DELETE_NOTIFICATION: 'Failed to delete notification',
  FAILED_TO_CLEAR_NOTIFICATIONS: 'Failed to clear all notifications',
  FAILED_TO_REGISTER_TOKEN: 'Failed to register device token',
  FAILED_TO_REMOVE_TOKEN: 'Failed to remove device token',
  FAILED_TO_GET_SETTINGS: 'Failed to get notification settings',
  FAILED_TO_UPDATE_SETTINGS: 'Failed to update notification settings',
  FAILED_TO_CREATE_NOTIFICATION: 'Failed to create notification',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  NOTIFICATION_DISABLED: 'Notification disabled by user settings',
  AUTHENTICATION_ERROR: 'Authentication error',
  INVALID_PAGE_OR_LIMIT: 'Invalid page or limit parameter',
} as const;

// Notification type to settings key mapping
export const NOTIFICATION_TYPE_SETTINGS_MAP = {
  LIKE_POST: 'likePosts',
  COMMENT_POST: 'comments',
  SHARE_POST: 'shares',
  FOLLOW: 'follows',
  FRIEND_REQUEST: 'friendRequests',
  FRIEND_ACCEPT: 'friendRequests',
  MENTION: 'mentions',
  GROUP_INVITE: 'groupActivity',
  GROUP_JOIN_REQUEST: 'groupActivity',
  GROUP_POST: 'groupActivity',
  MESSAGE: 'messages',
  SYSTEM: 'pushEnabled',
} as const;

// Socket events
export const SOCKET_EVENTS = {
  NEW_NOTIFICATION: 'new_notification',
  NOTIFICATION_READ: 'notification_read',
  DISCONNECT: 'disconnect',
} as const;

// Default values
export const DEFAULTS = {
  PAGINATION: {
    PAGE: 1,
    LIMIT: 20,
    MAX_LIMIT: 100,
  },
} as const;
