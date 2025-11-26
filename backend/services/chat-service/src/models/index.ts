import mongoose, { Schema, Document } from 'mongoose';

// Conversation Schema
export interface IConversation extends Document {
  type: 'PRIVATE' | 'GROUP';
  name?: string;
  avatar?: string;
  participantIds: string[];
  adminIds: string[];
  lastMessageId?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    type: {
      type: String,
      enum: ['PRIVATE', 'GROUP'],
      required: true,
    },
    name: String,
    avatar: String,
    participantIds: [{
      type: String,
      required: true,
    }],
    adminIds: [String],
    lastMessageId: String,
    lastMessageAt: Date,
  },
  { timestamps: true }
);

ConversationSchema.index({ participantIds: 1 });
ConversationSchema.index({ lastMessageAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);

// Message Schema
export interface IMessage extends Document {
  conversationId: string;
  senderId: string;
  content?: string;
  media?: Array<{
    url: string;
    type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
    thumbnail?: string;
    filename?: string;
    size?: number;
  }>;
  replyToId?: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'STICKER' | 'SYSTEM';
  status: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  readBy: string[];
  deletedFor: string[];
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    content: String,
    media: [{
      url: String,
      type: {
        type: String,
        enum: ['IMAGE', 'VIDEO', 'AUDIO', 'FILE'],
      },
      thumbnail: String,
      filename: String,
      size: Number,
    }],
    replyToId: String,
    type: {
      type: String,
      enum: ['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'STICKER', 'SYSTEM'],
      default: 'TEXT',
    },
    status: {
      type: String,
      enum: ['SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'],
      default: 'SENT',
    },
    readBy: [String],
    deletedFor: [String],
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);

// Conversation Member Settings
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
    mutedUntil: Date,
    nickname: String,
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

ConversationSettingsSchema.index({ conversationId: 1, userId: 1 }, { unique: true });

export const ConversationSettings = mongoose.model<IConversationSettings>(
  'ConversationSettings',
  ConversationSettingsSchema
);
