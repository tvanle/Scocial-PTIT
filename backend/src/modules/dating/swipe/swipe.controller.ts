import { Response, NextFunction } from 'express';
import { swipeService } from './swipe.service';
import { AuthRequest } from '../../../shared/types';
import { HTTP_STATUS, SUCCESS_MESSAGES, PAGINATION } from '../../../shared/constants';
import { sendSuccess } from '../../../shared/utils';

export class SwipeController {
  async swipe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { targetUserId, action } = req.body;
      const result = await swipeService.swipe(userId, targetUserId, action);
      const message = result.matched ? SUCCESS_MESSAGES.MATCH_CREATED : SUCCESS_MESSAGES.SWIPE_SUCCESS;
      sendSuccess(res, result, message, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async getIncomingLikes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const page = Number(req.query.page) || PAGINATION.DEFAULT_PAGE;
      const limit = Number(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
      const result = await swipeService.getIncomingLikes(userId, page, limit);
      sendSuccess(res, result, SUCCESS_MESSAGES.SWIPE_SUCCESS, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  async getSentLikes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const page = Number(req.query.page) || PAGINATION.DEFAULT_PAGE;
      const limit = Number(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
      const result = await swipeService.getSentLikes(userId, page, limit);
      sendSuccess(res, result, SUCCESS_MESSAGES.SWIPE_SUCCESS, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  async rewind(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await swipeService.rewind(userId);
      sendSuccess(res, result, result.message, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }
}

export const swipeController = new SwipeController();
