import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  birthday: z.string().optional(),
  hometown: z.string().optional(),
  currentCity: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'NOT_SPECIFIED']).optional(),
  relationship: z.enum(['SINGLE', 'IN_RELATIONSHIP', 'ENGAGED', 'MARRIED', 'COMPLICATED', 'NOT_SPECIFIED']).optional(),
});

export const avatarUrlSchema = z.object({
  url: z.string().url('Invalid URL'),
});

export const coverUrlSchema = z.object({
  url: z.string().url('Invalid URL'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
