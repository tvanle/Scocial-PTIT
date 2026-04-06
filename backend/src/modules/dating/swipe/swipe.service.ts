import { Prisma, PrismaClient, SwipeAction } from '@prisma/client';
import { prisma } from '../../../config/database';
import { AppError } from '../../../middleware';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../../shared/constants';
import subscriptionService from '../payment/subscription.service';
import { pushNotificationService } from '../../../services/push';

// Transaction client type
type PrismaTx = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

const SWIPE_SELECT: Prisma.DatingSwipeSelect = {
  id: true,
  fromUserId: true,
  toUserId: true,
  action: true,
  createdAt: true,
};

const MATCH_SELECT: Prisma.DatingMatchSelect = {
  id: true,
  userAId: true,
  userBId: true,
  createdAt: true,
};

export class SwipeService {
  async swipe(userId: string, targetUserId: string, action: 'LIKE' | 'UNLIKE' | 'SUPER_LIKE') {
    if (userId === targetUserId) {
      throw new AppError(ERROR_MESSAGES.CANNOT_SWIPE_SELF, HTTP_STATUS.BAD_REQUEST);
    }

    // Check swipe/super like limit for FREE users
    const usage = await subscriptionService.getDailyUsage(userId);

    if (action === 'SUPER_LIKE' && !usage.canSuperLike) {
      throw new AppError(
        'Bạn đã hết Super Like hôm nay. Nâng cấp Premium để có thêm Super Like!',
        HTTP_STATUS.FORBIDDEN,
      );
    }

    if (!usage.canSwipe) {
      throw new AppError(
        'Bạn đã hết lượt swipe hôm nay. Nâng cấp Premium để swipe không giới hạn!',
        HTTP_STATUS.FORBIDDEN,
      );
    }

    // Validate both profiles + block check in parallel
    const [myProfile, targetProfile, blockExists] = await Promise.all([
      prisma.datingProfile.findUnique({
        where: { userId },
        select: { id: true, isActive: true },
      }),
      prisma.datingProfile.findUnique({
        where: { userId: targetUserId },
        select: { id: true, isActive: true },
      }),
      prisma.userBlock.findFirst({
        where: {
          OR: [
            { blockerId: userId, blockedUserId: targetUserId },
            { blockerId: targetUserId, blockedUserId: userId },
          ],
        },
        select: { id: true },
      }),
    ]);

    if (!myProfile || !myProfile.isActive) {
      throw new AppError(ERROR_MESSAGES.DATING_PROFILE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (!targetProfile || !targetProfile.isActive) {
      throw new AppError(ERROR_MESSAGES.DATING_PROFILE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (blockExists) {
      throw new AppError(ERROR_MESSAGES.BLOCKED_USER, HTTP_STATUS.FORBIDDEN);
    }

    if (action === 'LIKE') {
      const result = await this.swipeWithMatchCheck(userId, targetUserId, SwipeAction.LIKE);
      // Increment swipe count after successful LIKE
      await subscriptionService.incrementSwipeCount(userId);

      // Send push notification (async, don't wait)
      if (result.matched) {
        // Send match notification to both users
        pushNotificationService.sendMatchNotification(userId, targetUserId).catch(console.error);
        pushNotificationService.sendMatchNotification(targetUserId, userId).catch(console.error);
      } else {
        // Send like notification
        pushNotificationService.sendLikeNotification(userId, targetUserId).catch(console.error);
      }

      return result;
    }

    if (action === 'SUPER_LIKE') {
      const result = await this.swipeWithMatchCheck(userId, targetUserId, SwipeAction.SUPER_LIKE);
      // Increment super like count
      await subscriptionService.incrementSuperLikeCount(userId);
      // Also increment swipe count
      await subscriptionService.incrementSwipeCount(userId);

      // Send push notification (async, don't wait)
      if (result.matched) {
        // Send match notification to both users
        pushNotificationService.sendMatchNotification(userId, targetUserId).catch(console.error);
        pushNotificationService.sendMatchNotification(targetUserId, userId).catch(console.error);
      } else {
        // Send Super Like notification
        pushNotificationService.sendSuperLikeNotification(userId, targetUserId).catch(console.error);
      }

      // Also send in-app notification for Super Like
      await this.sendSuperLikeNotification(userId, targetUserId);

      return { ...result, isSuperLike: true };
    }

    const swipe = await prisma.datingSwipe.upsert({
      where: {
        fromUserId_toUserId: { fromUserId: userId, toUserId: targetUserId },
      },
      update: { action: SwipeAction.UNLIKE },
      create: { fromUserId: userId, toUserId: targetUserId, action: SwipeAction.UNLIKE },
      select: SWIPE_SELECT,
    });

    // Increment swipe count after successful UNLIKE
    await subscriptionService.incrementSwipeCount(userId);

    return { swipe, matched: false, match: null };
  }

  /**
   * Send Super Like notification to target user
   */
  private async sendSuperLikeNotification(fromUserId: string, toUserId: string) {
    await prisma.notification.create({
      data: {
        type: 'SUPER_LIKE',
        senderId: fromUserId,
        receiverId: toUserId,
        content: 'Ai đó đã Super Like bạn! 🌟',
      },
    });
  }

  /**
   * Rewind - Undo the last swipe (Premium only)
   */
  async rewind(userId: string) {
    // Check if user can rewind (Premium feature)
    const usage = await subscriptionService.getDailyUsage(userId);
    if (!usage.canRewind) {
      throw new AppError(
        'Tính năng Quay lại chỉ dành cho Premium. Nâng cấp ngay!',
        HTTP_STATUS.FORBIDDEN,
      );
    }

    // Get the last swipe from this user
    const lastSwipe = await prisma.datingSwipe.findFirst({
      where: { fromUserId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        toUserId: true,
        action: true,
        createdAt: true,
      },
    });

    if (!lastSwipe) {
      throw new AppError('Không có hành động nào để quay lại', HTTP_STATUS.NOT_FOUND);
    }

    // Check if this swipe was within last 5 minutes (optional time limit)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (lastSwipe.createdAt < fiveMinutesAgo) {
      throw new AppError('Chỉ có thể quay lại trong vòng 5 phút', HTTP_STATUS.FORBIDDEN);
    }

    // Delete the swipe
    await prisma.datingSwipe.delete({
      where: { id: lastSwipe.id },
    });

    // If it was a LIKE or SUPER_LIKE that resulted in a match, also delete the match
    if (lastSwipe.action === 'LIKE' || lastSwipe.action === 'SUPER_LIKE') {
      const [userAId, userBId] =
        userId < lastSwipe.toUserId
          ? [userId, lastSwipe.toUserId]
          : [lastSwipe.toUserId, userId];

      await prisma.datingMatch.deleteMany({
        where: { userAId, userBId },
      });
    }

    // Increment rewind count
    await subscriptionService.incrementRewindCount(userId);

    // Get the profile of the rewound user to return
    const rewindedProfile = await prisma.datingProfile.findUnique({
      where: { userId: lastSwipe.toUserId },
      select: {
        userId: true,
        bio: true,
        latitude: true,
        longitude: true,
        photos: {
          select: { url: true, order: true },
          orderBy: { order: 'asc' },
        },
        prompts: {
          select: { question: true, answer: true },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            dateOfBirth: true,
            gender: true,
            studentId: true,
          },
        },
        lifestyle: {
          select: { education: true },
        },
      },
    });

    return {
      success: true,
      rewindedProfile,
      message: 'Đã quay lại thành công!',
    };
  }

  private async swipeWithMatchCheck(userId: string, targetUserId: string, action: SwipeAction = SwipeAction.LIKE) {
    return prisma.$transaction(async (tx) => {
      const swipe = await tx.datingSwipe.upsert({
        where: {
          fromUserId_toUserId: { fromUserId: userId, toUserId: targetUserId },
        },
        update: { action },
        create: { fromUserId: userId, toUserId: targetUserId, action },
        select: SWIPE_SELECT,
      });

      // Check reciprocal LIKE or SUPER_LIKE
      const reciprocal = await tx.datingSwipe.findFirst({
        where: {
          fromUserId: targetUserId,
          toUserId: userId,
          action: { in: ['LIKE', 'SUPER_LIKE'] },
        },
        select: { id: true },
      });

      if (!reciprocal) {
        return { swipe, matched: false, match: null };
      }

      // Deterministic ordering
      const [userAId, userBId] =
        userId < targetUserId
          ? [userId, targetUserId]
          : [targetUserId, userId];

      // Create match — handle race condition (P2002 = unique constraint)
      try {
        const match = await tx.datingMatch.create({
          data: { userAId, userBId },
          select: MATCH_SELECT,
        });

        // Post-match: create conversation + notifications (same tx)
        await this.onMatchCreated(tx, match.id, userId, targetUserId);

        return { swipe, matched: true, match };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          // Match already exists (race condition) — skip side effects
          const match = await tx.datingMatch.findUnique({
            where: { userAId_userBId: { userAId, userBId } },
            select: MATCH_SELECT,
          });

          return { swipe, matched: true, match };
        }
        throw error;
      }
    });
  }

  /**
   * Post-match side effects: tạo conversation + gửi notification
   * Chạy trong cùng transaction để đảm bảo atomicity
   */
  private async onMatchCreated(
    tx: PrismaTx,
    matchId: string,
    userId: string,
    targetUserId: string,
  ) {
    const [participantAId, participantBId] = [userId, targetUserId].sort();

    const conversation = await tx.conversation.create({
      data: {
        type: 'PRIVATE',
        context: 'DATING',
        participantAId,
        participantBId,
      },
    });

    await tx.conversationParticipant.createMany({
      data: [
        { conversationId: conversation.id, userId },
        { conversationId: conversation.id, userId: targetUserId },
      ],
    });

    // 2. Gửi notification MATCH_CREATED cho cả 2 user
    await tx.notification.createMany({
      data: [
        {
          type: 'MATCH_CREATED',
          senderId: targetUserId,
          receiverId: userId,
          referenceId: matchId,
          content: SUCCESS_MESSAGES.MATCH_CREATED,
        },
        {
          type: 'MATCH_CREATED',
          senderId: userId,
          receiverId: targetUserId,
          referenceId: matchId,
          content: SUCCESS_MESSAGES.MATCH_CREATED,
        },
      ],
    });
  }

  async getIncomingLikes(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    // Check if user can see likes (Premium feature)
    const canSeeLikes = await subscriptionService.canSeeLikes(userId);

    const [swipes, total] = await Promise.all([
      prisma.datingSwipe.findMany({
        where: {
          toUserId: userId,
          action: { in: [SwipeAction.LIKE, SwipeAction.SUPER_LIKE] },
        },
        select: {
          fromUserId: true,
          action: true,
          createdAt: true,
        },
        // Super likes first, then by date
        orderBy: [
          { action: 'desc' }, // SUPER_LIKE > LIKE alphabetically reversed
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.datingSwipe.count({
        where: {
          toUserId: userId,
          action: { in: [SwipeAction.LIKE, SwipeAction.SUPER_LIKE] },
        },
      }),
    ]);

    const userIds = swipes.map((s) => s.fromUserId);

    if (userIds.length === 0) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total,
          totalPages: 0,
        },
      };
    }

    // Exclude users that you have already liked back (mutual LIKE -> match)
    const myLikes = await prisma.datingSwipe.findMany({
      where: {
        fromUserId: userId,
        toUserId: { in: userIds },
        action: { in: [SwipeAction.LIKE, SwipeAction.SUPER_LIKE] },
      },
      select: {
        toUserId: true,
      },
    });

    // Build a map of userId -> isSuperLike
    const superLikeMap = new Map<string, boolean>();
    swipes.forEach((s) => {
      superLikeMap.set(s.fromUserId, s.action === 'SUPER_LIKE');
    });

    const matchedUserIds = new Set(myLikes.map((s) => s.toUserId));

    const filteredUserIds = userIds.filter((id) => !matchedUserIds.has(id));

    if (filteredUserIds.length === 0) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const profiles = await prisma.datingProfile.findMany({
      where: { userId: { in: filteredUserIds }, isActive: true },
      select: {
        userId: true,
        bio: true,
        latitude: true,
        longitude: true,
        photos: {
          select: { url: true, order: true },
          orderBy: { order: 'asc' },
        },
        prompts: {
          select: { question: true, answer: true },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            dateOfBirth: true,
            gender: true,
            studentId: true,
            lastActiveAt: true,
          },
        },
        lifestyle: {
          select: { education: true },
        },
      },
    });

    const data = profiles.map((p) => ({
      userId: p.userId,
      bio: canSeeLikes ? p.bio : null,
      photos: canSeeLikes ? p.photos : p.photos.map((photo) => ({ ...photo, blurred: true })),
      prompts: canSeeLikes ? p.prompts : [],
      user: canSeeLikes
        ? p.user
        : {
            ...p.user,
            fullName: '???',
            avatar: p.user.avatar, // Keep avatar but will be blurred on frontend
          },
      lifestyle: canSeeLikes ? p.lifestyle : null,
      distanceKm: null as number | null,
      isBlurred: !canSeeLikes,
      isSuperLike: superLikeMap.get(p.userId) ?? false,
    }));

    return {
      data,
      canSeeLikes,
      pagination: {
        page,
        limit,
        total: filteredUserIds.length,
        totalPages: Math.ceil(filteredUserIds.length / limit),
      },
    };
  }

  async getSentLikes(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [swipes, total] = await Promise.all([
      prisma.datingSwipe.findMany({
        where: {
          fromUserId: userId,
          action: SwipeAction.LIKE,
        },
        select: {
          toUserId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.datingSwipe.count({
        where: {
          fromUserId: userId,
          action: SwipeAction.LIKE,
        },
      }),
    ]);

    const userIds = swipes.map((s) => s.toUserId);

    const profiles = await prisma.datingProfile.findMany({
      where: { userId: { in: userIds }, isActive: true },
      select: {
        userId: true,
        bio: true,
        latitude: true,
        longitude: true,
        photos: {
          select: { url: true, order: true },
          orderBy: { order: 'asc' },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            dateOfBirth: true,
            gender: true,
            studentId: true,
            lastActiveAt: true,
          },
        },
        lifestyle: {
          select: { education: true },
        },
      },
    });

    const data = profiles.map((p) => ({
      userId: p.userId,
      bio: p.bio,
      photos: p.photos,
      user: p.user,
      lifestyle: p.lifestyle,
      distanceKm: null as number | null,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const swipeService = new SwipeService();
