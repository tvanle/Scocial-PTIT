import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import { AuthRequest } from '../../shared/types';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../shared/constants';
import { sendSuccess } from '../../shared/utils';

export class UserController {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const currentUserId = req.user?.userId;
      const user = await userService.getProfile(userId, currentUserId);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateProfile(req.user!.userId, req.body);
      sendSuccess(res, user, SUCCESS_MESSAGES.PROFILE_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, page, limit } = req.query;
      const result = await userService.searchUsers(
        q as string,
        page as string,
        limit as string
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async followUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      await userService.followUser(req.user!.userId, userId);
      sendSuccess(res, null, SUCCESS_MESSAGES.FOLLOW_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async unfollowUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      await userService.unfollowUser(req.user!.userId, userId);
      sendSuccess(res, null, SUCCESS_MESSAGES.UNFOLLOW_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async getFollowers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const { page, limit } = req.query;
      const result = await userService.getFollowers(
        userId,
        page as string,
        limit as string
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getFollowing(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const { page, limit } = req.query;
      const result = await userService.getFollowing(
        userId,
        page as string,
        limit as string
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
