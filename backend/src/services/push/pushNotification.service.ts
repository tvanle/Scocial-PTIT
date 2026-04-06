/**
 * Push Notification Service
 * Sends push notifications via Expo Push API
 */

import { prisma } from '../../config/database';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
}

export interface PushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
}

class PushNotificationService {
  /**
   * Register device token
   */
  async registerDevice(userId: string, token: string, platform: string): Promise<void> {
    // Upsert device token
    await prisma.deviceToken.upsert({
      where: { token },
      create: {
        userId,
        token,
        platform,
        isActive: true,
      },
      update: {
        userId,
        platform,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    console.log(`[Push] Device registered: ${platform} for user ${userId}`);
  }

  /**
   * Unregister device token
   */
  async unregisterDevice(userId: string, token?: string): Promise<void> {
    if (token) {
      await prisma.deviceToken.updateMany({
        where: { userId, token },
        data: { isActive: false },
      });
    } else {
      // Unregister all devices for user
      await prisma.deviceToken.updateMany({
        where: { userId },
        data: { isActive: false },
      });
    }

    console.log(`[Push] Device unregistered for user ${userId}`);
  }

  /**
   * Get active device tokens for user
   */
  async getUserTokens(userId: string): Promise<string[]> {
    const devices = await prisma.deviceToken.findMany({
      where: { userId, isActive: true },
      select: { token: true },
    });
    return devices.map((d) => d.token);
  }

  /**
   * Send push notification to user
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const tokens = await this.getUserTokens(userId);

    if (tokens.length === 0) {
      console.log(`[Push] No active tokens for user ${userId}`);
      return;
    }

    const messages: PushMessage[] = tokens.map((token) => ({
      to: token,
      title,
      body,
      data,
      sound: 'default',
      priority: 'high',
      channelId: 'dating',
    }));

    await this.sendMessages(messages);
  }

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const devices = await prisma.deviceToken.findMany({
      where: {
        userId: { in: userIds },
        isActive: true,
      },
      select: { token: true },
    });

    if (devices.length === 0) {
      console.log('[Push] No active tokens for users');
      return;
    }

    const messages: PushMessage[] = devices.map((d) => ({
      to: d.token,
      title,
      body,
      data,
      sound: 'default',
      priority: 'high',
      channelId: 'dating',
    }));

    await this.sendMessages(messages);
  }

  /**
   * Send messages via Expo Push API
   */
  private async sendMessages(messages: PushMessage[]): Promise<PushTicket[]> {
    if (messages.length === 0) return [];

    try {
      // Expo recommends sending in batches of 100
      const chunks = this.chunkArray(messages, 100);
      const tickets: PushTicket[] = [];

      for (const chunk of chunks) {
        const response = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });

        const result = (await response.json()) as { data?: PushTicket[] };

        if (result.data) {
          tickets.push(...result.data);

          // Handle invalid tokens
          result.data.forEach((ticket: PushTicket, index: number) => {
            if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
              // Deactivate invalid token
              this.deactivateToken(chunk[index].to);
            }
          });
        }
      }

      console.log(`[Push] Sent ${messages.length} notifications`);
      return tickets;
    } catch (error) {
      console.error('[Push] Send error:', error);
      return [];
    }
  }

  /**
   * Deactivate invalid token
   */
  private async deactivateToken(token: string): Promise<void> {
    await prisma.deviceToken.updateMany({
      where: { token },
      data: { isActive: false },
    });
    console.log(`[Push] Deactivated invalid token: ${token.substring(0, 20)}...`);
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // ============== DATING NOTIFICATION HELPERS ==============

  /**
   * Send notification when someone likes you
   */
  async sendLikeNotification(fromUserId: string, toUserId: string): Promise<void> {
    const sender = await prisma.user.findUnique({
      where: { id: fromUserId },
      select: { fullName: true },
    });

    await this.sendToUser(
      toUserId,
      'Ai do da thich ban! 💕',
      'Nang cap Premium de xem nguoi ay la ai',
      {
        type: 'like',
        fromUserId,
      },
    );
  }

  /**
   * Send notification when someone super likes you
   */
  async sendSuperLikeNotification(fromUserId: string, toUserId: string): Promise<void> {
    const sender = await prisma.user.findUnique({
      where: { id: fromUserId },
      select: { fullName: true },
    });

    await this.sendToUser(
      toUserId,
      'Ban nhan duoc Super Like! 🌟',
      `${sender?.fullName ?? 'Ai do'} da Super Like ban!`,
      {
        type: 'super_like',
        fromUserId,
      },
    );
  }

  /**
   * Send notification when match is created
   */
  async sendMatchNotification(userId: string, matchedUserId: string): Promise<void> {
    const matchedUser = await prisma.user.findUnique({
      where: { id: matchedUserId },
      select: { fullName: true, avatar: true },
    });

    await this.sendToUser(
      userId,
      'Ban co Match moi! 🎉',
      `Ban va ${matchedUser?.fullName ?? 'ai do'} da match. Bat dau tro chuyen ngay!`,
      {
        type: 'match',
        matchedUserId,
      },
    );
  }

  /**
   * Send notification for new message
   */
  async sendMessageNotification(
    toUserId: string,
    fromUserId: string,
    conversationId: string,
    messagePreview: string,
  ): Promise<void> {
    const sender = await prisma.user.findUnique({
      where: { id: fromUserId },
      select: { fullName: true },
    });

    await this.sendToUser(
      toUserId,
      sender?.fullName ?? 'Tin nhan moi',
      messagePreview.length > 50 ? messagePreview.substring(0, 50) + '...' : messagePreview,
      {
        type: 'message',
        fromUserId,
        conversationId,
      },
    );
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
