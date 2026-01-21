import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { PaginatedResponse, UpdateProfileInput } from '../types';
import { ERROR_MESSAGES } from '../constants';

const prisma = new PrismaClient();

class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            friendships: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return {
      ...user,
      friendsCount: user._count.friendships,
      followersCount: user._count.followers,
      followingCount: user._count.following,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        birthday: data.birthday ? new Date(data.birthday) : undefined,
      },
    });

    return user;
  }

  async getUserById(id: string, currentUserId?: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            friendships: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    let relationshipStatus = {
      isFriend: false,
      isFollowing: false,
      friendRequestSent: false,
      friendRequestReceived: false,
    };

    if (currentUserId && currentUserId !== id) {
      const [friendship, follow, sentRequest, receivedRequest] = await Promise.all([
        prisma.friendship.findFirst({
          where: {
            OR: [
              { userId: currentUserId, friendId: id },
              { userId: id, friendId: currentUserId },
            ],
          },
        }),
        prisma.follow.findFirst({
          where: { followerId: currentUserId, followingId: id },
        }),
        prisma.friendRequest.findFirst({
          where: { senderId: currentUserId, receiverId: id, status: 'PENDING' },
        }),
        prisma.friendRequest.findFirst({
          where: { senderId: id, receiverId: currentUserId, status: 'PENDING' },
        }),
      ]);

      relationshipStatus = {
        isFriend: !!friendship,
        isFollowing: !!follow,
        friendRequestSent: !!sentRequest,
        friendRequestReceived: !!receivedRequest,
      };
    }

    return {
      ...user,
      friendsCount: user._count.friendships,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      ...relationshipStatus,
    };
  }

  async searchUsers(query: string, currentUserId: string, page: number, limit: number): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * limit;

    const whereClause = {
      OR: [
        { fullName: { contains: query, mode: 'insensitive' as const } },
        { studentId: { contains: query, mode: 'insensitive' as const } },
        { email: { contains: query, mode: 'insensitive' as const } },
      ],
      id: { not: currentUserId },
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { fullName: 'asc' },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async updateAvatar(userId: string, url: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: url },
    });
    return { url: user.avatar };
  }

  async updateCover(userId: string, url: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { coverPhoto: url },
    });
    return { url: user.coverPhoto };
  }

  async getSuggestions(userId: string, limit: number) {
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        NOT: {
          OR: [
            { friendships: { some: { friendId: userId } } },
            { friendOf: { some: { userId: userId } } },
            { blockedBy: { some: { blockerId: userId } } },
            { blockedUsers: { some: { blockedId: userId } } },
          ],
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }
}

export const userService = new UserService();
