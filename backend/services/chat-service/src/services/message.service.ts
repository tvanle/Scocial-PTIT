import { Message, IMessage, Conversation, ConversationSettings } from '../models';
import { MessageType, MessageStatus, IMedia } from '../types';
import { createError } from '../middleware';
import { ERROR_MESSAGES } from '../constants';

export class MessageService {
  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    userId: string,
    limit: number,
    before?: string
  ): Promise<{
    messages: IMessage[];
    total: number;
    hasMore: boolean;
    oldestMessageDate: Date | null;
  }> {
    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participantIds: userId,
    });

    if (!conversation) {
      throw createError(ERROR_MESSAGES.CONVERSATION_NOT_FOUND, 404);
    }

    const query: any = {
      conversationId,
      deletedFor: { $ne: userId },
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    const total = await Message.countDocuments({
      conversationId,
      deletedFor: { $ne: userId },
    });

    return {
      messages: messages.reverse(),
      total,
      hasMore: messages.length === limit,
      oldestMessageDate: messages.length > 0 ? messages[0].createdAt : null,
    };
  }

  /**
   * Send a message
   */
  async sendMessage(
    conversationId: string,
    userId: string,
    content?: string,
    media?: IMedia[],
    replyToId?: string,
    type: MessageType = MessageType.TEXT
  ): Promise<IMessage> {
    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participantIds: userId,
    });

    if (!conversation) {
      throw createError(ERROR_MESSAGES.CONVERSATION_NOT_FOUND, 404);
    }

    const message = await Message.create({
      conversationId,
      senderId: userId,
      content,
      media,
      replyToId,
      type,
      status: MessageStatus.SENT,
      readBy: [userId],
    });

    return message;
  }

  /**
   * Delete a message
   */
  async deleteMessage(
    conversationId: string,
    messageId: string,
    userId: string
  ): Promise<void> {
    const message = await Message.findOne({
      _id: messageId,
      conversationId,
    });

    if (!message) {
      throw createError(ERROR_MESSAGES.MESSAGE_NOT_FOUND, 404);
    }

    // Only sender can delete for everyone
    if (message.senderId === userId) {
      await Message.findByIdAndDelete(messageId);
    } else {
      // Delete only for current user
      await Message.findByIdAndUpdate(messageId, {
        $addToSet: { deletedFor: userId },
      });
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        readBy: { $ne: userId },
      },
      { $addToSet: { readBy: userId }, $set: { status: MessageStatus.READ } }
    );

    await ConversationSettings.findOneAndUpdate(
      { conversationId, userId },
      { unreadCount: 0 }
    );
  }

  /**
   * Get message by ID
   */
  async getMessageById(messageId: string): Promise<IMessage | null> {
    return await Message.findById(messageId);
  }
}
