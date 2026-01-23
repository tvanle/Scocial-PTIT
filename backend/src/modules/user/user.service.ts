import { prisma } from '../../config/database';
import { AppError } from '../../middleware';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../shared/constants';
import { parsePagination, paginate } from '../../shared/utils';
import { UpdateProfileInput } from './user.validator';

export class UserService {
  // Get user profile by ID
  async getProfile(userId: string, currentUserId?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        studentId: true,
        avatar: true,
        coverImage: true,
        bio: true,
        dateOfBirth: true,
        gender: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Check if current user is following this user
    let isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: userId,
          },
        },
      });
      isFollowing = !!follow;
    }

    return { ...user, isFollowing };
  }

  // Update profile
  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        studentId: true,
        avatar: true,
        coverImage: true,
        bio: true,
        dateOfBirth: true,
        gender: true,
        phone: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return user;
  }

  // Update avatar
  async updateAvatar(userId: string, avatarUrl: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: { id: true, avatar: true },
    });
  }

  // Update cover image
  async updateCoverImage(userId: string, coverUrl: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { coverImage: coverUrl },
      select: { id: true, coverImage: true },
    });
  }

  // Search users
  async searchUsers(query: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    const where = {
      OR: [
        { fullName: { contains: query, mode: 'insensitive' as const } },
        { email: { contains: query, mode: 'insensitive' as const } },
        { studentId: { contains: query, mode: 'insensitive' as const } },
      ],
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          avatar: true,
          studentId: true,
          isVerified: true,
        },
        skip,
        take: l,
        orderBy: { fullName: 'asc' },
      }),
      prisma.user.count({ where }),
    ]);

    return paginate(users, total, p, l);
  }

  // Follow user
  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new AppError(ERROR_MESSAGES.CANNOT_FOLLOW_SELF, HTTP_STATUS.BAD_REQUEST);
    }

    // Check if user exists
    const userToFollow = await prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!userToFollow) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      throw new AppError(ERROR_MESSAGES.ALREADY_FOLLOWING, HTTP_STATUS.CONFLICT);
    }

    // Create follow
    await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        type: 'FOLLOW',
        senderId: followerId,
        receiverId: followingId,
      },
    });
  }

  // Unfollow user
  async unfollowUser(followerId: string, followingId: string) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!follow) {
      throw new AppError(ERROR_MESSAGES.NOT_FOLLOWING, HTTP_STATUS.BAD_REQUEST);
    }

    await prisma.follow.delete({
      where: { id: follow.id },
    });
  }

  // Get followers
  async getFollowers(userId: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    const [followers, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: userId },
        select: {
          follower: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
              studentId: true,
              isVerified: true,
            },
          },
          createdAt: true,
        },
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.count({ where: { followingId: userId } }),
    ]);

    const data = followers.map((f) => ({ ...f.follower, followedAt: f.createdAt }));
    return paginate(data, total, p, l);
  }

  // Get following
  async getFollowing(userId: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    const [following, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        select: {
          following: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
              studentId: true,
              isVerified: true,
            },
          },
          createdAt: true,
        },
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);

    const data = following.map((f) => ({ ...f.following, followedAt: f.createdAt }));
    return paginate(data, total, p, l);
  }
}

export const userService = new UserService();
