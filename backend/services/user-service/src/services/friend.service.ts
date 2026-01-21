import { PrismaClient } from '@prisma/client';
import { PaginatedResponse } from '../types';
import { ERROR_MESSAGES } from '../constants';

const prisma = new PrismaClient();

class FriendService {
  async getFriends(userId: string, page: number, limit: number): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * limit;

    const [friendships, total] = await Promise.all([
      prisma.friendship.findMany({
        where: { userId },
        include: { friend: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.friendship.count({ where: { userId } }),
    ]);

    return {
      data: friendships.map(f => f.friend),
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

  async getFriendRequests(userId: string, page: number, limit: number): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      prisma.friendRequest.findMany({
        where: { receiverId: userId, status: 'PENDING' },
        include: { sender: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.friendRequest.count({
        where: { receiverId: userId, status: 'PENDING' },
      }),
    ]);

    return {
      data: requests,
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

  async sendFriendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new Error(ERROR_MESSAGES.CANNOT_SELF_ACTION);
    }

    // Check if already friends
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: senderId, friendId: receiverId },
          { userId: receiverId, friendId: senderId },
        ],
      },
    });

    if (existingFriendship) {
      throw new Error(ERROR_MESSAGES.ALREADY_FRIENDS);
    }

    // Check if request already exists
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId, status: 'PENDING' },
          { senderId: receiverId, receiverId: senderId, status: 'PENDING' },
        ],
      },
    });

    if (existingRequest) {
      throw new Error(ERROR_MESSAGES.REQUEST_EXISTS);
    }

    const request = await prisma.friendRequest.create({
      data: { senderId, receiverId },
      include: { receiver: true },
    });

    return request;
  }

  async acceptFriendRequest(userId: string, senderId: string) {
    const request = await prisma.friendRequest.findFirst({
      where: {
        senderId,
        receiverId: userId,
        status: 'PENDING',
      },
    });

    if (!request) {
      throw new Error(ERROR_MESSAGES.REQUEST_NOT_FOUND);
    }

    await prisma.$transaction([
      prisma.friendRequest.update({
        where: { id: request.id },
        data: { status: 'ACCEPTED' },
      }),
      prisma.friendship.create({
        data: { userId, friendId: senderId },
      }),
      prisma.friendship.create({
        data: { userId: senderId, friendId: userId },
      }),
    ]);
  }

  async rejectFriendRequest(userId: string, senderId: string) {
    const request = await prisma.friendRequest.findFirst({
      where: {
        senderId,
        receiverId: userId,
        status: 'PENDING',
      },
    });

    if (!request) {
      throw new Error(ERROR_MESSAGES.REQUEST_NOT_FOUND);
    }

    await prisma.friendRequest.update({
      where: { id: request.id },
      data: { status: 'REJECTED' },
    });
  }

  async unfriend(userId: string, friendId: string) {
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });
  }

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new Error(ERROR_MESSAGES.CANNOT_SELF_ACTION);
    }

    const existingFollow = await prisma.follow.findFirst({
      where: { followerId, followingId },
    });

    if (existingFollow) {
      throw new Error(ERROR_MESSAGES.ALREADY_FOLLOWING);
    }

    await prisma.follow.create({
      data: { followerId, followingId },
    });
  }

  async unfollow(followerId: string, followingId: string) {
    await prisma.follow.deleteMany({
      where: { followerId, followingId },
    });
  }

  async getFollowers(userId: string, page: number, limit: number): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: userId },
        include: { follower: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.count({ where: { followingId: userId } }),
    ]);

    return {
      data: follows.map(f => f.follower),
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

  async getFollowing(userId: string, page: number, limit: number): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        include: { following: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return {
      data: follows.map(f => f.following),
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

  async blockUser(blockerId: string, blockedId: string) {
    await prisma.$transaction([
      prisma.friendship.deleteMany({
        where: {
          OR: [
            { userId: blockerId, friendId: blockedId },
            { userId: blockedId, friendId: blockerId },
          ],
        },
      }),
      prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: blockerId, followingId: blockedId },
            { followerId: blockedId, followingId: blockerId },
          ],
        },
      }),
      prisma.block.create({
        data: { blockerId, blockedId },
      }),
    ]);
  }

  async unblockUser(blockerId: string, blockedId: string) {
    await prisma.block.deleteMany({
      where: { blockerId, blockedId },
    });
  }

  async getBlockedUsers(userId: string) {
    const blocks = await prisma.block.findMany({
      where: { blockerId: userId },
      include: { blocked: true },
      orderBy: { createdAt: 'desc' },
    });

    return blocks.map(b => b.blocked);
  }
}

export const friendService = new FriendService();
