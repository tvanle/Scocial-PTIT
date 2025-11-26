import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  media: z.object({
    url: z.string().url(),
    type: z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'FILE']),
  }).optional(),
  parentId: z.string().optional(),
});

// Get comments for a post
router.get('/:postId/comments', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { page = '1', limit = '20' } = req.query;
    const userId = req.headers['x-user-id'] as string;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Get top-level comments
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { postId, parentId: null },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          replies: {
            take: 3,
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      prisma.comment.count({ where: { postId, parentId: null } }),
    ]);

    // Get like status
    const commentsWithStatus = await Promise.all(
      comments.map(async (comment) => {
        const isLiked = userId
          ? await prisma.commentLike.findFirst({
              where: { commentId: comment.id, userId },
            })
          : null;

        const repliesWithStatus = await Promise.all(
          comment.replies.map(async (reply) => {
            const replyIsLiked = userId
              ? await prisma.commentLike.findFirst({
                  where: { commentId: reply.id, userId },
                })
              : null;
            return { ...reply, isLiked: !!replyIsLiked };
          })
        );

        return {
          ...comment,
          isLiked: !!isLiked,
          replies: repliesWithStatus,
        };
      })
    );

    res.json({
      data: commentsWithStatus,
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
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

// Add comment
router.post('/:postId/comments', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = createCommentSchema.parse(req.body);

    // Verify post exists
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // If replying, verify parent exists
    if (data.parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: data.parentId },
      });
      if (!parent || parent.postId !== postId) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }
    }

    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          postId,
          authorId: userId,
          content: data.content,
          media: data.media,
          parentId: data.parentId,
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { commentsCount: { increment: 1 } },
      }),
      ...(data.parentId
        ? [
            prisma.comment.update({
              where: { id: data.parentId },
              data: { repliesCount: { increment: 1 } },
            }),
          ]
        : []),
    ]);

    res.status(201).json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Delete comment
router.delete('/:postId/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.$transaction([
      prisma.comment.delete({ where: { id: commentId } }),
      prisma.post.update({
        where: { id: postId },
        data: { commentsCount: { decrement: 1 } },
      }),
      ...(comment.parentId
        ? [
            prisma.comment.update({
              where: { id: comment.parentId },
              data: { repliesCount: { decrement: 1 } },
            }),
          ]
        : []),
    ]);

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Like comment
router.post('/:postId/comments/:commentId/like', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const existingLike = await prisma.commentLike.findFirst({
      where: { commentId, userId },
    });

    if (existingLike) {
      return res.status(400).json({ error: 'Already liked' });
    }

    await prisma.$transaction([
      prisma.commentLike.create({
        data: { commentId, userId },
      }),
      prisma.comment.update({
        where: { id: commentId },
        data: { likesCount: { increment: 1 } },
      }),
    ]);

    res.json({ message: 'Comment liked' });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ error: 'Failed to like comment' });
  }
});

// Unlike comment
router.post('/:postId/comments/:commentId/unlike', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const existingLike = await prisma.commentLike.findFirst({
      where: { commentId, userId },
    });

    if (!existingLike) {
      return res.status(400).json({ error: 'Not liked' });
    }

    await prisma.$transaction([
      prisma.commentLike.delete({
        where: { id: existingLike.id },
      }),
      prisma.comment.update({
        where: { id: commentId },
        data: { likesCount: { decrement: 1 } },
      }),
    ]);

    res.json({ message: 'Comment unliked' });
  } catch (error) {
    console.error('Unlike comment error:', error);
    res.status(500).json({ error: 'Failed to unlike comment' });
  }
});

// Get comment replies
router.get('/:postId/comments/:commentId/replies', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { page = '1', limit = '20' } = req.query;
    const userId = req.headers['x-user-id'] as string;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [replies, total] = await Promise.all([
      prisma.comment.findMany({
        where: { parentId: commentId },
        skip,
        take,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.comment.count({ where: { parentId: commentId } }),
    ]);

    const repliesWithStatus = await Promise.all(
      replies.map(async (reply) => {
        const isLiked = userId
          ? await prisma.commentLike.findFirst({
              where: { commentId: reply.id, userId },
            })
          : null;
        return { ...reply, isLiked: !!isLiked };
      })
    );

    res.json({
      data: repliesWithStatus,
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
    console.error('Get replies error:', error);
    res.status(500).json({ error: 'Failed to get replies' });
  }
});

export default router;
