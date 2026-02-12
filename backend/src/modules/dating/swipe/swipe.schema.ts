import { z } from 'zod';

export const swipeSchema = z.object({
  body: z.object({
    targetUserId: z.string().uuid('ID người dùng không hợp lệ'),
    action: z.enum(['LIKE', 'PASS'], {
      errorMap: () => ({ message: 'Hành động phải là LIKE hoặc PASS' }),
    }),
  }),
});

export type SwipeInput = z.infer<typeof swipeSchema>['body'];
