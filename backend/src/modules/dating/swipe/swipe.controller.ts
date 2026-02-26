import { Response, NextFunction } from 'express';
import { swipeService } from './swipe.service';
import { AuthRequest } from '../../../shared/types';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../../shared/constants';
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
}

export const swipeController = new SwipeController();
