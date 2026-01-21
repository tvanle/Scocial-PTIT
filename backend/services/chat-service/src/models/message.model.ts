import mongoose, { Schema, Document } from 'mongoose';
import { MessageType, MessageStatus, MediaType, IMedia } from '../types';

export interface IMessage extends Document {
  conversationId: string;
  senderId: string;
  content?: string;
  media?: IMedia[];
  replyToId?: string;
  type: MessageType;
  status: MessageStatus;
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
    content: {
      type: String,
    },
    media: [
      {
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: Object.values(MediaType),
          required: true,
        },
        thumbnail: String,
        filename: String,
        size: Number,
      },
    ],
    replyToId: {
      type: String,
    },
    type: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT,
    },
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      default: MessageStatus.SENT,
    },
    readBy: [
      {
        type: String,
      },
    ],
    deletedFor: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

// Indexes
MessageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
