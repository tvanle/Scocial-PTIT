import { prisma } from '../../../config/database';
import { AppError } from '../../../middleware';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../../shared/constants';
import { CreateDatingConversationInput, SendDatingMessageInput } from './dating-chat.schema';
import { pushNotificationService } from '../../../services/push';

// User is considered online if active within last 5 minutes
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

function isUserOnline(lastActiveAt: Date | null): boolean {
  if (!lastActiveAt) return false;
  return Date.now() - new Date(lastActiveAt).getTime() < ONLINE_THRESHOLD_MS;
}

export class DatingChatService {
  async getOrCreateConversation(userId: string, data: CreateDatingConversationInput) {
    const { otherUserId } = data;

    if (userId === otherUserId) {
      throw new AppError('Không thể tạo cuộc trò chuyện với chính mình', HTTP_STATUS.BAD_REQUEST);
    }

    const matchExists = await prisma.datingMatch.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: otherUserId },
          { userAId: otherUserId, userBId: userId },
        ],
      },
      select: { id: true },
    });

    if (!matchExists) {
      throw new AppError(ERROR_MESSAGES.NOT_MATCHED, HTTP_STATUS.FORBIDDEN);
    }

    const [participantAId, participantBId] = [userId, otherUserId].sort();

    const existing = await prisma.conversation.findUnique({
      where: {
        participantAId_participantBId_context: {
          participantAId,
          participantBId,
          context: 'DATING',
        },
      },
      select: {
        id: true,
        lastMessageContent: true,
        lastMessageCreatedAt: true,
        updatedAt: true,
        participants: {
          select: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatar: true,
                lastActiveAt: true,
              },
            },
          },
        },
      },
    });

    if (existing) return existing;

    const conversation = await prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: {
          type: 'PRIVATE',
          context: 'DATING',
          participantAId,
          participantBId,
        },
      });

      await tx.conversationParticipant.createMany({
        data: [
          { conversationId: conv.id, userId },
          { conversationId: conv.id, userId: otherUserId },
        ],
      });

      return tx.conversation.findUnique({
        where: { id: conv.id },
        select: {
          id: true,
          lastMessageContent: true,
          lastMessageCreatedAt: true,
          updatedAt: true,
          participants: {
            select: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });
    });

    return conversation;
  }

  async getConversations(userId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        context: 'DATING',
        participants: { some: { userId } },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        lastMessageContent: true,
        lastMessageSenderId: true,
        lastMessageCreatedAt: true,
        updatedAt: true,
        participants: {
          select: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatar: true,
                lastActiveAt: true,
              },
            },
          },
        },
        messages: {
          where: {
            isRead: false,
            senderId: { not: userId },
          },
          select: { id: true },
        },
      },
    });

    return conversations.map((c) => {
      const otherParticipant = c.participants.find((p) => p.user.id !== userId);
      const otherUser = otherParticipant?.user;
      return {
        id: c.id,
        lastMessageContent: c.lastMessageContent,
        lastMessageSenderId: c.lastMessageSenderId,
        lastMessageCreatedAt: c.lastMessageCreatedAt,
        updatedAt: c.updatedAt,
        otherUser: otherUser ? {
          ...otherUser,
          isOnline: isUserOnline(otherUser.lastActiveAt),
        } : null,
        unreadCount: c.messages.length,
      };
    });
  }

  async getMessages(userId: string, conversationId: string, page = 1, limit = 30) {
    await this.ensureParticipant(userId, conversationId);

    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          content: true,
          senderId: true,
          createdAt: true,
          sender: {
            select: { id: true, fullName: true, avatar: true },
          },
        },
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    return {
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    };
  }

  async sendMessage(userId: string, conversationId: string, data: SendDatingMessageInput) {
    await this.ensureParticipant(userId, conversationId);

    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: data.content,
          type: 'TEXT',
        },
        select: {
          id: true,
          content: true,
          senderId: true,
          createdAt: true,
          sender: {
            select: { id: true, fullName: true, avatar: true },
          },
        },
      });

      // Update conversation and user's lastActiveAt
      await Promise.all([
        tx.conversation.update({
          where: { id: conversationId },
          data: {
            lastMessageContent: data.content,
            lastMessageSenderId: userId,
            lastMessageCreatedAt: msg.createdAt,
          },
        }),
        tx.user.update({
          where: { id: userId },
          data: { lastActiveAt: new Date() },
        }),
      ]);

      return msg;
    });

    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });

    // Send push notification to other participants (async, don't wait)
    const otherParticipantIds = participants
      .map((p) => p.userId)
      .filter((id) => id !== userId);

    for (const receiverId of otherParticipantIds) {
      pushNotificationService
        .sendMessageNotification(receiverId, userId, conversationId, data.content)
        .catch(console.error);
    }

    return { message, participantIds: participants.map((p) => p.userId) };
  }

  private async ensureParticipant(userId: string, conversationId: string) {
    const conv = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        context: 'DATING',
        participants: { some: { userId } },
      },
      select: { id: true },
    });

    if (!conv) {
      throw new AppError(ERROR_MESSAGES.DATING_CONVERSATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
  }
}

export const datingChatService = new DatingChatService();
