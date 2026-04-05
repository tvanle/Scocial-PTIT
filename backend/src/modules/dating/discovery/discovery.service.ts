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
  latitude: true,
  longitude: true,
  photos: {
    select: { url: true, order: true },
    orderBy: { order: 'asc' as const },
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
} as const;

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

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

    const whereBase: Prisma.DatingProfileWhereInput = {
      userId: { notIn: excludeIds },
      isActive: true,
      photos: { some: {} },
    };

    const prefs = myProfile.preferences;
    const hasPreferences = !!prefs;

    if (hasPreferences) {
      // Lọc theo giới tính (và độ tuổi) trước ở DB, sau đó mới tính điểm theo preference khác trong fetchWithScoring
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

      const whereWithPrefs =
        Object.keys(userFilter).length > 0
          ? { ...whereBase, user: userFilter }
          : whereBase;

      const countWithPrefs = await prisma.datingProfile.count({ where: whereWithPrefs });
      const whereToUse = countWithPrefs > 0 ? whereWithPrefs : whereBase;

      return this.fetchWithScoring(whereToUse, prefs, myUser?.studentId ?? null, myProfile, p, l);
    }
    return this.fetchDefault(whereBase, p, l, myProfile);
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
    const paged = scored.slice(start, start + limit).map(({ score, ...rest }) => {
      const candidate = rest as { latitude?: number | null; longitude?: number | null };
      const distanceKm: number | null =
        myProfile.latitude != null &&
        myProfile.longitude != null &&
        candidate.latitude != null &&
        candidate.longitude != null
          ? haversineKm(
              myProfile.latitude,
              myProfile.longitude,
              candidate.latitude,
              candidate.longitude,
            )
          : null;
      const { latitude, longitude, ...out } = candidate;
      return { ...out, distanceKm };
    });

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
    myProfile: { latitude: number | null; longitude: number | null },
  ) {
    const skip = (page - 1) * limit;

    const [rawCandidates, total] = await Promise.all([
      prisma.datingProfile.findMany({
        where,
        select: CANDIDATE_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.datingProfile.count({ where }),
    ]);

    const myLat = myProfile.latitude;
    const myLng = myProfile.longitude;

    const candidates = rawCandidates.map((c: { latitude?: number | null; longitude?: number | null }) => {
      const distanceKm: number | null =
        myLat != null && myLng != null && c.latitude != null && c.longitude != null
          ? haversineKm(myLat, myLng, c.latitude, c.longitude)
          : null;
      const { latitude, longitude, ...rest } = c;
      return { ...rest, distanceKm };
    });

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
