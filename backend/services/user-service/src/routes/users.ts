import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  birthday: z.string().optional(),
  hometown: z.string().optional(),
  currentCity: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'NOT_SPECIFIED']).optional(),
  relationship: z.enum(['SINGLE', 'IN_RELATIONSHIP', 'ENGAGED', 'MARRIED', 'COMPLICATED', 'NOT_SPECIFIED']).optional(),
});

// Get current user profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

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
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ...user,
      friendsCount: user._count.friendships,
      followersCount: user._count.followers,
      followingCount: user._count.following,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update profile
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = updateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        birthday: data.birthday ? new Date(data.birthday) : undefined,
      },
    });

    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.headers['x-user-id'] as string;

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
      return res.status(404).json({ error: 'User not found' });
    }

    // Check friendship status
    let isFriend = false;
    let isFollowing = false;
    let friendRequestSent = false;
    let friendRequestReceived = false;

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

      isFriend = !!friendship;
      isFollowing = !!follow;
      friendRequestSent = !!sentRequest;
      friendRequestReceived = !!receivedRequest;
    }

    res.json({
      ...user,
      friendsCount: user._count.friendships,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      isFriend,
      isFollowing,
      friendRequestSent,
      friendRequestReceived,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Search users
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query, page = '1', limit = '20' } = req.query;
    const currentUserId = req.headers['x-user-id'] as string;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query required' });
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { fullName: { contains: query, mode: 'insensitive' } },
            { studentId: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
          id: { not: currentUserId },
        },
        skip,
        take,
        orderBy: { fullName: 'asc' },
      }),
      prisma.user.count({
        where: {
          OR: [
            { fullName: { contains: query, mode: 'insensitive' } },
            { studentId: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
          id: { not: currentUserId },
        },
      }),
    ]);

    res.json({
      data: users,
      meta: {
        total,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take),
        hasNext: skip + take < total,
        hasPrev: parseInt(page as string) > 1,
      },
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Upload avatar
router.post('/avatar', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Avatar URL required' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: url },
    });

    res.json({ url: user.avatar });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Upload cover photo
router.post('/cover', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Cover URL required' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { coverPhoto: url },
    });

    res.json({ url: user.coverPhoto });
  } catch (error) {
    console.error('Upload cover error:', error);
    res.status(500).json({ error: 'Failed to upload cover' });
  }
});

// Get user suggestions
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { limit = '10' } = req.query;

    // Get users that are not friends and not blocked
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
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

export default router;
