import { z } from 'zod';

export const swipeSchema = z.object({
<<<<<<< HEAD
  body: z.object({
    targetUserId: z.string().uuid('ID người dùng không hợp lệ'),
    action: z.enum(['LIKE', 'PASS'], {
      errorMap: () => ({ message: 'Hành động phải là LIKE hoặc PASS' }),
    }),
  }),
});

export type SwipeInput = z.infer<typeof swipeSchema>['body'];
=======
  targetUserId: z.string().uuid('ID người dùng không hợp lệ'),
  action: z.enum(['LIKE', 'PASS'], {
    errorMap: () => ({ message: 'Hành động phải là LIKE hoặc PASS' }),
  }),
});

export type SwipeInput = z.infer<typeof swipeSchema>;
>>>>>>> f9b4a30b4e403563d001bd67d7b7646e7fd223c6
