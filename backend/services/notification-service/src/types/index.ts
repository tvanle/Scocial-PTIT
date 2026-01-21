import { Document } from 'mongoose';

// Notification types
export type NotificationType =
  | 'LIKE_POST'
  | 'COMMENT_POST'
  | 'SHARE_POST'
  | 'FOLLOW'
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPT'
  | 'MENTION'
  | 'GROUP_INVITE'
  | 'GROUP_JOIN_REQUEST'
  | 'GROUP_POST'
  | 'MESSAGE'
  | 'SYSTEM';

// Notification data interface
export interface NotificationData {
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  postId?: string;
  commentId?: string;
  groupId?: string;
  conversationId?: string;
  [key: string]: any;
}

// Notification interface
export interface INotification extends Document {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: NotificationData;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Device token interface
export interface IDeviceToken extends Document {
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  isActive: boolean;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Notification settings interface
export interface INotificationSettings extends Document {
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  // Granular settings
  likePosts: boolean;
  comments: boolean;
  shares: boolean;
  follows: boolean;
  friendRequests: boolean;
  groupActivity: boolean;
  mentions: boolean;
  messages: boolean;
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs (Data Transfer Objects)
export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: NotificationData;
}

export interface RegisterDeviceTokenDto {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

export interface UpdateNotificationSettingsDto {
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  likePosts?: boolean;
  comments?: boolean;
  shares?: boolean;
  follows?: boolean;
  friendRequests?: boolean;
  groupActivity?: boolean;
  mentions?: boolean;
  messages?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface GetNotificationsQuery extends PaginationQuery {
  unreadOnly?: string;
}

// API Response types
export interface PaginationMeta {
  total: number;
  unreadCount?: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Socket.io types
export interface SocketWithUser {
  userId: string;
  handshake: {
    auth: {
      userId: string;
    };
  };
  join: (room: string) => void;
  on: (event: string, callback: () => void) => void;
}

// Push notification result
export interface PushNotificationResult {
  notification: INotification;
  pushSent: boolean;
  reason?: string;
}
