import { z } from 'zod';

// Helper để validate age >= 18
const validateAge = (dateOfBirth: Date | null | undefined): boolean => {
  if (!dateOfBirth) return false;
  const today = new Date();
  const age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    return age - 1 >= 18;
  }
  return age >= 18;
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
    maxDistance: z.number().int().min(1).max(500, 'Khoảng cách tối đa 500 km').optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
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

// Export types
export type CreateDatingProfileInput = z.infer<typeof createDatingProfileSchema>;
export type UpdateDatingProfileInput = z.infer<typeof updateDatingProfileSchema>;
export type AddPhotoInput = z.infer<typeof addPhotoSchema>;
export type UpdatePromptsInput = z.infer<typeof updatePromptsSchema>;
export type UpdateLifestyleInput = z.infer<typeof updateLifestyleSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type PhotoIdParam = z.infer<typeof photoIdParamSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;

// Export helper for age validation
export { validateAge };
