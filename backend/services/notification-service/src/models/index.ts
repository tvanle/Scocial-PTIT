import mongoose, { Schema, Document } from 'mongoose';

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

export interface INotification extends Document {
  userId: string; // Recipient
  type: NotificationType;
  title: string;
  body: string;
  data: {
    senderId?: string;
    senderName?: string;
    senderAvatar?: string;
    postId?: string;
    commentId?: string;
    groupId?: string;
    conversationId?: string;
    [key: string]: any;
  };
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: [
        'LIKE_POST',
        'COMMENT_POST',
        'SHARE_POST',
        'FOLLOW',
        'FRIEND_REQUEST',
        'FRIEND_ACCEPT',
        'MENTION',
        'GROUP_INVITE',
        'GROUP_JOIN_REQUEST',
        'GROUP_POST',
        'MESSAGE',
        'SYSTEM',
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: {
      senderId: String,
      senderName: String,
      senderAvatar: String,
      postId: String,
      commentId: String,
      groupId: String,
      conversationId: String,
    },
    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

// Device token for push notifications
export interface IDeviceToken extends Document {
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  isActive: boolean;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceTokenSchema = new Schema<IDeviceToken>(
  {
    userId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web'],
      required: true,
    },
    isActive: { type: Boolean, default: true },
    lastUsedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const DeviceToken = mongoose.model<IDeviceToken>('DeviceToken', DeviceTokenSchema);

// Notification settings
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
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSettingsSchema = new Schema<INotificationSettings>(
  {
    userId: { type: String, required: true, unique: true },
    pushEnabled: { type: Boolean, default: true },
    emailEnabled: { type: Boolean, default: true },
    likePosts: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    shares: { type: Boolean, default: true },
    follows: { type: Boolean, default: true },
    friendRequests: { type: Boolean, default: true },
    groupActivity: { type: Boolean, default: true },
    mentions: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    quietHoursEnabled: { type: Boolean, default: false },
    quietHoursStart: String,
    quietHoursEnd: String,
  },
  {
    timestamps: true,
  }
);

export const NotificationSettings = mongoose.model<INotificationSettings>(
  'NotificationSettings',
  NotificationSettingsSchema
);
