import { z } from 'zod';

const pollOptionSchema = z.object({
  text: z.string().min(1).max(100),
  order: z.number().int().min(0).optional(),
});

const pollSchema = z.object({
  question: z.string().max(200).optional(),
  options: z.array(pollOptionSchema).min(2).max(4),
});

export const createPostSchema = z.object({
  content: z.string().max(5000).optional(),
  privacy: z.enum(['PUBLIC', 'FOLLOWERS', 'PRIVATE']).default('PUBLIC'),
  mediaIds: z.array(z.string().uuid()).optional(),
  // Location fields
  locationName: z.string().max(200).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  // Poll
  poll: pollSchema.optional(),
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
