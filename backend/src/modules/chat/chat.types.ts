// Type exports from Prisma
export type {
  Conversation,
  ConversationParticipant,
  Message,
  MessageReadStatus,
  ConversationType,
  MessageType,
} from '@prisma/client';

export interface ConversationWithParticipants extends Conversation {
  participants: (ConversationParticipant & {
    user: {
      id: string;
      fullName: string | null;
      avatar: string | null;
    };
  })[];
}

export interface MessageWithReadStatus extends Message {
  readBy: MessageReadStatus[];
}
