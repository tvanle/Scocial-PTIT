import { Response, NextFunction } from 'express';
import { Server } from 'socket.io';
import { ConversationService, MessageService } from '../services';
import { AuthenticatedRequest, ConversationType, MessageType } from '../types';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, PAGINATION, SOCKET_EVENTS } from '../constants';
import { Conversation, Message } from '../models';

const conversationService = new ConversationService();
const messageService = new MessageService();

export class ChatController {
  /**
   * Get all conversations for a user
   */
  async getConversations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_CONVERSATIONS_LIMIT;

      const { conversations, total } = await conversationService.getConversations(userId, page, limit);

      // Get last message for each conversation
      const conversationsWithLastMessage = await Promise.all(
        conversations.map(async (conv) => {
          const lastMessage = conv.lastMessageId
            ? await messageService.getMessageById(conv.lastMessageId)
            : null;

          return {
            ...conv,
            lastMessage,
          };
        })
      );

      res.json({
        data: conversationsWithLastMessage,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: (page - 1) * limit + limit < total,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { participantIds, name, type = ConversationType.PRIVATE } = req.body;

      const conversation = await conversationService.createConversation(
        userId,
        participantIds,
        type,
        name
      );

      res.status(201).json(conversation);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const conversation = await conversationService.getConversationById(id, userId);

      res.json(conversation);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_MESSAGES_LIMIT;
      const before = req.query.before as string | undefined;

      const result = await messageService.getMessages(id, userId, limit, before);

      res.json({
        data: result.messages,
        meta: {
          total: result.total,
          hasMore: result.hasMore,
          oldestMessageDate: result.oldestMessageDate,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send a message
   */
  async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { content, media, replyToId, type = MessageType.TEXT } = req.body;

      const message = await messageService.sendMessage(id, userId, content, media, replyToId, type);

      // Update conversation
      await conversationService.updateLastMessage(id, String(message._id), message.createdAt);

      // Increment unread count for other participants
      await conversationService.incrementUnreadCount(id, userId);

      // Emit socket event
      const io: Server = req.app.get('io');
      const conversation = await Conversation.findById(id);
      conversation?.participantIds.forEach((participantId) => {
        if (participantId !== userId) {
          io.to(`user:${participantId}`).emit(SOCKET_EVENTS.NEW_MESSAGE, {
            conversationId: id,
            message,
          });
        }
      });

      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { convId, msgId } = req.params;

      await messageService.deleteMessage(convId, msgId, userId);

      res.json({ message: SUCCESS_MESSAGES.MESSAGE_DELETED });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      await messageService.markMessagesAsRead(id, userId);

      // Emit read receipt
      const io: Server = req.app.get('io');
      const conversation = await Conversation.findById(id);
      conversation?.participantIds.forEach((participantId) => {
        if (participantId !== userId) {
          io.to(`user:${participantId}`).emit(SOCKET_EVENTS.MESSAGES_READ, {
            conversationId: id,
            readBy: userId,
          });
        }
      });

      res.json({ message: SUCCESS_MESSAGES.MARKED_AS_READ });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { isTyping } = req.body;

      const conversation = await Conversation.findById(id);
      if (!conversation) {
        res.status(404).json({ error: ERROR_MESSAGES.CONVERSATION_NOT_FOUND });
        return;
      }

      const io: Server = req.app.get('io');
      conversation.participantIds.forEach((participantId) => {
        if (participantId !== userId) {
          io.to(`user:${participantId}`).emit(SOCKET_EVENTS.TYPING, {
            conversationId: id,
            userId,
            isTyping,
          });
        }
      });

      res.json({ message: SUCCESS_MESSAGES.OK });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add members to group
   */
  async addMembers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { memberIds } = req.body;

      await conversationService.addMembers(id, userId, memberIds);

      res.json({ message: SUCCESS_MESSAGES.MEMBERS_ADDED });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove member from group
   */
  async removeMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { id, memberId } = req.params;

      await conversationService.removeMember(id, userId, memberId);

      res.json({ message: SUCCESS_MESSAGES.MEMBER_REMOVED });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Leave group
   */
  async leaveGroup(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      await conversationService.leaveGroup(id, userId);

      res.json({ message: SUCCESS_MESSAGES.LEFT_GROUP });
    } catch (error) {
      next(error);
    }
  }
}
