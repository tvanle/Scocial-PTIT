import { z } from 'zod';

// Helper để validate age >= 18 (DISABLED - skip age verification)
const validateAge = (dateOfBirth: Date | null | undefined): boolean => {
  return true; // Skip age verification
};

// Create dating profile
export const createDatingProfileSchema = z.object({
  bio: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự').max(500, 'Mô tả tối đa 500 ký tự'),
});

// Update dating profile
export const updateDatingProfileSchema = z.object({
  bio: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự').max(500, 'Mô tả tối đa 500 ký tự').optional(),
  isActive: z.boolean().optional(),
});

// Add photo
export const addPhotoSchema = z.object({
  url: z.string().url('URL không hợp lệ'),
  order: z.number().int().min(0).max(5, 'Thứ tự phải từ 0 đến 5').optional(),
});

// Replace photo (required order)
export const replacePhotoSchema = z.object({
  url: z.string().url('URL không hợp lệ'),
  order: z.number().int().min(0).max(5, 'Thứ tự phải từ 0 đến 5'),
});

// Update prompts (max 3)
export const updatePromptsSchema = z.object({
  prompts: z
    .array(
      z.object({
        question: z.string().min(1, 'Câu hỏi không được để trống').max(200, 'Câu hỏi tối đa 200 ký tự'),
        answer: z.string().min(1, 'Câu trả lời không được để trống').max(500, 'Câu trả lời tối đa 500 ký tự'),
      })
    )
    .max(3, 'Tối đa 3 câu hỏi')
    .optional(),
});

// Update lifestyle
export const updateLifestyleSchema = z.object({
  education: z.string().max(100, 'Học vấn tối đa 100 ký tự').optional(),
  job: z.string().max(100, 'Nghề nghiệp tối đa 100 ký tự').optional(),
  smoking: z.enum(['NEVER', 'SOMETIMES', 'REGULARLY']).optional(),
  drinking: z.enum(['NEVER', 'SOMETIMES', 'REGULARLY']).optional(),
  exercise: z.enum(['NEVER', 'SOMETIMES', 'REGULARLY']).optional(),
  height: z.number().int().min(100).max(250).optional(),
  religion: z.string().max(50, 'Tôn giáo tối đa 50 ký tự').optional(),
});

// Update preferences
export const updatePreferencesSchema = z
  .object({
    ageMin: z.number().int().min(18).max(99),
    ageMax: z.number().int().min(18).max(99),
    maxDistance: z.number().int().min(1).max(500, 'Khoảng cách tối đa 500 km').nullable().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).nullable().optional(),
    preferredMajors: z.array(z.string()).optional(),
    sameYearOnly: z.boolean().optional(),
  })
  .refine((data) => data.ageMin <= data.ageMax, {
    message: 'Độ tuổi tối thiểu phải nhỏ hơn hoặc bằng độ tuổi tối đa',
    path: ['ageMin'],
  });

// Photo ID param
export const photoIdParamSchema = z.object({
  id: z.string().uuid('ID ảnh không hợp lệ'),
});

// User ID param (view profile)
export const userIdParamSchema = z.object({
  userId: z.string().uuid('ID người dùng không hợp lệ'),
});

// Update songs (max 3)
export const updateSongsSchema = z.object({
  songs: z
    .array(
      z.object({
        title: z.string().min(1, 'Tên bài hát không được để trống').max(200),
        artist: z.string().min(1, 'Tên nghệ sĩ không được để trống').max(100),
        artworkUrl: z.string().url('URL artwork không hợp lệ').optional().nullable(),
        embedUrl: z.string().min(1, 'Embed URL không được để trống'),
        startTime: z.number().int().min(0).optional().nullable(),
        endTime: z.number().int().min(0).optional().nullable(),
      })
    )
    .max(3, 'Tối đa 3 bài hát')
    .optional(),
});

// Export types
export type CreateDatingProfileInput = z.infer<typeof createDatingProfileSchema>;
export type UpdateDatingProfileInput = z.infer<typeof updateDatingProfileSchema>;
export type AddPhotoInput = z.infer<typeof addPhotoSchema>;
export type ReplacePhotoInput = z.infer<typeof replacePhotoSchema>;
export type UpdatePromptsInput = z.infer<typeof updatePromptsSchema>;
export type UpdateLifestyleInput = z.infer<typeof updateLifestyleSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type PhotoIdParam = z.infer<typeof photoIdParamSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type UpdateSongsInput = z.infer<typeof updateSongsSchema>;

// Export helper for age validation
export { validateAge };
