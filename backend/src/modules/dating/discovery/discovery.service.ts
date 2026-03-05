import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import { AppError } from '../../../middleware';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../../shared/constants';
import { parsePagination, paginate } from '../../../shared/utils';

const CANDIDATE_CARD_SELECT = {
  userId: true,
  bio: true,
  photos: {
    select: { url: true },
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

    const swipedUsers = await prisma.datingSwipe.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true },
    });
    const excludeIds = [userId, ...swipedUsers.map((s) => s.toUserId)];

    const where: Prisma.DatingProfileWhereInput = {
      userId: { notIn: excludeIds },
      isActive: true,
      photos: { some: {} },
    };

    const userFilter: Prisma.UserWhereInput = {};

    const preferredGender = myProfile.preferences?.gender;
    if (preferredGender) {
      userFilter.gender = preferredGender;
    }

    const ageMin = myProfile.preferences?.ageMin;
    const ageMax = myProfile.preferences?.ageMax;
    if (ageMin || ageMax) {
      const now = new Date();
      userFilter.dateOfBirth = {};
      if (ageMax) {
        userFilter.dateOfBirth.gte = new Date(now.getFullYear() - ageMax - 1, now.getMonth(), now.getDate());
      }
      if (ageMin) {
        userFilter.dateOfBirth.lte = new Date(now.getFullYear() - ageMin, now.getMonth(), now.getDate());
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
