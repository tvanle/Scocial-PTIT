import { Response, NextFunction } from 'express';
import { chatService } from './chat.service';
import { AuthRequest } from '../../shared/types';
import { HTTP_STATUS } from '../../shared/constants';
import { sendSuccess } from '../../shared/utils';

export class ChatController {
  async getOrCreateConversation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const conversation = await chatService.getOrCreateConversation(req.user!.userId, userId);
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
      const { conversationId } = req.params;
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
      const { conversationId } = req.params;
      const { content, type, mediaUrl } = req.body;
      const message = await chatService.sendMessage(
        conversationId,
        req.user!.userId,
        content,
        type,
        mediaUrl
      );
      sendSuccess(res, message, undefined, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { conversationId } = req.params;
      await chatService.markAsRead(conversationId, req.user!.userId);
      sendSuccess(res, null);
    } catch (error) {
      next(error);
    }
  }

  async deleteMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { messageId } = req.params;
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
