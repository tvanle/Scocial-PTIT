import { prisma } from '../../config/database';
import { AppError } from '../../middleware';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../shared/constants';
import { parsePagination, paginate } from '../../shared/utils';
import { MessageType } from './chat.types';
import { pushNotificationService } from '../../services/push';

// User is considered online if active within last 5 minutes
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

function isUserOnline(lastActiveAt: Date | null): boolean {
  if (!lastActiveAt) return false;
  return Date.now() - new Date(lastActiveAt).getTime() < ONLINE_THRESHOLD_MS;
}

export class ChatService {
  // Helper: flatten ConversationParticipant[] into User[] for frontend compatibility
  // Also computes isOnline from lastActiveAt
  private flattenConversation(conversation: any) {
    if (!conversation) return conversation;
    const { participants, ...rest } = conversation;
    return {
      ...rest,
      participants: (participants || []).map((p: any) => {
        const user = p.user || p;
        return {
          ...user,
          isOnline: isUserOnline(user.lastActiveAt),
        };
      }),
    };
  }

  // Get or create private conversation
  async getOrCreateConversation(userId: string, otherUserId: string) {
    // Check if other user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
    });

    if (!otherUser) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Find existing private conversation between these 2 users (optimized: single query with AND)
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        type: 'PRIVATE',
        context: 'SOCIAL',
        AND: [
          { participants: { some: { userId: userId } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, fullName: true, avatar: true, lastActiveAt: true },
            },
          },
        },
      },
    });

    if (existingConversation) {
      return this.flattenConversation(existingConversation);
    }

    // Create new conversation with transaction
    const newConv = await prisma.$transaction(async (tx) => {
      const [participantAId, participantBId] = [userId, otherUserId].sort();
      const conv = await tx.conversation.create({
        data: { type: 'PRIVATE', context: 'SOCIAL', participantAId, participantBId },
      });

      await tx.conversationParticipant.createMany({
        data: [
          { conversationId: conv.id, userId: userId },
          { conversationId: conv.id, userId: otherUserId },
        ],
      });

      return tx.conversation.findUnique({
        where: { id: conv.id },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, fullName: true, avatar: true, lastActiveAt: true },
              },
            },
          },
        },
      });
    });

    return this.flattenConversation(newConv);
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, fullName: true, avatar: true, lastActiveAt: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new AppError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const isParticipant = conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    return this.flattenConversation(conversation);
  }

  // Get user conversations (only SOCIAL context - exclude dating conversations)
  async getConversations(userId: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    const conversations = await prisma.conversation.findMany({
      where: {
        context: 'SOCIAL',
        participants: {
          some: { userId: userId },
        },
      },
      include: {
        participants: {
          where: { userId: { not: userId } },
          include: {
            user: {
              select: { id: true, fullName: true, avatar: true, lastActiveAt: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: skip,
      take: l,
    });

    const total = await prisma.conversation.count({
      where: {
        context: 'SOCIAL',
        participants: {
          some: { userId: userId },
        },
      },
    });

    // Enrich with lastMessage object + unreadCount for frontend
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            readBy: { none: { userId: userId } },
          },
        });

        const flattened = this.flattenConversation(conv);
        return {
          ...flattened,
          unreadCount,
          lastMessage: conv.lastMessageContent
            ? {
              content: conv.lastMessageContent,
              senderId: conv.lastMessageSenderId,
              createdAt: conv.lastMessageCreatedAt,
            }
            : null,
        };
      })
    );

    return paginate(enriched, total, p, l);
  }

  // Get messages in conversation
  async getMessages(conversationId: string, userId: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    // Verify user is participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          where: { userId: userId },
        },
      },
    });

    if (!conversation || conversation.participants.length === 0) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      skip: skip,
      take: l,
      include: {
        sender: {
          select: { id: true, fullName: true, avatar: true, lastActiveAt: true },
        },
        readBy: true,
      },
    });

    const total = await prisma.message.count({
      where: { conversationId },
    });

    return paginate(messages.reverse(), total, p, l);
  }

  // Send message
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: string = 'TEXT',
    mediaUrl?: string
  ) {
    // Normalize type to uppercase for Prisma enum (frontend may send lowercase)
    const normalizedType = (type?.toUpperCase() || 'TEXT') as MessageType;

    // Verify user is participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          where: { userId: senderId },
        },
      },
    });

    if (!conversation || conversation.participants.length === 0) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    // Use transaction to create message and update conversation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create message (without include — will fetch with relations at end)
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId,
          content,
          type: normalizedType,
          mediaUrl,
        },
      });

      // 2. Mark as read by sender
      await tx.messageReadStatus.create({
        data: {
          messageId: message.id,
          userId: senderId,
        },
      });

      // 3. Update conversation's lastMessage and user's lastActiveAt
      await Promise.all([
        tx.conversation.update({
          where: { id: conversationId },
          data: {
            lastMessageContent: content,
            lastMessageSenderId: senderId,
            lastMessageCreatedAt: message.createdAt,
            updatedAt: new Date(),
          },
        }),
        tx.user.update({
          where: { id: senderId },
          data: { lastActiveAt: new Date() },
        }),
      ]);

      // 4. Single fetch with all relations
      return tx.message.findUnique({
        where: { id: message.id },
        include: {
          sender: {
            select: { id: true, fullName: true, avatar: true, lastActiveAt: true },
          },
          readBy: true,
        },
      });
    });

    // Send push notification to other participants (async, don't wait)
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });

    const otherParticipantIds = participants
      .map((p) => p.userId)
      .filter((id) => id !== senderId);

    for (const receiverId of otherParticipantIds) {
      pushNotificationService
        .sendMessageNotification(receiverId, senderId, conversationId, content)
        .catch(console.error);
    }

    return result;
  }

  // Mark messages as read
  async markAsRead(conversationId: string, userId: string) {
    // Find unread messages
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readBy: { none: { userId: userId } },
      },
      select: { id: true },
    });

    if (unreadMessages.length === 0) {
      return;
    }

    // Bulk create read statuses (skipDuplicates handles idempotency)
    await prisma.messageReadStatus.createMany({
      data: unreadMessages.map((msg) => ({
        messageId: msg.id,
        userId: userId,
      })),
      skipDuplicates: true,
    });

    // Update isRead flag
    await prisma.message.updateMany({
      where: { id: { in: unreadMessages.map((m) => m.id) } },
      data: { isRead: true },
    });
  }

  // Delete message
  async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new AppError('Message not found', HTTP_STATUS.NOT_FOUND);
    }

    if (message.senderId !== userId) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    await prisma.message.delete({
      where: { id: messageId },
    });
  }

  // Get unread count (only SOCIAL context - exclude dating messages)
  async getUnreadCount(userId: string) {
    const count = await prisma.message.count({
      where: {
        senderId: { not: userId },
        readBy: { none: { userId: userId } },
        conversation: {
          context: 'SOCIAL',
          participants: { some: { userId: userId } },
        },
      },
    });

    return { unreadCount: count };
  }
}

export const chatService = new ChatService();
