import { z } from 'zod';

export const createDatingConversationSchema = z.object({
  otherUserId: z.string().uuid('ID người dùng không hợp lệ'),
});

export const sendDatingMessageSchema = z.object({
  content: z.string().min(1, 'Nội dung không được để trống').max(2000, 'Nội dung tối đa 2000 ký tự'),
});

export const conversationIdParamSchema = z.object({
  id: z.string().uuid('ID cuộc trò chuyện không hợp lệ'),
});

export type CreateDatingConversationInput = z.infer<typeof createDatingConversationSchema>;
export type SendDatingMessageInput = z.infer<typeof sendDatingMessageSchema>;
