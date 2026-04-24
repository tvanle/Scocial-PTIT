import { Response, NextFunction } from 'express';
import { chatService } from './chat.service';
import { AuthRequest } from '../../shared/types';
import { HTTP_STATUS } from '../../shared/constants';
import { sendSuccess } from '../../shared/utils';
import { getIO } from '../../config/socket';
import { prisma } from '../../config/database';

export class ChatController {
  async getOrCreateConversation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const conversation = await chatService.getOrCreateConversation(req.user!.userId, userId);
      sendSuccess(res, conversation);
    } catch (error) {
      next(error);
    }
  }

  async getConversation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const conversationId = req.params.conversationId as string;
      const conversation = await chatService.getConversation(conversationId, req.user!.userId);
      sendSuccess(res, conversation);
    } catch (error) {
      next(error);
    }
  }

  async getConversations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const result = await chatService.getConversations(
        req.user!.userId,
        page as string,
        limit as string
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const conversationId = req.params.conversationId as string;
      const { page, limit } = req.query;
      const result = await chatService.getMessages(
        conversationId,
        req.user!.userId,
        page as string,
        limit as string
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const conversationId = req.params.conversationId as string;
      const { content, type, mediaUrl, postId } = req.body;
      const message = await chatService.sendMessage(
        conversationId,
        req.user!.userId,
        content,
        type,
        mediaUrl,
        postId
      );

      // Emit socket event to all participants for real-time update
      try {
        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId },
          select: { userId: true },
        });
        const io = getIO();
        participants.forEach((p) => {
          io.to(p.userId).emit('newMessage', {
            ...message,
            conversationId,
          });
        });
      } catch (socketError) {
        console.error('Socket emit error:', socketError);
      }

      sendSuccess(res, message, undefined, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const conversationId = req.params.conversationId as string;
      await chatService.markAsRead(conversationId, req.user!.userId);
      sendSuccess(res, null);
    } catch (error) {
      next(error);
    }
  }

  async deleteMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const messageId = req.params.messageId as string;
      await chatService.deleteMessage(messageId, req.user!.userId);
      sendSuccess(res, null);
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await chatService.getUnreadCount(req.user!.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
