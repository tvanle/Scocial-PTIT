import { Prisma, PrismaClient, SwipeAction } from '@prisma/client';
import { prisma } from '../../../config/database';
import { AppError } from '../../../middleware';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../../shared/constants';

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
  async swipe(userId: string, targetUserId: string, action: 'LIKE' | 'UNLIKE') {
    if (userId === targetUserId) {
      throw new AppError(ERROR_MESSAGES.CANNOT_SWIPE_SELF, HTTP_STATUS.BAD_REQUEST);
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
      return this.swipeWithMatchCheck(userId, targetUserId);
    }

    const swipe = await prisma.datingSwipe.upsert({
      where: {
        fromUserId_toUserId: { fromUserId: userId, toUserId: targetUserId },
      },
      update: { action: SwipeAction.UNLIKE },
      create: { fromUserId: userId, toUserId: targetUserId, action: SwipeAction.UNLIKE },
      select: SWIPE_SELECT,
    });

    return { swipe, matched: false, match: null };
  }

  private async swipeWithMatchCheck(userId: string, targetUserId: string) {
    return prisma.$transaction(async (tx) => {
      const swipe = await tx.datingSwipe.upsert({
        where: {
          fromUserId_toUserId: { fromUserId: userId, toUserId: targetUserId },
        },
        update: { action: SwipeAction.LIKE },
        create: { fromUserId: userId, toUserId: targetUserId, action: SwipeAction.LIKE },
        select: SWIPE_SELECT,
      });

      // Check reciprocal LIKE
      const reciprocal = await tx.datingSwipe.findFirst({
        where: {
          fromUserId: targetUserId,
          toUserId: userId,
          action: 'LIKE',
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
    // 1. Tạo PRIVATE conversation giữa 2 user đã match
    const conversation = await tx.conversation.create({
      data: { type: 'PRIVATE' },
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

    const [swipes, total] = await Promise.all([
      prisma.datingSwipe.findMany({
        where: {
          toUserId: userId,
          action: SwipeAction.LIKE,
        },
        select: {
          fromUserId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.datingSwipe.count({
        where: {
          toUserId: userId,
          action: SwipeAction.LIKE,
        },
      }),
    ]);

    const userIds = swipes.map((s) => s.fromUserId);

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
