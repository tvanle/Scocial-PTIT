import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import { AppError } from '../../../middleware';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../../shared/constants';
import { parsePagination, paginate } from '../../../shared/utils';

const MATCH_USER_SELECT: Prisma.UserSelect = {
  id: true,
  fullName: true,
  avatar: true,
  dateOfBirth: true,
  gender: true,
};

const MATCH_SELECT: Prisma.DatingMatchSelect = {
  id: true,
  userAId: true,
  userBId: true,
  createdAt: true,
  userA: { select: MATCH_USER_SELECT },
  userB: { select: MATCH_USER_SELECT },
};

export class MatchService {
  async getMatches(userId: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    const where: Prisma.DatingMatchWhereInput = {
      OR: [
        { userAId: userId },
        { userBId: userId },
      ],
    };

    const [matches, total] = await Promise.all([
      prisma.datingMatch.findMany({
        where,
        select: MATCH_SELECT,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.datingMatch.count({ where }),
    ]);

    const mapped = matches.map((match) => {
      const otherUser = match.userAId === userId ? match.userB : match.userA;
      return {
        id: match.id,
        matchedUser: otherUser,
        createdAt: match.createdAt,
      };
    });

    return paginate(mapped, total, p, l);
  }

  async getMatchDetail(userId: string, matchId: string) {
    const match = await prisma.datingMatch.findUnique({
      where: { id: matchId },
      select: MATCH_SELECT,
    });

    if (!match) {
      throw new AppError(ERROR_MESSAGES.MATCH_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (match.userAId !== userId && match.userBId !== userId) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    const otherUser = match.userAId === userId ? match.userB : match.userA;

    return {
      id: match.id,
      matchedUser: otherUser,
      createdAt: match.createdAt,
    };
  }
}

export const matchService = new MatchService();
