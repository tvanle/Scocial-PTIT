import mongoose, { Schema } from 'mongoose';
import { INotification } from '../types';

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
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
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    data: {
      senderId: String,
      senderName: String,
      senderAvatar: String,
      postId: String,
      commentId: String,
      groupId: String,
      conversationId: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
