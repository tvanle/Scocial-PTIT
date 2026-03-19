import { z } from 'zod';

export const swipeSchema = z.object({
  targetUserId: z.string().uuid('ID người dùng không hợp lệ'),
  action: z.enum(['LIKE', 'UNLIKE'], {
    errorMap: () => ({ message: 'Hành động phải là LIKE hoặc UNLIKE' }),
  }),
});

export type SwipeInput = z.infer<typeof swipeSchema>;
