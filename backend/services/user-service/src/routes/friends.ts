import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get friends list
router.get('/friends', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { page = '1', limit = '20' } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [friendships, total] = await Promise.all([
      prisma.friendship.findMany({
        where: { userId },
        include: { friend: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.friendship.count({ where: { userId } }),
    ]);

    res.json({
      data: friendships.map(f => f.friend),
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
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to get friends' });
  }
});

// Get friend requests
router.get('/friend-requests', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { page = '1', limit = '20' } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [requests, total] = await Promise.all([
      prisma.friendRequest.findMany({
        where: { receiverId: userId, status: 'PENDING' },
        include: { sender: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.friendRequest.count({
        where: { receiverId: userId, status: 'PENDING' },
      }),
    ]);

    res.json({
      data: requests,
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
    console.error('Get friend requests error:', error);
    res.status(500).json({ error: 'Failed to get friend requests' });
  }
});

// Send friend request
router.post('/:id/friend-request', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id: receiverId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (userId === receiverId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if already friends
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId: receiverId },
          { userId: receiverId, friendId: userId },
        ],
      },
    });

    if (existingFriendship) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Check if request already exists
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId, status: 'PENDING' },
          { senderId: receiverId, receiverId: userId, status: 'PENDING' },
        ],
      },
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already exists' });
    }

    const request = await prisma.friendRequest.create({
      data: {
        senderId: userId,
        receiverId,
      },
      include: { receiver: true },
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Accept friend request
router.post('/:id/friend-request/accept', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id: senderId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find and update request
    const request = await prisma.friendRequest.findFirst({
      where: {
        senderId,
        receiverId: userId,
        status: 'PENDING',
      },
    });

    if (!request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Update request and create friendships
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

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

// Reject friend request
router.post('/:id/friend-request/reject', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id: senderId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const request = await prisma.friendRequest.findFirst({
      where: {
        senderId,
        receiverId: userId,
        status: 'PENDING',
      },
    });

    if (!request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    await prisma.friendRequest.update({
      where: { id: request.id },
      data: { status: 'REJECTED' },
    });

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ error: 'Failed to reject friend request' });
  }
});

// Unfriend
router.post('/:id/unfriend', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id: friendId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    res.json({ message: 'Unfriended successfully' });
  } catch (error) {
    console.error('Unfriend error:', error);
    res.status(500).json({ error: 'Failed to unfriend' });
  }
});

// Follow user
router.post('/:id/follow', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id: followingId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (userId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const existingFollow = await prisma.follow.findFirst({
      where: { followerId: userId, followingId },
    });

    if (existingFollow) {
      return res.status(400).json({ error: 'Already following' });
    }

    await prisma.follow.create({
      data: { followerId: userId, followingId },
    });

    res.json({ message: 'Followed successfully' });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Failed to follow' });
  }
});

// Unfollow user
router.post('/:id/unfollow', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id: followingId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await prisma.follow.deleteMany({
      where: { followerId: userId, followingId },
    });

    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ error: 'Failed to unfollow' });
  }
});

// Get followers
router.get('/:id/followers', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: id },
        include: { follower: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.count({ where: { followingId: id } }),
    ]);

    res.json({
      data: follows.map(f => f.follower),
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
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Failed to get followers' });
  }
});

// Get following
router.get('/:id/following', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: id },
        include: { following: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.count({ where: { followerId: id } }),
    ]);

    res.json({
      data: follows.map(f => f.following),
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
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Failed to get following' });
  }
});

// Block user
router.post('/:id/block', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id: blockedId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Remove friendship and follow
    await prisma.$transaction([
      prisma.friendship.deleteMany({
        where: {
          OR: [
            { userId, friendId: blockedId },
            { userId: blockedId, friendId: userId },
          ],
        },
      }),
      prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: userId, followingId: blockedId },
            { followerId: blockedId, followingId: userId },
          ],
        },
      }),
      prisma.block.create({
        data: { blockerId: userId, blockedId },
      }),
    ]);

    res.json({ message: 'User blocked' });
  } catch (error) {
    console.error('Block error:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

// Unblock user
router.post('/:id/unblock', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id: blockedId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await prisma.block.deleteMany({
      where: { blockerId: userId, blockedId },
    });

    res.json({ message: 'User unblocked' });
  } catch (error) {
    console.error('Unblock error:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

// Get blocked users
router.get('/blocked', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const blocks = await prisma.block.findMany({
      where: { blockerId: userId },
      include: { blocked: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(blocks.map(b => b.blocked));
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ error: 'Failed to get blocked users' });
  }
});

export default router;
