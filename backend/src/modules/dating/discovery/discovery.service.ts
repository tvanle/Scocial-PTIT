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

export class DiscoveryService {
  async getCandidates(userId: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    // Ensure current user has a dating profile + get preferences
    const myProfile = await prisma.datingProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        preferences: {
          select: { gender: true, ageMin: true, ageMax: true },
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
    }

    const [candidates, total] = await Promise.all([
      prisma.datingProfile.findMany({
        where,
        select: CANDIDATE_CARD_SELECT,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.datingProfile.count({ where }),
    ]);

    return paginate(candidates, total, p, l);
  }
}

export const discoveryService = new DiscoveryService();
