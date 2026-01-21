import mongoose, { Schema, Document } from 'mongoose';
import { ConversationType } from '../types';

export interface IConversation extends Document {
  type: ConversationType;
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
      enum: Object.values(ConversationType),
      required: true,
    },
    name: {
      type: String,
    },
    avatar: {
      type: String,
    },
    participantIds: [
      {
        type: String,
        required: true,
      },
    ],
    adminIds: [
      {
        type: String,
      },
    ],
    lastMessageId: {
      type: String,
    },
    lastMessageAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes
ConversationSchema.index({ participantIds: 1 });
ConversationSchema.index({ lastMessageAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
