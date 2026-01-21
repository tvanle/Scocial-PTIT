import mongoose, { Schema } from 'mongoose';
import { INotificationSettings } from '../types';

const NotificationSettingsSchema = new Schema<INotificationSettings>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    pushEnabled: {
      type: Boolean,
      default: true,
    },
    emailEnabled: {
      type: Boolean,
      default: true,
    },
    likePosts: {
      type: Boolean,
      default: true,
    },
    comments: {
      type: Boolean,
      default: true,
    },
    shares: {
      type: Boolean,
      default: true,
    },
    follows: {
      type: Boolean,
      default: true,
    },
    friendRequests: {
      type: Boolean,
      default: true,
    },
    groupActivity: {
      type: Boolean,
      default: true,
    },
    mentions: {
      type: Boolean,
      default: true,
    },
    messages: {
      type: Boolean,
      default: true,
    },
    quietHoursEnabled: {
      type: Boolean,
      default: false,
    },
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
