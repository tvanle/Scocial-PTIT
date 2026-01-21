import mongoose, { Schema, Document } from 'mongoose';

export interface IConversationSettings extends Document {
  conversationId: string;
  userId: string;
  isMuted: boolean;
  mutedUntil?: Date;
  nickname?: string;
  isArchived: boolean;
  isPinned: boolean;
  unreadCount: number;
}

const ConversationSettingsSchema = new Schema<IConversationSettings>(
  {
    conversationId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    isMuted: {
      type: Boolean,
      default: false,
    },
    mutedUntil: {
      type: Date,
    },
    nickname: {
      type: String,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes
ConversationSettingsSchema.index({ conversationId: 1, userId: 1 }, { unique: true });

export const ConversationSettings = mongoose.model<IConversationSettings>(
  'ConversationSettings',
  ConversationSettingsSchema
);
