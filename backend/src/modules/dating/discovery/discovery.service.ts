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

<<<<<<< HEAD
// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

=======
>>>>>>> f9b4a30b4e403563d001bd67d7b7646e7fd223c6
export class DiscoveryService {
  async getCandidates(userId: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

<<<<<<< HEAD
    // Ensure current user has a dating profile + get gender preference
=======
    // Ensure current user has a dating profile + get preferences
>>>>>>> f9b4a30b4e403563d001bd67d7b7646e7fd223c6
    const myProfile = await prisma.datingProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        preferences: {
<<<<<<< HEAD
          select: { gender: true },
=======
          select: { gender: true, ageMin: true, ageMax: true },
>>>>>>> f9b4a30b4e403563d001bd67d7b7646e7fd223c6
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

<<<<<<< HEAD
    // Apply gender preference filter
    const preferredGender = myProfile.preferences?.gender;
    if (preferredGender) {
      where.user = {
        gender: preferredGender,
      };
=======
    // Build user filter (gender + age)
    const userFilter: Prisma.UserWhereInput = {};

    // Apply gender preference filter
    const preferredGender = myProfile.preferences?.gender;
    if (preferredGender) {
      userFilter.gender = preferredGender;
    }

    // Apply age preference filter
    const ageMin = myProfile.preferences?.ageMin;
    const ageMax = myProfile.preferences?.ageMax;
    if (ageMin || ageMax) {
      const now = new Date();
      userFilter.dateOfBirth = {};
      if (ageMax) {
        // ageMax years old → born on or after this date
        const minBirthDate = new Date(now.getFullYear() - ageMax - 1, now.getMonth(), now.getDate());
        userFilter.dateOfBirth.gte = minBirthDate;
      }
      if (ageMin) {
        // ageMin years old → born on or before this date
        const maxBirthDate = new Date(now.getFullYear() - ageMin, now.getMonth(), now.getDate());
        userFilter.dateOfBirth.lte = maxBirthDate;
      }
    }

    if (Object.keys(userFilter).length > 0) {
      where.user = userFilter;
>>>>>>> f9b4a30b4e403563d001bd67d7b7646e7fd223c6
    }

    const [candidates, total] = await Promise.all([
      prisma.datingProfile.findMany({
        where,
        select: CANDIDATE_CARD_SELECT,
        skip,
        take: l,
<<<<<<< HEAD
=======
        orderBy: { createdAt: 'desc' },
>>>>>>> f9b4a30b4e403563d001bd67d7b7646e7fd223c6
      }),
      prisma.datingProfile.count({ where }),
    ]);

<<<<<<< HEAD
    // Randomize order
    const shuffled = shuffle(candidates);

    return paginate(shuffled, total, p, l);
=======
    return paginate(candidates, total, p, l);
>>>>>>> f9b4a30b4e403563d001bd67d7b7646e7fd223c6
  }
}

export const discoveryService = new DiscoveryService();
