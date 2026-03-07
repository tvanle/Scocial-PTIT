import { DatingPreferences, Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import { AppError } from '../../../middleware';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../../shared/constants';
import { parsePagination } from '../../../shared/utils';
import { scoreCandidates } from './scoring.service';

const DISCOVERY_CONFIG = {
  poolMultiplier: 5,
  poolMinSize: 50,
} as const;

const CANDIDATE_SELECT = {
  userId: true,
  bio: true,
  photos: {
    select: { url: true, order: true },
    orderBy: { order: 'asc' as const },
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
} as const;

export class DiscoveryService {
  async getCandidates(userId: string, page?: string, limit?: string) {
    const { page: p, limit: l } = parsePagination(page, limit);

    const [myProfile, myUser] = await Promise.all([
      prisma.datingProfile.findUnique({
        where: { userId },
        select: {
          id: true,
          latitude: true,
          longitude: true,
          preferences: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { studentId: true },
      }),
    ]);

    if (!myProfile) {
      throw new AppError(ERROR_MESSAGES.DATING_PROFILE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const [swipedUsers, blockedRelations] = await Promise.all([
      prisma.datingSwipe.findMany({
        where: { fromUserId: userId },
        select: { toUserId: true },
      }),
      prisma.userBlock.findMany({
        where: {
          OR: [{ blockerId: userId }, { blockedUserId: userId }],
        },
        select: { blockerId: true, blockedUserId: true },
      }),
    ]);

    const blockedIds = blockedRelations.map((b) =>
      b.blockerId === userId ? b.blockedUserId : b.blockerId,
    );
    const excludeIds = [
      ...new Set([userId, ...swipedUsers.map((s) => s.toUserId), ...blockedIds]),
    ];

    const where: Prisma.DatingProfileWhereInput = {
      userId: { notIn: excludeIds },
      isActive: true,
      photos: { some: {} },
    };

    const prefs = myProfile.preferences;
    const hasPreferences = !!prefs;

    if (hasPreferences) {
      const userFilter: Prisma.UserWhereInput = {};

      if (prefs.gender) {
        userFilter.gender = prefs.gender;
      }

      if (prefs.ageMin || prefs.ageMax) {
        const now = new Date();
        userFilter.dateOfBirth = {};
        if (prefs.ageMax) {
          userFilter.dateOfBirth.gte = new Date(
            now.getFullYear() - prefs.ageMax - 1, now.getMonth(), now.getDate(),
          );
        }
        if (prefs.ageMin) {
          userFilter.dateOfBirth.lte = new Date(
            now.getFullYear() - prefs.ageMin, now.getMonth(), now.getDate(),
          );
        }
      }

      if (Object.keys(userFilter).length > 0) {
        where.user = userFilter;
      }
    }

    if (hasPreferences) {
      return this.fetchWithScoring(where, prefs, myUser?.studentId ?? null, myProfile, p, l);
    }
    return this.fetchDefault(where, p, l);
  }

  private async fetchWithScoring(
    where: Prisma.DatingProfileWhereInput,
    prefs: DatingPreferences,
    myStudentId: string | null,
    myProfile: { latitude: number | null; longitude: number | null },
    page: number,
    limit: number,
  ) {
    const poolSize = Math.max(
      limit * DISCOVERY_CONFIG.poolMultiplier,
      DISCOVERY_CONFIG.poolMinSize,
    );

    const [pool, total] = await Promise.all([
      prisma.datingProfile.findMany({
        where,
        select: CANDIDATE_SELECT,
        take: poolSize,
      }),
      prisma.datingProfile.count({ where }),
    ]);

    const scored = scoreCandidates(pool as any, {
      preferences: prefs as any,
      myStudentId,
      myLatitude: myProfile.latitude,
      myLongitude: myProfile.longitude,
    });

    const start = (page - 1) * limit;
    const paged = scored.slice(start, start + limit).map(({ score, ...rest }) => rest);

    return {
      data: paged,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async fetchDefault(
    where: Prisma.DatingProfileWhereInput,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    const [candidates, total] = await Promise.all([
      prisma.datingProfile.findMany({
        where,
        select: CANDIDATE_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.datingProfile.count({ where }),
    ]);

    return {
      data: candidates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const discoveryService = new DiscoveryService();
