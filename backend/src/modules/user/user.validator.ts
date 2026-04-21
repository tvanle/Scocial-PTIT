import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  favoriteMusic: z.string().max(100).optional().nullable(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  phone: z.string().optional(),
  faculty: z.string().optional(),
  className: z.string().optional(),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid(),
});

export const searchUsersSchema = z.object({
  q: z.string().min(1),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
