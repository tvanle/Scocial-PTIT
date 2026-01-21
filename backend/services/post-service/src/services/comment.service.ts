import { PrismaClient } from '@prisma/client';
import { PaginatedResponse, CommentWithStatus, CreateCommentInput } from '../types';
import { ERROR_MESSAGES } from '../constants';

const prisma = new PrismaClient();

class CommentService {
  async getComments(postId: string, userId: string | undefined, page: number, limit: number): Promise<PaginatedResponse<CommentWithStatus>> {
    const skip = (page - 1) * limit;
    const take = limit;

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

    return {
      data: commentsWithStatus,
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
        hasNext: skip + take < total,
        hasPrev: page > 1,
      },
    };
  }

  async addComment(postId: string, userId: string, data: CreateCommentInput) {
    // Verify post exists
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new Error(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    // If replying, verify parent exists
    if (data.parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: data.parentId },
      });
      if (!parent || parent.postId !== postId) {
        throw new Error(ERROR_MESSAGES.PARENT_COMMENT_NOT_FOUND);
      }
    }

    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          postId,
          authorId: userId,
          content: data.content,
          media: data.media as any,
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

    return comment;
  }

  async deleteComment(postId: string, commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error(ERROR_MESSAGES.COMMENT_NOT_FOUND);
    }

    if (comment.authorId !== userId) {
      throw new Error(ERROR_MESSAGES.NOT_AUTHORIZED);
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
  }

  async likeComment(commentId: string, userId: string) {
    const existingLike = await prisma.commentLike.findFirst({
      where: { commentId, userId },
    });

    if (existingLike) {
      throw new Error(ERROR_MESSAGES.ALREADY_LIKED);
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
  }

  async unlikeComment(commentId: string, userId: string) {
    const existingLike = await prisma.commentLike.findFirst({
      where: { commentId, userId },
    });

    if (!existingLike) {
      throw new Error(ERROR_MESSAGES.NOT_LIKED);
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
  }

  async getReplies(commentId: string, userId: string | undefined, page: number, limit: number): Promise<PaginatedResponse<CommentWithStatus>> {
    const skip = (page - 1) * limit;
    const take = limit;

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

    return {
      data: repliesWithStatus,
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
        hasNext: skip + take < total,
        hasPrev: page > 1,
      },
    };
  }
}

export const commentService = new CommentService();
