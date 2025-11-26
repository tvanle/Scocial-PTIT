import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  media: z.array(z.object({
    url: z.string().url(),
    type: z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'FILE']),
  })).optional(),
});

// Get group posts
router.get('/:groupId/posts', async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.headers['x-user-id'] as string;
    const { page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Check if user is member (for private/secret groups)
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.privacy !== 'PUBLIC') {
      const membership = userId
        ? await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
          })
        : null;

      if (!membership) {
        return res.status(403).json({ error: 'Not authorized to view posts' });
      }
    }

    const [posts, total] = await Promise.all([
      prisma.groupPost.findMany({
        where: { groupId },
        skip,
        take,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        include: {
          comments: {
            take: 3,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.groupPost.count({ where: { groupId } }),
    ]);

    // Add like status
    const postsWithStatus = await Promise.all(
      posts.map(async (post) => {
        const isLiked = userId
          ? await prisma.groupPostLike.findUnique({
              where: { postId_userId: { postId: post.id, userId } },
            })
          : null;

        return {
          ...post,
          isLiked: !!isLiked,
        };
      })
    );

    res.json({
      data: postsWithStatus,
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
    console.error('Get group posts error:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
});

// Create post in group
router.post('/:groupId/posts', async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check membership
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Must be a member to post' });
    }

    // Check if members can post
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group?.allowMemberPosts && membership.role === 'MEMBER') {
      return res.status(403).json({ error: 'Members cannot post in this group' });
    }

    const data = createPostSchema.parse(req.body);

    const [post] = await prisma.$transaction([
      prisma.groupPost.create({
        data: {
          groupId,
          authorId: userId,
          content: data.content,
          media: data.media,
        },
      }),
      prisma.group.update({
        where: { id: groupId },
        data: { postsCount: { increment: 1 } },
      }),
    ]);

    res.status(201).json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create group post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Delete post
router.delete('/:groupId/posts/:postId', async (req: Request, res: Response) => {
  try {
    const { groupId, postId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const post = await prisma.groupPost.findUnique({ where: { id: postId } });
    if (!post || post.groupId !== groupId) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is author or admin
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    const canDelete =
      post.authorId === userId ||
      (membership && ['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role));

    if (!canDelete) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.$transaction([
      prisma.groupPost.delete({ where: { id: postId } }),
      prisma.group.update({
        where: { id: groupId },
        data: { postsCount: { decrement: 1 } },
      }),
    ]);

    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Delete group post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Like post
router.post('/:groupId/posts/:postId/like', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const existingLike = await prisma.groupPostLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existingLike) {
      return res.status(400).json({ error: 'Already liked' });
    }

    await prisma.$transaction([
      prisma.groupPostLike.create({
        data: { postId, userId },
      }),
      prisma.groupPost.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      }),
    ]);

    res.json({ message: 'Post liked' });
  } catch (error) {
    console.error('Like group post error:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Unlike post
router.post('/:groupId/posts/:postId/unlike', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const existingLike = await prisma.groupPostLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (!existingLike) {
      return res.status(400).json({ error: 'Not liked' });
    }

    await prisma.$transaction([
      prisma.groupPostLike.delete({
        where: { postId_userId: { postId, userId } },
      }),
      prisma.groupPost.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      }),
    ]);

    res.json({ message: 'Post unliked' });
  } catch (error) {
    console.error('Unlike group post error:', error);
    res.status(500).json({ error: 'Failed to unlike post' });
  }
});

// Pin/Unpin post
router.post('/:groupId/posts/:postId/pin', async (req: Request, res: Response) => {
  try {
    const { groupId, postId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership || !['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const post = await prisma.groupPost.findUnique({ where: { id: postId } });
    if (!post || post.groupId !== groupId) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await prisma.groupPost.update({
      where: { id: postId },
      data: { isPinned: !post.isPinned },
    });

    res.json({ message: post.isPinned ? 'Post unpinned' : 'Post pinned' });
  } catch (error) {
    console.error('Pin group post error:', error);
    res.status(500).json({ error: 'Failed to pin/unpin post' });
  }
});

// Get post comments
router.get('/:groupId/posts/:postId/comments', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.headers['x-user-id'] as string;
    const { page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [comments, total] = await Promise.all([
      prisma.groupComment.findMany({
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
      prisma.groupComment.count({ where: { postId, parentId: null } }),
    ]);

    // Add like status
    const commentsWithStatus = await Promise.all(
      comments.map(async (comment) => {
        const isLiked = userId
          ? await prisma.groupCommentLike.findUnique({
              where: { commentId_userId: { commentId: comment.id, userId } },
            })
          : null;

        const repliesWithStatus = await Promise.all(
          comment.replies.map(async (reply) => {
            const replyIsLiked = userId
              ? await prisma.groupCommentLike.findUnique({
                  where: { commentId_userId: { commentId: reply.id, userId } },
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
router.post('/:groupId/posts/:postId/comments', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.headers['x-user-id'] as string;
    const { content, parentId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Content required' });
    }

    const [comment] = await prisma.$transaction([
      prisma.groupComment.create({
        data: {
          postId,
          authorId: userId,
          content,
          parentId,
        },
      }),
      prisma.groupPost.update({
        where: { id: postId },
        data: { commentsCount: { increment: 1 } },
      }),
      ...(parentId
        ? [
            prisma.groupComment.update({
              where: { id: parentId },
              data: { repliesCount: { increment: 1 } },
            }),
          ]
        : []),
    ]);

    res.status(201).json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;
