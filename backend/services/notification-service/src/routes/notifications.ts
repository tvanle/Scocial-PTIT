import { Router, Request, Response } from 'express';
import { Notification, NotificationSettings, DeviceToken, NotificationType } from '../models';

const router = Router();

// Get notifications
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { page = '1', limit = '20', unreadOnly = 'false' } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const query: any = { userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    res.json({
      data: notifications,
      meta: {
        total,
        unreadCount,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take),
        hasNext: skip + take < total,
        hasPrev: parseInt(page as string) > 1,
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Get unread count
router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const count = await Notification.countDocuments({ userId, isRead: false });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Mark notification as read
router.post('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Mark all as read
router.post('/read-all', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Delete notification
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await Notification.findOneAndDelete({ _id: id, userId });

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Clear all notifications
router.delete('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await Notification.deleteMany({ userId });

    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

// Register device token
router.post('/device-token', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { token, platform } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!token || !platform) {
      return res.status(400).json({ error: 'Token and platform required' });
    }

    // Deactivate old tokens with same value for different users
    await DeviceToken.updateMany(
      { token, userId: { $ne: userId } },
      { isActive: false }
    );

    // Upsert device token
    await DeviceToken.findOneAndUpdate(
      { userId, token },
      { userId, token, platform, isActive: true, lastUsedAt: new Date() },
      { upsert: true }
    );

    res.json({ message: 'Device token registered' });
  } catch (error) {
    console.error('Register device token error:', error);
    res.status(500).json({ error: 'Failed to register device token' });
  }
});

// Remove device token
router.delete('/device-token', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { token } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await DeviceToken.findOneAndUpdate(
      { userId, token },
      { isActive: false }
    );

    res.json({ message: 'Device token removed' });
  } catch (error) {
    console.error('Remove device token error:', error);
    res.status(500).json({ error: 'Failed to remove device token' });
  }
});

// Get notification settings
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let settings = await NotificationSettings.findOne({ userId });

    if (!settings) {
      settings = await NotificationSettings.create({ userId });
    }

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update notification settings
router.put('/settings', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const settings = await NotificationSettings.findOneAndUpdate(
      { userId },
      { ...updates },
      { new: true, upsert: true }
    );

    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Internal: Create notification (called by other services)
router.post('/internal/create', async (req: Request, res: Response) => {
  try {
    const { userId, type, title, body, data } = req.body;

    if (!userId || !type || !title || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check user's notification settings
    const settings = await NotificationSettings.findOne({ userId });

    // Check if this type of notification is enabled
    if (settings) {
      const typeMapping: Record<NotificationType, keyof typeof settings> = {
        LIKE_POST: 'likePosts',
        COMMENT_POST: 'comments',
        SHARE_POST: 'shares',
        FOLLOW: 'follows',
        FRIEND_REQUEST: 'friendRequests',
        FRIEND_ACCEPT: 'friendRequests',
        MENTION: 'mentions',
        GROUP_INVITE: 'groupActivity',
        GROUP_JOIN_REQUEST: 'groupActivity',
        GROUP_POST: 'groupActivity',
        MESSAGE: 'messages',
        SYSTEM: 'pushEnabled',
      };

      const settingKey = typeMapping[type as NotificationType];
      if (settingKey && settings[settingKey] === false) {
        return res.json({ message: 'Notification disabled by user settings' });
      }

      // Check quiet hours
      if (settings.quietHoursEnabled && settings.quietHoursStart && settings.quietHoursEnd) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        if (currentTime >= settings.quietHoursStart && currentTime <= settings.quietHoursEnd) {
          // Still save notification but don't send push
          const notification = await Notification.create({ userId, type, title, body, data });
          return res.json({ notification, pushSent: false, reason: 'quiet_hours' });
        }
      }
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      body,
      data,
    });

    // Send push notification
    const pushSent = await sendPushNotification(userId, title, body, data);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${userId}`).emit('new_notification', notification);
    }

    res.status(201).json({ notification, pushSent });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Helper function to send push notification
async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: any
): Promise<boolean> {
  try {
    const tokens = await DeviceToken.find({ userId, isActive: true });

    if (tokens.length === 0) {
      return false;
    }

    // Firebase Admin SDK would be used here
    // For now, just log and return true
    console.log(`Sending push to ${tokens.length} devices for user ${userId}`);

    // Example Firebase implementation:
    // const admin = require('firebase-admin');
    // const messages = tokens.map(t => ({
    //   notification: { title, body },
    //   data: data || {},
    //   token: t.token,
    // }));
    // await admin.messaging().sendAll(messages);

    return true;
  } catch (error) {
    console.error('Push notification error:', error);
    return false;
  }
}

export default router;
