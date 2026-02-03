import { prisma } from '../../config/database';
import { AppError } from '../../middleware';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../shared/constants';
import { parsePagination, paginate } from '../../shared/utils';
import { MessageType } from './chat.types';

export class ChatService {
  // Get or create private conversation
  async getOrCreateConversation(userId: string, otherUserId: string) {
    // Check if other user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
    });

    if (!otherUser) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Find existing conversation with exactly 2 participants
    const existingConversations = await prisma.conversation.findMany({
      where: {
        type: 'PRIVATE',
        participants: {
          some: { userId: { in: [userId, otherUserId] } },
        },
      },
      include: {
        participants: true,
      },
    });

    // Filter for exactly 2 participants matching our users
    const conversation = existingConversations.find(
      (conv) =>
        conv.participants.length === 2 &&
        conv.participants.every((p) => [userId, otherUserId].includes(p.userId))
    );

    if (conversation) {
      // Return existing with user data enrichment
      const conversationWithUsers = await prisma.conversation.findUnique({
        where: { id: conversation.id },
        include: {
          participants: {
            where: { userId: { not: userId } },
            include: {
              user: {
                select: { id: true, fullName: true, avatar: true },
              },
            },
          },
        },
      });
      return conversationWithUsers;
    }

    // Create new conversation with transaction
    const newConv = await prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: { type: 'PRIVATE' },
      });

      await tx.conversationParticipant.createMany({
        data: [
          { conversationId: conv.id, userId: userId },
          { conversationId: conv.id, userId: otherUserId },
        ],
      });

      // Fetch with user data
      return tx.conversation.findUnique({
        where: { id: conv.id },
        include: {
          participants: {
            where: { userId: { not: userId } },
            include: {
              user: {
                select: { id: true, fullName: true, avatar: true },
              },
            },
          },
        },
      });
    });

    return newConv;
  }

  // Get user conversations
  async getConversations(userId: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId: userId },
        },
      },
      include: {
        participants: {
          where: { userId: { not: userId } },
          include: {
            user: {
              select: { id: true, fullName: true, avatar: true },
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
        participants: {
          some: { userId: userId },
        },
      },
    });

    // Map to include participantUsers for backward compatibility
    const conversationsWithUsers = conversations.map((conv) => ({
      ...conv,
      participantUsers: conv.participants.map((p) => p.user),
    }));

    return paginate(conversationsWithUsers, total, p, l);
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
    type: MessageType = 'TEXT',
    mediaUrl?: string
  ) {
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
      // 1. Create message
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId,
          content,
          type,
          mediaUrl,
        },
        include: {
          readBy: true,
        },
      });

      // 2. Mark as read by sender
      await tx.messageReadStatus.create({
        data: {
          messageId: message.id,
          userId: senderId,
        },
      });

      // 3. Update conversation's lastMessage
      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageContent: content,
          lastMessageSenderId: senderId,
          lastMessageCreatedAt: message.createdAt,
          updatedAt: new Date(),
        },
      });

      // Fetch message with updated readBy
      return tx.message.findUnique({
        where: { id: message.id },
        include: {
          readBy: true,
        },
      });
    });

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

  // Get unread count
  async getUnreadCount(userId: string) {
    const count = await prisma.message.count({
      where: {
        senderId: { not: userId },
        readBy: { none: { userId: userId } },
        conversation: {
          participants: { some: { userId: userId } },
        },
      },
    });

    return { unreadCount: count };
  }
}

export const chatService = new ChatService();
