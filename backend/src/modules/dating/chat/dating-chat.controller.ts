import { Response, NextFunction } from 'express';
import { datingChatService } from './dating-chat.service';
import { AuthRequest } from '../../../shared/types';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../../shared/constants';
import { sendSuccess } from '../../../shared/utils';
import { getIO } from '../../../config/socket';

export class DatingChatController {
  async createConversation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const conversation = await datingChatService.getOrCreateConversation(userId, req.body);
      sendSuccess(res, conversation, SUCCESS_MESSAGES.DATING_CONVERSATION_CREATED, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async getConversations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const conversations = await datingChatService.getConversations(userId);
      sendSuccess(res, conversations);
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const id = req.params.id as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 30;
      const result = await datingChatService.getMessages(userId, id, page, limit);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const id = req.params.id as string;
      const { message, participantIds } = await datingChatService.sendMessage(userId, id, req.body);

      try {
        const io = getIO();
        const payload = { ...message, conversationId: id, context: 'DATING' };
        for (const pid of participantIds) {
          io.to(pid).emit('newMessage', payload);
        }
      } catch {
        // socket emit is best-effort
      }

      sendSuccess(res, message, SUCCESS_MESSAGES.DATING_MESSAGE_SENT, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }
}

export const datingChatController = new DatingChatController();
