import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../../../config/database';
import { AppError } from '../../../middleware';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../../shared/constants';

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
  async swipe(userId: string, targetUserId: string, action: 'LIKE' | 'PASS') {
    // 1. Prevent self swipe
    if (userId === targetUserId) {
      throw new AppError(ERROR_MESSAGES.CANNOT_SWIPE_SELF, HTTP_STATUS.BAD_REQUEST);
    }

    // 2. Prevent duplicate swipe
    const existing = await prisma.datingSwipe.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: userId,
          toUserId: targetUserId,
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw new AppError(ERROR_MESSAGES.ALREADY_SWIPED, HTTP_STATUS.CONFLICT);
    }

    // 3. Validate current user has active dating profile
    const myProfile = await prisma.datingProfile.findUnique({
      where: { userId },
      select: { id: true, isActive: true },
    });

    if (!myProfile || !myProfile.isActive) {
      throw new AppError(ERROR_MESSAGES.DATING_PROFILE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // 4. Ensure target profile exists and isActive
    const targetProfile = await prisma.datingProfile.findUnique({
      where: { userId: targetUserId },
      select: { id: true, isActive: true },
    });

    if (!targetProfile || !targetProfile.isActive) {
      throw new AppError(ERROR_MESSAGES.DATING_PROFILE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // 5. Block relationship check (both directions)
    const blockExists = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedUserId: targetUserId },
          { blockerId: targetUserId, blockedUserId: userId },
        ],
      },
      select: { id: true },
    });

    if (blockExists) {
      throw new AppError(ERROR_MESSAGES.BLOCKED_USER, HTTP_STATUS.FORBIDDEN);
    }

    // 6. Create swipe + mutual match check
    if (action === 'LIKE') {
      return this.swipeWithMatchCheck(userId, targetUserId);
    }

    // PASS — no match logic needed
    const swipe = await prisma.datingSwipe.create({
      data: { fromUserId: userId, toUserId: targetUserId, action: 'PASS' },
      select: SWIPE_SELECT,
    });

    return { swipe, matched: false, match: null };
  }

  private async swipeWithMatchCheck(userId: string, targetUserId: string) {
    return prisma.$transaction(async (tx) => {
      // Create LIKE swipe
      const swipe = await tx.datingSwipe.create({
        data: { fromUserId: userId, toUserId: targetUserId, action: 'LIKE' },
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
          content: 'Bạn có một kết nối mới!',
        },
        {
          type: 'MATCH_CREATED',
          senderId: userId,
          receiverId: targetUserId,
          referenceId: matchId,
          content: 'Bạn có một kết nối mới!',
        },
      ],
    });
  }
}

export const swipeService = new SwipeService();
