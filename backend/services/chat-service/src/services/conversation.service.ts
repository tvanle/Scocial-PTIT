import { Conversation, ConversationSettings, IConversation } from '../models';
import { ConversationType } from '../types';
import { createError } from '../middleware';
import { ERROR_MESSAGES } from '../constants';

export class ConversationService {
  /**
   * Get all conversations for a user with pagination
   */
  async getConversations(
    userId: string,
    page: number,
    limit: number
  ): Promise<{
    conversations: any[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({
      participantIds: userId,
    })
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Conversation.countDocuments({
      participantIds: userId,
    });

    // Get settings for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const settings = await ConversationSettings.findOne({
          conversationId: conv._id,
          userId,
        });

        return {
          ...conv.toObject(),
          unreadCount: settings?.unreadCount || 0,
          isMuted: settings?.isMuted || false,
          isPinned: settings?.isPinned || false,
        };
      })
    );

    // Sort: pinned first, then by lastMessageAt
    conversationsWithDetails.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

    return {
      conversations: conversationsWithDetails,
      total,
    };
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    userId: string,
    participantIds: string[],
    type: ConversationType,
    name?: string
  ): Promise<IConversation> {
    const allParticipants = [...new Set([userId, ...participantIds])];

    // For private chat, check if conversation already exists
    if (type === ConversationType.PRIVATE && allParticipants.length === 2) {
      const existing = await Conversation.findOne({
        type: ConversationType.PRIVATE,
        participantIds: { $all: allParticipants, $size: 2 },
      });

      if (existing) {
        return existing;
      }
    }

    const conversation = await Conversation.create({
      type,
      name: type === ConversationType.GROUP ? name : undefined,
      participantIds: allParticipants,
      adminIds: type === ConversationType.GROUP ? [userId] : [],
    });

    // Create settings for all participants
    await Promise.all(
      allParticipants.map((participantId) =>
        ConversationSettings.create({
          conversationId: conversation._id,
          userId: participantId,
        })
      )
    );

    return conversation;
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(conversationId: string, userId: string): Promise<any> {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participantIds: userId,
    });

    if (!conversation) {
      throw createError(ERROR_MESSAGES.CONVERSATION_NOT_FOUND, 404);
    }

    const settings = await ConversationSettings.findOne({
      conversationId,
      userId,
    });

    return {
      ...conversation.toObject(),
      unreadCount: settings?.unreadCount || 0,
      isMuted: settings?.isMuted || false,
      isPinned: settings?.isPinned || false,
    };
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await ConversationSettings.findOneAndUpdate(
      { conversationId, userId },
      { unreadCount: 0 }
    );
  }

  /**
   * Add members to group
   */
  async addMembers(conversationId: string, userId: string, memberIds: string[]): Promise<void> {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: ConversationType.GROUP,
      adminIds: userId,
    });

    if (!conversation) {
      throw createError(ERROR_MESSAGES.GROUP_NOT_FOUND_OR_NOT_ADMIN, 404);
    }

    await Conversation.findByIdAndUpdate(conversationId, {
      $addToSet: { participantIds: { $each: memberIds } },
    });

    // Create settings for new members
    await Promise.all(
      memberIds.map((memberId) =>
        ConversationSettings.findOneAndUpdate(
          { conversationId, userId: memberId },
          { conversationId, userId: memberId },
          { upsert: true }
        )
      )
    );
  }

  /**
   * Remove member from group
   */
  async removeMember(conversationId: string, userId: string, memberId: string): Promise<void> {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: ConversationType.GROUP,
      adminIds: userId,
    });

    if (!conversation) {
      throw createError(ERROR_MESSAGES.GROUP_NOT_FOUND_OR_NOT_ADMIN, 404);
    }

    await Conversation.findByIdAndUpdate(conversationId, {
      $pull: { participantIds: memberId, adminIds: memberId },
    });

    await ConversationSettings.deleteOne({
      conversationId,
      userId: memberId,
    });
  }

  /**
   * Leave group
   */
  async leaveGroup(conversationId: string, userId: string): Promise<void> {
    await Conversation.findByIdAndUpdate(conversationId, {
      $pull: { participantIds: userId, adminIds: userId },
    });

    await ConversationSettings.deleteOne({
      conversationId,
      userId,
    });
  }

  /**
   * Update conversation last message
   */
  async updateLastMessage(conversationId: string, messageId: string, messageDate: Date): Promise<void> {
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessageId: messageId,
      lastMessageAt: messageDate,
    });
  }

  /**
   * Increment unread count for participants
   */
  async incrementUnreadCount(conversationId: string, excludeUserId: string): Promise<void> {
    await ConversationSettings.updateMany(
      {
        conversationId,
        userId: { $ne: excludeUserId },
      },
      { $inc: { unreadCount: 1 } }
    );
  }
}
