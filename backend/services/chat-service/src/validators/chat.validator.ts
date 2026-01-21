import { z } from 'zod';
import { ConversationType, MessageType, MediaType } from '../types';

// Media schema
const mediaSchema = z.object({
  url: z.string().url(),
  type: z.nativeEnum(MediaType),
  thumbnail: z.string().url().optional(),
  filename: z.string().optional(),
  size: z.number().positive().optional(),
});

// Create conversation schema
export const createConversationSchema = z.object({
  body: z.object({
    participantIds: z.array(z.string()).min(1, 'At least one participant required'),
    name: z.string().optional(),
    type: z.nativeEnum(ConversationType).default(ConversationType.PRIVATE),
  }),
});

// Send message schema
export const sendMessageSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z
    .object({
      content: z.string().optional(),
      media: z.array(mediaSchema).optional(),
      replyToId: z.string().optional(),
      type: z.nativeEnum(MessageType).default(MessageType.TEXT),
    })
    .refine((data) => data.content || (data.media && data.media.length > 0), {
      message: 'Either content or media is required',
    }),
});

// Get conversations schema
export const getConversationsSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20'),
  }),
});

// Get messages schema
export const getMessagesSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('50'),
    before: z.string().optional(),
  }),
});

// Delete message schema
export const deleteMessageSchema = z.object({
  params: z.object({
    convId: z.string(),
    msgId: z.string(),
  }),
});

// Mark as read schema
export const markAsReadSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

// Typing indicator schema
export const typingIndicatorSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    isTyping: z.boolean(),
  }),
});

// Add members schema
export const addMembersSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    memberIds: z.array(z.string()).min(1, 'At least one member required'),
  }),
});

// Remove member schema
export const removeMemberSchema = z.object({
  params: z.object({
    id: z.string(),
    memberId: z.string(),
  }),
});

// Leave group schema
export const leaveGroupSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

// Get conversation by ID schema
export const getConversationByIdSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});
