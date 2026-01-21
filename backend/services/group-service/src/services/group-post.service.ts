import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware';
import { ERROR_MESSAGES } from '../constants';
import type { CreateGroupPostData, CreateCommentData, PaginationQuery, PaginatedResponse } from '../types';

const prisma = new PrismaClient();

export class GroupPostService {
  async getPosts(groupId: string, userId: string | undefined, pagination: PaginationQuery): Promise<PaginatedResponse<any>> {
    const page = parseInt(pagination.page || '1');
    const limit = parseInt(pagination.limit || '20');
    const skip = (page - 1) * limit;

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new AppError(404, ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    if (group.privacy !== 'PUBLIC') {
      const membership = userId
        ? await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
          })
        : null;

      if (!membership) {
        throw new AppError(403, ERROR_MESSAGES.NOT_AUTHORIZED_TO_VIEW_POSTS);
      }
    }

    const [posts, total] = await Promise.all([
      prisma.groupPost.findMany({
        where: { groupId },
        skip,
        take: limit,
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

    return {
      data: postsWithStatus,
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

  async createPost(groupId: string, userId: string, data: CreateGroupPostData): Promise<any> {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership) {
      throw new AppError(403, ERROR_MESSAGES.MUST_BE_MEMBER_TO_POST);
    }

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group?.allowMemberPosts && membership.role === 'MEMBER') {
      throw new AppError(403, ERROR_MESSAGES.MEMBERS_CANNOT_POST);
    }

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

    return post;
  }

  async deletePost(groupId: string, postId: string, userId: string): Promise<void> {
    const post = await prisma.groupPost.findUnique({ where: { id: postId } });
    if (!post || post.groupId !== groupId) {
      throw new AppError(404, ERROR_MESSAGES.POST_NOT_FOUND);
    }

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    const canDelete =
      post.authorId === userId || (membership && ['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role));

    if (!canDelete) {
      throw new AppError(403, ERROR_MESSAGES.NOT_AUTHORIZED);
    }

    await prisma.$transaction([
      prisma.groupPost.delete({ where: { id: postId } }),
      prisma.group.update({
        where: { id: groupId },
        data: { postsCount: { decrement: 1 } },
      }),
    ]);
  }

  async likePost(postId: string, userId: string): Promise<void> {
    const existingLike = await prisma.groupPostLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existingLike) {
      throw new AppError(400, ERROR_MESSAGES.ALREADY_LIKED);
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
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    const existingLike = await prisma.groupPostLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (!existingLike) {
      throw new AppError(400, ERROR_MESSAGES.NOT_LIKED);
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
  }

  async togglePin(groupId: string, postId: string, userId: string): Promise<{ isPinned: boolean }> {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership || !['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role)) {
      throw new AppError(403, ERROR_MESSAGES.NOT_AUTHORIZED);
    }

    const post = await prisma.groupPost.findUnique({ where: { id: postId } });
    if (!post || post.groupId !== groupId) {
      throw new AppError(404, ERROR_MESSAGES.POST_NOT_FOUND);
    }

    const updatedPost = await prisma.groupPost.update({
      where: { id: postId },
      data: { isPinned: !post.isPinned },
    });

    return { isPinned: updatedPost.isPinned };
  }

  async getComments(postId: string, userId: string | undefined, pagination: PaginationQuery): Promise<PaginatedResponse<any>> {
    const page = parseInt(pagination.page || '1');
    const limit = parseInt(pagination.limit || '20');
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.groupComment.findMany({
        where: { postId, parentId: null },
        skip,
        take: limit,
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

    return {
      data: commentsWithStatus,
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

  async createComment(postId: string, userId: string, data: CreateCommentData): Promise<any> {
    const transactions: any[] = [
      prisma.groupComment.create({
        data: {
          postId,
          authorId: userId,
          content: data.content,
          parentId: data.parentId,
        },
      }),
      prisma.groupPost.update({
        where: { id: postId },
        data: { commentsCount: { increment: 1 } },
      }),
    ];

    if (data.parentId) {
      transactions.push(
        prisma.groupComment.update({
          where: { id: data.parentId },
          data: { repliesCount: { increment: 1 } },
        })
      );
    }

    const [comment] = await prisma.$transaction(transactions);
    return comment;
  }
}

export const groupPostService = new GroupPostService();
