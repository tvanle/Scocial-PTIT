import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string().max(5000).optional(),
  privacy: z.enum(['PUBLIC', 'FOLLOWERS', 'PRIVATE']).default('PUBLIC'),
});

export const updatePostSchema = z.object({
  content: z.string().max(5000).optional(),
  privacy: z.enum(['PUBLIC', 'FOLLOWERS', 'PRIVATE']).optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(),
});

export const postIdParamSchema = z.object({
  postId: z.string().uuid(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
