import { z } from 'zod';

export const createPaymentSchema = z.object({
  planType: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY'], {
    errorMap: () => ({ message: 'Gói phải là MONTHLY, QUARTERLY hoặc YEARLY' }),
  }),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
