import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content must be at most 5000 characters'),
  media: z.array(z.object({
    url: z.string().url('Invalid URL'),
    type: z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'FILE']),
    thumbnail: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  })).optional(),
  feeling: z.string().optional(),
  location: z.string().optional(),
  taggedUserIds: z.array(z.string()).optional(),
  privacy: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']).default('PUBLIC'),
  groupId: z.string().optional(),
});

export const updatePostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content must be at most 5000 characters').optional(),
  feeling: z.string().optional(),
  location: z.string().optional(),
  privacy: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']).optional(),
});

export const sharePostSchema = z.object({
  content: z.string().max(5000, 'Content must be at most 5000 characters').optional(),
});

export const reportPostSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type SharePostInput = z.infer<typeof sharePostSchema>;
export type ReportPostInput = z.infer<typeof reportPostSchema>;
