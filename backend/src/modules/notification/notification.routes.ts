import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authenticate } from '../../middleware';

const router = Router();

router.get('/', authenticate, notificationController.getNotifications);
router.get('/unread-count', authenticate, notificationController.getUnreadCount);
router.post('/mark-all-read', authenticate, notificationController.markAllAsRead);
router.post('/:notificationId/read', authenticate, notificationController.markAsRead);
router.delete('/:notificationId', authenticate, notificationController.deleteNotification);
router.delete('/', authenticate, notificationController.clearAll);

export default router;
