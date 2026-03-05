import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import { AppError } from '../../../middleware';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../../shared/constants';
import { parsePagination, paginate } from '../../../shared/utils';
import { UpdateLocationInput } from './location.schema';

const EARTH_RADIUS_KM = 6371;

interface NearbyUserRow {
  user_id: string;
  full_name: string | null;
  avatar: string | null;
  date_of_birth: Date | null;
  gender: string | null;
  bio: string | null;
  first_photo_url: string | null;
  distance: number;
  total_count: bigint;
}

export class LocationService {
  async updateLocation(userId: string, data: UpdateLocationInput) {
    try {
      const updated = await prisma.datingProfile.update({
        where: { userId },
        data: {
          latitude: data.latitude,
          longitude: data.longitude,
          locationUpdatedAt: new Date(),
        },
        select: {
          userId: true,
          latitude: true,
          longitude: true,
          locationUpdatedAt: true,
        },
      });

      return updated;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new AppError(ERROR_MESSAGES.DATING_PROFILE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }
      throw error;
    }
  }

  /**
   * CTE-based Haversine query – find nearby dating profiles.
   * Uses a bounding box pre-filter, then exact Haversine in outer WHERE.
   * Single query returns data + total_count via window function.
   */
  async findNearbyUsers(
    userId: string,
    maxDistanceKm: number = 50,
    page?: string,
    limit?: string,
  ) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    const myProfile = await prisma.datingProfile.findUnique({
      where: { userId },
      select: {
        latitude: true,
        longitude: true,
        preferences: {
          select: { gender: true, ageMin: true, ageMax: true, maxDistance: true },
        },
      },
    });

    if (!myProfile) {
      throw new AppError(ERROR_MESSAGES.DATING_PROFILE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (myProfile.latitude === null || myProfile.longitude === null) {
      throw new AppError(
        'Vui lòng cập nhật vị trí trước khi tìm kiếm',
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const effectiveDistance = myProfile.preferences?.maxDistance ?? maxDistanceKm;
    const myLat = myProfile.latitude;
    const myLng = myProfile.longitude;

    const swipedUsers = await prisma.datingSwipe.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true },
    });
    const excludeIds = [userId, ...swipedUsers.map((s) => s.toUserId)];

    const blockedRelations = await prisma.userBlock.findMany({
      where: {
        OR: [
          { blockerId: userId },
          { blockedUserId: userId },
        ],
      },
      select: { blockerId: true, blockedUserId: true },
    });
    const blockedIds = blockedRelations.map((b) =>
      b.blockerId === userId ? b.blockedUserId : b.blockerId,
    );
    const allExcludeIds = [...new Set([...excludeIds, ...blockedIds])];

    const now = new Date();
    const preferredGender = myProfile.preferences?.gender ?? null;
    const ageMin = myProfile.preferences?.ageMin ?? 18;
    const ageMax = myProfile.preferences?.ageMax ?? 99;
    const minBirthDate = new Date(now.getFullYear() - ageMax - 1, now.getMonth(), now.getDate());
    const maxBirthDate = new Date(now.getFullYear() - ageMin, now.getMonth(), now.getDate());

    // Bounding box pre-filter: 1 degree latitude ≈ 111 km
    const latDelta = effectiveDistance / 111.0;
    const lngDelta = effectiveDistance / (111.0 * Math.cos((myLat * Math.PI) / 180));

    // Single CTE query: compute distance in inner query, filter + paginate in outer,
    // window function for total count to avoid a second round-trip.
    const rows = await prisma.$queryRaw<NearbyUserRow[]>`
      WITH nearby AS (
        SELECT
          u.id AS user_id,
          u."fullName" AS full_name,
          u.avatar,
          u."dateOfBirth" AS date_of_birth,
          u.gender,
          dp.bio,
          (
            SELECT dpp.url FROM "DatingProfilePhoto" dpp
            WHERE dpp."profileId" = dp.id
            ORDER BY dpp."order" ASC
            LIMIT 1
          ) AS first_photo_url,
          (
            ${EARTH_RADIUS_KM} * acos(
              LEAST(1.0, GREATEST(-1.0,
                cos(radians(${myLat}))
                * cos(radians(dp.latitude))
                * cos(radians(dp.longitude) - radians(${myLng}))
                + sin(radians(${myLat}))
                * sin(radians(dp.latitude))
              ))
            )
          ) AS distance
        FROM "DatingProfile" dp
        INNER JOIN "User" u ON u.id = dp."userId"
        WHERE dp."isActive" = true
          AND dp.latitude IS NOT NULL
          AND dp.longitude IS NOT NULL
          AND dp.latitude BETWEEN ${myLat - latDelta} AND ${myLat + latDelta}
          AND dp.longitude BETWEEN ${myLng - lngDelta} AND ${myLng + lngDelta}
          AND dp."userId" != ALL(${allExcludeIds}::text[])
          AND EXISTS (
            SELECT 1 FROM "DatingProfilePhoto" dpp WHERE dpp."profileId" = dp.id
          )
          ${preferredGender ? Prisma.sql`AND u.gender = ${preferredGender}::"Gender"` : Prisma.empty}
          AND (u."dateOfBirth" IS NULL OR (u."dateOfBirth" >= ${minBirthDate} AND u."dateOfBirth" <= ${maxBirthDate}))
      )
      SELECT *, COUNT(*) OVER() AS total_count
      FROM nearby
      WHERE distance <= ${effectiveDistance}
      ORDER BY distance ASC
      LIMIT ${l}
      OFFSET ${skip}
    `;

    const total = Number(rows[0]?.total_count ?? 0);

    const data = rows.map((row) => ({
      userId: row.user_id,
      fullName: row.full_name,
      avatar: row.avatar,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      bio: row.bio,
      firstPhotoUrl: row.first_photo_url,
      distance: Math.round(row.distance * 10) / 10,
    }));

    return paginate(data, total, p, l);
  }
}

export const locationService = new LocationService();
