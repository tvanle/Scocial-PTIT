import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2000, 'Content must be at most 2000 characters'),
  media: z.object({
    url: z.string().url('Invalid URL'),
    type: z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'FILE']),
  }).optional(),
  parentId: z.string().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
