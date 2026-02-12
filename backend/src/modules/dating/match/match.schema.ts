import { z } from 'zod';

export const matchQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, 'page phải là số').optional(),
  limit: z.string().regex(/^\d+$/, 'limit phải là số').optional(),
});

export const matchParamsSchema = z.object({
  id: z.string().uuid('ID kết nối không hợp lệ'),
});

export type MatchQuery = z.infer<typeof matchQuerySchema>;
export type MatchParams = z.infer<typeof matchParamsSchema>;
