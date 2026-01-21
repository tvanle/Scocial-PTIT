import { Request } from 'express';

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
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// User profile response
export interface UserProfileResponse {
  id: string;
  email: string;
  fullName: string;
  avatar?: string | null;
  coverPhoto?: string | null;
  bio?: string | null;
  studentId?: string | null;
  faculty?: string | null;
  className?: string | null;
  phone?: string | null;
  birthday?: Date | null;
  hometown?: string | null;
  currentCity?: string | null;
  gender?: string | null;
  relationship?: string | null;
  isVerified: boolean;
  friendsCount: number;
  followersCount: number;
  followingCount: number;
  isFriend?: boolean;
  isFollowing?: boolean;
  friendRequestSent?: boolean;
  friendRequestReceived?: boolean;
}

// Update profile input
export interface UpdateProfileInput {
  fullName?: string;
  bio?: string;
  phone?: string;
  birthday?: string;
  hometown?: string;
  currentCity?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'NOT_SPECIFIED';
  relationship?: 'SINGLE' | 'IN_RELATIONSHIP' | 'ENGAGED' | 'MARRIED' | 'COMPLICATED' | 'NOT_SPECIFIED';
}
