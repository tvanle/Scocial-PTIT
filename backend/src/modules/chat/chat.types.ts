// Import and re-export Prisma types
import type {
  Conversation,
  ConversationParticipant,
  Message,
  MessageReadStatus,
  ConversationType,
  MessageType,
} from '@prisma/client';

export type {
  Conversation,
  ConversationParticipant,
  Message,
  MessageReadStatus,
  ConversationType,
  MessageType,
};

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
