import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must be at most 100 characters'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  privacy: z.enum(['PUBLIC', 'PRIVATE', 'SECRET']).default('PUBLIC'),
  rules: z.string().max(2000, 'Rules must be at most 2000 characters').optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  coverPhoto: z.string().url().optional(),
  privacy: z.enum(['PUBLIC', 'PRIVATE', 'SECRET']).optional(),
  rules: z.string().max(2000).optional(),
  location: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  requireApproval: z.boolean().optional(),
  allowMemberPosts: z.boolean().optional(),
  allowMemberInvites: z.boolean().optional(),
});

export const joinGroupSchema = z.object({
  message: z.string().max(500).optional(),
});

export const handleJoinRequestSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    required_error: 'Action is required',
    invalid_type_error: 'Action must be either approve or reject',
  }),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['MEMBER', 'MODERATOR', 'ADMIN', 'OWNER'], {
    required_error: 'Role is required',
  }),
});

export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).default('1'),
  limit: z.string().regex(/^\d+$/).default('20'),
});

export const groupFiltersSchema = paginationSchema.extend({
  search: z.string().optional(),
  category: z.string().optional(),
});

export const memberFiltersSchema = paginationSchema.extend({
  role: z.enum(['MEMBER', 'MODERATOR', 'ADMIN', 'OWNER']).optional(),
});
