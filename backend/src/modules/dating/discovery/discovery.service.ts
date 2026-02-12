import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import { AppError } from '../../../middleware';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../../shared/constants';
import { parsePagination, paginate } from '../../../shared/utils';

// Card summary only — full detail via GET /dating/profile/:userId
const CANDIDATE_CARD_SELECT = {
  userId: true,
  bio: true,
  photos: {
    select: {
      url: true,
    },
    orderBy: { order: 'asc' as const },
    take: 1,
  },
  user: {
    select: {
      id: true,
      fullName: true,
      avatar: true,
      dateOfBirth: true,
      gender: true,
    },
  },
} as const;

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export class DiscoveryService {
  async getCandidates(userId: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    // Ensure current user has a dating profile + get gender preference
    const myProfile = await prisma.datingProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        preferences: {
          select: { gender: true },
        },
      },
    });

    if (!myProfile) {
      throw new AppError(ERROR_MESSAGES.DATING_PROFILE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Get userIds already swiped by current user
    const swipedUsers = await prisma.datingSwipe.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true },
    });
    const swipedUserIds: string[] = swipedUsers.map((s) => s.toUserId);

    // Exclude: self + already swiped
    const excludeIds = [userId, ...swipedUserIds];

    // Build where condition
    const where: Prisma.DatingProfileWhereInput = {
      userId: { notIn: excludeIds },
      isActive: true,
      photos: { some: {} },
    };

    // Apply gender preference filter
    const preferredGender = myProfile.preferences?.gender;
    if (preferredGender) {
      where.user = {
        gender: preferredGender,
      };
    }

    const [candidates, total] = await Promise.all([
      prisma.datingProfile.findMany({
        where,
        select: CANDIDATE_CARD_SELECT,
        skip,
        take: l,
      }),
      prisma.datingProfile.count({ where }),
    ]);

    // Randomize order
    const shuffled = shuffle(candidates);

    return paginate(shuffled, total, p, l);
  }
}

export const discoveryService = new DiscoveryService();
