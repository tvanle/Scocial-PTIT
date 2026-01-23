import { prisma } from '../../config/database';
import { parsePagination, paginate } from '../../shared/utils';

export class NotificationService {
  // Get user notifications
  async getNotifications(userId: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    const where = { receiverId: userId };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
            },
          },
        },
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return paginate(notifications, total, p, l);
  }

  // Get unread count
  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    return { unreadCount: count };
  }

  // Mark as read
  async markAsRead(notificationId: string, userId: string) {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        receiverId: userId,
      },
      data: { isRead: true },
    });
  }

  // Mark all as read
  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: {
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  // Delete notification
  async deleteNotification(notificationId: string, userId: string) {
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        receiverId: userId,
      },
    });
  }

  // Clear all notifications
  async clearAll(userId: string) {
    await prisma.notification.deleteMany({
      where: { receiverId: userId },
    });
  }
}

export const notificationService = new NotificationService();
