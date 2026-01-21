import { Request } from 'express';
import { Post, Comment } from '@prisma/client';

// Extended request with user info
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Pagination meta
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Media types
export interface Media {
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
  thumbnail?: string;
  width?: number;
  height?: number;
}

export interface CommentMedia {
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
}

// Post with extra fields
export interface PostWithStatus extends Post {
  isLiked: boolean;
  isSaved: boolean;
  sharedPost?: Post | null;
}

// Comment with extra fields
export interface CommentWithStatus extends Comment {
  isLiked: boolean;
  replies?: CommentWithStatus[];
}

// Create post input
export interface CreatePostInput {
  content: string;
  media?: Media[];
  feeling?: string;
  location?: string;
  taggedUserIds?: string[];
  privacy?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  groupId?: string;
}

// Update post input
export interface UpdatePostInput {
  content?: string;
  feeling?: string;
  location?: string;
  privacy?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
}

// Create comment input
export interface CreateCommentInput {
  content: string;
  media?: CommentMedia;
  parentId?: string;
}

// Share post input
export interface SharePostInput {
  content?: string;
}

// Report post input
export interface ReportPostInput {
  reason: string;
}
