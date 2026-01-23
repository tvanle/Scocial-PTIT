import { Message, Conversation } from './chat.model';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../shared/constants';
import { parsePagination, paginate } from '../../shared/utils';

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

    // Find existing conversation
    let conversation = await Conversation.findOne({
      type: 'private',
      participants: { $all: [userId, otherUserId], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        type: 'private',
        participants: [userId, otherUserId],
      });
    }

    return conversation;
  }

  // Get user conversations
  async getConversations(userId: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    const conversations = await Conversation.find({
      participants: userId,
    })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(l);

    const total = await Conversation.countDocuments({
      participants: userId,
    });

    // Get user info for participants
    const participantIds = [...new Set(conversations.flatMap((c) => c.participants))];
    const users = await prisma.user.findMany({
      where: { id: { in: participantIds } },
      select: {
        id: true,
        fullName: true,
        avatar: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const conversationsWithUsers = conversations.map((conv) => ({
      ...conv.toObject(),
      participantUsers: conv.participants
        .filter((id) => id !== userId)
        .map((id) => userMap.get(id)),
    }));

    return paginate(conversationsWithUsers, total, p, l);
  }

  // Get messages in conversation
  async getMessages(conversationId: string, userId: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l);

    const total = await Message.countDocuments({ conversationId });

    return paginate(messages.reverse(), total, p, l);
  }

  // Send message
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: 'text' | 'image' | 'video' | 'file' = 'text',
    mediaUrl?: string
  ) {
    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(senderId)) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content,
      type,
      mediaUrl,
      readBy: [senderId],
    });

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        content,
        senderId,
        createdAt: new Date(),
      },
    });

    return message;
  }

  // Mark messages as read
  async markAsRead(conversationId: string, userId: string) {
    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
        isRead: true,
      }
    );
  }

  // Delete message
  async deleteMessage(messageId: string, userId: string) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new AppError('Message not found', HTTP_STATUS.NOT_FOUND);
    }

    if (message.senderId !== userId) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    await Message.findByIdAndDelete(messageId);
  }

  // Get unread count
  async getUnreadCount(userId: string) {
    const count = await Message.countDocuments({
      readBy: { $ne: userId },
      senderId: { $ne: userId },
    });

    return { unreadCount: count };
  }
}

export const chatService = new ChatService();
