// Shared types for all microservices

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  coverPhoto?: string;
  bio?: string;
  studentId?: string;
  faculty?: string;
  className?: string;
  phone?: string;
  birthday?: string;
  hometown?: string;
  currentCity?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'NOT_SPECIFIED';
  relationship?: 'SINGLE' | 'IN_RELATIONSHIP' | 'ENGAGED' | 'MARRIED' | 'COMPLICATED' | 'NOT_SPECIFIED';
  isVerified: boolean;
  isOnline: boolean;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  media?: Media[];
  feeling?: string;
  location?: string;
  taggedUserIds?: string[];
  privacy: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  groupId?: string;
  sharedPostId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Media {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
  thumbnail?: string;
  width?: number;
  height?: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  media?: Media;
  parentId?: string;
  likesCount: number;
  repliesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  type: 'PRIVATE' | 'GROUP';
  name?: string;
  avatar?: string;
  participantIds: string[];
  lastMessageId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  media?: Media[];
  replyToId?: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'STICKER' | 'SYSTEM';
  status: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  readBy: string[];
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  actorId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'LIKE_POST'
  | 'COMMENT_POST'
  | 'SHARE_POST'
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPTED'
  | 'MENTION'
  | 'TAG'
  | 'GROUP_INVITE'
  | 'GROUP_POST'
  | 'MESSAGE'
  | 'SYSTEM';

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  coverPhoto?: string;
  privacy: 'PUBLIC' | 'PRIVATE';
  membersCount: number;
  postsCount: number;
  rules?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
  joinedAt: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  createdAt: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
  };
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}
