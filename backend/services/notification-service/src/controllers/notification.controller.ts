import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants';
import { CreateNotificationDto, RegisterDeviceTokenDto, UpdateNotificationSettingsDto } from '../types';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const result = await this.notificationService.getNotifications(userId, req.query);
      res.json(result);
    } catch (error) {
      console.error('Get notifications error:', error);
      next(error);
    }
  };

  getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const count = await this.notificationService.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Get unread count error:', error);
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      const notification = await this.notificationService.markAsRead(userId, id);

      if (!notification) {
        return res.status(404).json({ error: ERROR_MESSAGES.NOTIFICATION_NOT_FOUND });
      }

      res.json(notification);
    } catch (error) {
      console.error('Mark as read error:', error);
      next(error);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      await this.notificationService.markAllAsRead(userId);
      res.json({ message: SUCCESS_MESSAGES.ALL_NOTIFICATIONS_READ });
    } catch (error) {
      console.error('Mark all as read error:', error);
      next(error);
    }
  };

  deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      await this.notificationService.deleteNotification(userId, id);
      res.json({ message: SUCCESS_MESSAGES.NOTIFICATION_DELETED });
    } catch (error) {
      console.error('Delete notification error:', error);
      next(error);
    }
  };

  clearAllNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      await this.notificationService.clearAllNotifications(userId);
      res.json({ message: SUCCESS_MESSAGES.ALL_NOTIFICATIONS_CLEARED });
    } catch (error) {
      console.error('Clear notifications error:', error);
      next(error);
    }
  };

  registerDeviceToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const dto: RegisterDeviceTokenDto = req.body;

      await this.notificationService.registerDeviceToken(userId, dto);
      res.json({ message: SUCCESS_MESSAGES.DEVICE_TOKEN_REGISTERED });
    } catch (error) {
      console.error('Register device token error:', error);
      next(error);
    }
  };

  removeDeviceToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const { token } = req.body;

      await this.notificationService.removeDeviceToken(userId, token);
      res.json({ message: SUCCESS_MESSAGES.DEVICE_TOKEN_REMOVED });
    } catch (error) {
      console.error('Remove device token error:', error);
      next(error);
    }
  };

  getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const settings = await this.notificationService.getNotificationSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error('Get settings error:', error);
      next(error);
    }
  };

  updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const updates: UpdateNotificationSettingsDto = req.body;

      const settings = await this.notificationService.updateNotificationSettings(userId, updates);
      res.json(settings);
    } catch (error) {
      console.error('Update settings error:', error);
      next(error);
    }
  };

  createNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: CreateNotificationDto = req.body;
      const io = req.app.get('io');

      const result = await this.notificationService.createNotification(dto, io);
      res.status(201).json(result);
    } catch (error) {
      console.error('Create notification error:', error);
      next(error);
    }
  };
}
