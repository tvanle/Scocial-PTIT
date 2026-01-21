import { Request } from 'express';
import { Socket } from 'socket.io';

// Extend Express Request to include user info
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Extend Socket.io Socket to include user info
export interface AuthenticatedSocket extends Socket {
  userId?: string;
}

// Message types
export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  FILE = 'FILE',
  STICKER = 'STICKER',
  SYSTEM = 'SYSTEM',
}

// Message status
export enum MessageStatus {
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

// Conversation types
export enum ConversationType {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP',
}

// Media types
export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  FILE = 'FILE',
}

// Media interface
export interface IMedia {
  url: string;
  type: MediaType;
  thumbnail?: string;
  filename?: string;
  size?: number;
}

// Pagination
export interface PaginationQuery {
  page?: string;
  limit?: string;
  before?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface MessagePaginationMeta {
  total: number;
  hasMore: boolean;
  oldestMessageDate: Date | null;
}

// Socket event data types
export interface SendMessageData {
  conversationId: string;
  content?: string;
  media?: IMedia[];
  replyToId?: string;
  type?: MessageType;
}

export interface TypingData {
  conversationId: string;
  isTyping: boolean;
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}
