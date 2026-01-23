import mongoose, { Schema, Document } from 'mongoose';

// Message interface
export interface IMessage extends Document {
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'file';
  mediaUrl?: string;
  isRead: boolean;
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Conversation interface
export interface IConversation extends Document {
  type: 'private' | 'group';
  participants: string[];
  name?: string;
  avatar?: string;
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Message Schema
const messageSchema = new Schema<IMessage>(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'image', 'video', 'file'], default: 'text' },
    mediaUrl: { type: String },
    isRead: { type: Boolean, default: false },
    readBy: [{ type: String }],
  },
  { timestamps: true }
);

// Conversation Schema
const conversationSchema = new Schema<IConversation>(
  {
    type: { type: String, enum: ['private', 'group'], default: 'private' },
    participants: [{ type: String, required: true }],
    name: { type: String },
    avatar: { type: String },
    lastMessage: {
      content: String,
      senderId: String,
      createdAt: Date,
    },
  },
  { timestamps: true }
);

// Indexes
messageSchema.index({ conversationId: 1, createdAt: -1 });
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
