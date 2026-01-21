import { GroupPrivacy, MemberRole, JoinRequestStatus } from '@prisma/client';

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface CreateGroupData {
  name: string;
  description?: string;
  privacy?: GroupPrivacy;
  rules?: string;
  category?: string;
  tags?: string[];
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  avatar?: string;
  coverPhoto?: string;
  privacy?: GroupPrivacy;
  rules?: string;
  location?: string;
  category?: string;
  tags?: string[];
  requireApproval?: boolean;
  allowMemberPosts?: boolean;
  allowMemberInvites?: boolean;
}

export interface GroupFilters {
  search?: string;
  category?: string;
}

export interface CreateGroupPostData {
  content: string;
  media?: Array<{
    url: string;
    type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
  }>;
}

export interface CreateCommentData {
  content: string;
  parentId?: string;
}

export interface JoinGroupData {
  message?: string;
}

export interface HandleJoinRequestData {
  action: 'approve' | 'reject';
}

export interface UpdateMemberRoleData {
  role: MemberRole;
}

export interface AuthRequest {
  userId?: string;
}

export { GroupPrivacy, MemberRole, JoinRequestStatus };
