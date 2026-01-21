import { Router } from 'express';
import { NotificationController } from '../controllers';
import { authenticate } from '../middleware';
import {
  validateCreateNotification,
  validateRegisterDeviceToken,
  validatePagination,
  validateNotificationId,
  validateUpdateSettings,
} from '../validators';

const router = Router();
const notificationController = new NotificationController();

// User notification routes (require authentication)
router.get('/', authenticate, validatePagination, notificationController.getNotifications);

router.get('/unread-count', authenticate, notificationController.getUnreadCount);

router.post(
  '/:id/read',
  authenticate,
  validateNotificationId,
  notificationController.markAsRead
);

router.post('/read-all', authenticate, notificationController.markAllAsRead);

router.delete(
  '/:id',
  authenticate,
  validateNotificationId,
  notificationController.deleteNotification
);

router.delete('/', authenticate, notificationController.clearAllNotifications);

// Device token routes
router.post(
  '/device-token',
  authenticate,
  validateRegisterDeviceToken,
  notificationController.registerDeviceToken
);

router.delete('/device-token', authenticate, notificationController.removeDeviceToken);

// Settings routes
router.get('/settings', authenticate, notificationController.getSettings);

router.put(
  '/settings',
  authenticate,
  validateUpdateSettings,
  notificationController.updateSettings
);

// Internal routes (called by other services)
router.post(
  '/internal/create',
  validateCreateNotification,
  notificationController.createNotification
);

export default router;
