import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content must be at most 5000 characters'),
  media: z
    .array(
      z.object({
        url: z.string().url('Invalid media URL'),
        type: z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'FILE'], {
          required_error: 'Media type is required',
        }),
      })
    )
    .optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2000, 'Content must be at most 2000 characters'),
  parentId: z.string().uuid().optional(),
});
