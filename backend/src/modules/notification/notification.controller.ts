import { Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { AuthRequest } from '../../shared/types';
import { sendSuccess } from '../../shared/utils';

export class NotificationController {
  async getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const result = await notificationService.getNotifications(
        req.user!.userId,
        page as string,
        limit as string
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.getUnreadCount(req.user!.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { notificationId } = req.params;
      await notificationService.markAsRead(notificationId, req.user!.userId);
      sendSuccess(res, null);
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllAsRead(req.user!.userId);
      sendSuccess(res, null);
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { notificationId } = req.params;
      await notificationService.deleteNotification(notificationId, req.user!.userId);
      sendSuccess(res, null);
    } catch (error) {
      next(error);
    }
  }

  async clearAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.clearAll(req.user!.userId);
      sendSuccess(res, null);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
