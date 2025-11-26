import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  media: z.array(z.object({
    url: z.string().url(),
    type: z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'FILE']),
    thumbnail: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  })).optional(),
  feeling: z.string().optional(),
  location: z.string().optional(),
  taggedUserIds: z.array(z.string()).optional(),
  privacy: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']).default('PUBLIC'),
  groupId: z.string().optional(),
});

// Get feed
router.get('/feed', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { page = '1', limit = '20', cursor } = req.query;

    const skip = cursor ? 1 : (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // In production, filter by friends and followed users
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { privacy: 'PUBLIC' },
          { authorId: userId },
        ],
        groupId: null, // Don't show group posts in main feed
      },
      skip,
      take,
      cursor: cursor ? { id: cursor as string } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    // Get like status for current user
    const postsWithStatus = await Promise.all(
      posts.map(async (post) => {
        const [isLiked, isSaved] = await Promise.all([
          prisma.postLike.findFirst({
            where: { postId: post.id, userId },
          }),
          prisma.postSave.findFirst({
            where: { postId: post.id, userId },
          }),
        ]);

        return {
          ...post,
          isLiked: !!isLiked,
          isSaved: !!isSaved,
        };
      })
    );

    const total = await prisma.post.count({
      where: {
        OR: [
          { privacy: 'PUBLIC' },
          { authorId: userId },
        ],
        groupId: null,
      },
    });

    res.json({
      data: postsWithStatus,
      meta: {
        total,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take),
        hasNext: posts.length === take,
        hasPrev: parseInt(page as string) > 1,
        nextCursor: posts.length > 0 ? posts[posts.length - 1].id : undefined,
      },
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Failed to get feed' });
  }
});

// Create post
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = createPostSchema.parse(req.body);

    const post = await prisma.post.create({
      data: {
        authorId: userId,
        content: data.content,
        media: data.media,
        feeling: data.feeling,
        location: data.location,
        taggedUserIds: data.taggedUserIds || [],
        privacy: data.privacy,
        groupId: data.groupId,
      },
    });

    res.status(201).json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get post by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        sharedPost: true,
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const [isLiked, isSaved] = await Promise.all([
      prisma.postLike.findFirst({
        where: { postId: post.id, userId },
      }),
      prisma.postSave.findFirst({
        where: { postId: post.id, userId },
      }),
    ]);

    res.json({
      ...post,
      isLiked: !!isLiked,
      isSaved: !!isSaved,
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to get post' });
  }
});

// Update post
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to edit this post' });
    }

    const { content, feeling, location, privacy } = req.body;

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        content,
        feeling,
        location,
        privacy,
        isEdited: true,
      },
    });

    res.json(updatedPost);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete post
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await prisma.post.delete({ where: { id } });

    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Like post
router.post('/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const existingLike = await prisma.postLike.findFirst({
      where: { postId: id, userId },
    });

    if (existingLike) {
      return res.status(400).json({ error: 'Already liked' });
    }

    await prisma.$transaction([
      prisma.postLike.create({
        data: { postId: id, userId },
      }),
      prisma.post.update({
        where: { id },
        data: { likesCount: { increment: 1 } },
      }),
    ]);

    res.json({ message: 'Post liked' });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Unlike post
router.post('/:id/unlike', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const existingLike = await prisma.postLike.findFirst({
      where: { postId: id, userId },
    });

    if (!existingLike) {
      return res.status(400).json({ error: 'Not liked' });
    }

    await prisma.$transaction([
      prisma.postLike.delete({
        where: { id: existingLike.id },
      }),
      prisma.post.update({
        where: { id },
        data: { likesCount: { decrement: 1 } },
      }),
    ]);

    res.json({ message: 'Post unliked' });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({ error: 'Failed to unlike post' });
  }
});

// Share post
router.post('/:id/share', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;
    const { content } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const originalPost = await prisma.post.findUnique({ where: { id } });
    if (!originalPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const [sharedPost] = await prisma.$transaction([
      prisma.post.create({
        data: {
          authorId: userId,
          content: content || '',
          sharedPostId: id,
          privacy: 'PUBLIC',
        },
      }),
      prisma.post.update({
        where: { id },
        data: { sharesCount: { increment: 1 } },
      }),
    ]);

    res.status(201).json(sharedPost);
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ error: 'Failed to share post' });
  }
});

// Save post
router.post('/:id/save', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const existingSave = await prisma.postSave.findFirst({
      where: { postId: id, userId },
    });

    if (existingSave) {
      return res.status(400).json({ error: 'Already saved' });
    }

    await prisma.postSave.create({
      data: { postId: id, userId },
    });

    res.json({ message: 'Post saved' });
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({ error: 'Failed to save post' });
  }
});

// Unsave post
router.post('/:id/unsave', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await prisma.postSave.deleteMany({
      where: { postId: id, userId },
    });

    res.json({ message: 'Post unsaved' });
  } catch (error) {
    console.error('Unsave post error:', error);
    res.status(500).json({ error: 'Failed to unsave post' });
  }
});

// Get saved posts
router.get('/saved', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { page = '1', limit = '20' } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [saves, total] = await Promise.all([
      prisma.postSave.findMany({
        where: { userId },
        include: { post: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.postSave.count({ where: { userId } }),
    ]);

    res.json({
      data: saves.map(s => ({ ...s.post, isSaved: true })),
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
    console.error('Get saved posts error:', error);
    res.status(500).json({ error: 'Failed to get saved posts' });
  }
});

// Report post
router.post('/:id/report', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Reason required' });
    }

    await prisma.postReport.create({
      data: { postId: id, userId, reason },
    });

    res.json({ message: 'Post reported' });
  } catch (error) {
    console.error('Report post error:', error);
    res.status(500).json({ error: 'Failed to report post' });
  }
});

// Get user posts
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.headers['x-user-id'] as string;
    const { page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const whereClause = userId === currentUserId
      ? { authorId: userId, groupId: null }
      : { authorId: userId, privacy: 'PUBLIC', groupId: null };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({ where: whereClause }),
    ]);

    res.json({
      data: posts,
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
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Failed to get user posts' });
  }
});

export default router;
