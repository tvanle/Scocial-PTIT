import { z } from 'zod';

export const swipeSchema = z.object({
  targetUserId: z.string().uuid('ID người dùng không hợp lệ'),
  action: z.enum(['LIKE', 'UNLIKE', 'SUPER_LIKE'], {
    errorMap: () => ({ message: 'Hành động phải là LIKE, UNLIKE hoặc SUPER_LIKE' }),
  }),
});

export type SwipeInput = z.infer<typeof swipeSchema>;
