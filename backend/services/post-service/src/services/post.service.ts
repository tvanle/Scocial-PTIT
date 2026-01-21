import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import {
  PaginatedResponse,
  PostWithStatus,
  CreatePostInput,
  UpdatePostInput,
  SharePostInput,
  ReportPostInput
} from '../types';
import { ERROR_MESSAGES } from '../constants';

const prisma = new PrismaClient();

class PostService {
  async getFeed(userId: string, page: number, limit: number, cursor?: string): Promise<PaginatedResponse<PostWithStatus>> {
    const skip = cursor ? 1 : (page - 1) * limit;
    const take = limit;

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
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    // Get like and save status for current user
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

    return {
      data: postsWithStatus,
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
        hasNext: posts.length === take,
        hasPrev: page > 1,
        nextCursor: posts.length > 0 ? posts[posts.length - 1].id : undefined,
      },
    };
  }

  async createPost(userId: string, data: CreatePostInput) {
    const post = await prisma.post.create({
      data: {
        authorId: userId,
        content: data.content,
        media: data.media as any,
        feeling: data.feeling,
        location: data.location,
        taggedUserIds: data.taggedUserIds || [],
        privacy: data.privacy || 'PUBLIC',
        groupId: data.groupId,
      },
    });

    return post;
  }

  async getPostById(id: string, userId: string): Promise<PostWithStatus> {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        sharedPost: true,
      },
    });

    if (!post) {
      throw new Error(ERROR_MESSAGES.POST_NOT_FOUND);
    }

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
  }

  async updatePost(postId: string, userId: string, data: UpdatePostInput) {
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new Error(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    if (post.authorId !== userId) {
      throw new Error(ERROR_MESSAGES.NOT_AUTHORIZED_EDIT);
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        ...data,
        isEdited: true,
      },
    });

    return updatedPost;
  }

  async deletePost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new Error(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    if (post.authorId !== userId) {
      throw new Error(ERROR_MESSAGES.NOT_AUTHORIZED_DELETE);
    }

    await prisma.post.delete({ where: { id: postId } });
  }

  async likePost(postId: string, userId: string) {
    const existingLike = await prisma.postLike.findFirst({
      where: { postId, userId },
    });

    if (existingLike) {
      throw new Error(ERROR_MESSAGES.ALREADY_LIKED);
    }

    await prisma.$transaction([
      prisma.postLike.create({
        data: { postId, userId },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      }),
    ]);
  }

  async unlikePost(postId: string, userId: string) {
    const existingLike = await prisma.postLike.findFirst({
      where: { postId, userId },
    });

    if (!existingLike) {
      throw new Error(ERROR_MESSAGES.NOT_LIKED);
    }

    await prisma.$transaction([
      prisma.postLike.delete({
        where: { id: existingLike.id },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      }),
    ]);
  }

  async sharePost(postId: string, userId: string, data: SharePostInput) {
    const originalPost = await prisma.post.findUnique({ where: { id: postId } });

    if (!originalPost) {
      throw new Error(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    const [sharedPost] = await prisma.$transaction([
      prisma.post.create({
        data: {
          authorId: userId,
          content: data.content || '',
          sharedPostId: postId,
          privacy: 'PUBLIC',
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { sharesCount: { increment: 1 } },
      }),
    ]);

    return sharedPost;
  }

  async savePost(postId: string, userId: string) {
    const existingSave = await prisma.postSave.findFirst({
      where: { postId, userId },
    });

    if (existingSave) {
      throw new Error(ERROR_MESSAGES.ALREADY_SAVED);
    }

    await prisma.postSave.create({
      data: { postId, userId },
    });
  }

  async unsavePost(postId: string, userId: string) {
    await prisma.postSave.deleteMany({
      where: { postId, userId },
    });
  }

  async getSavedPosts(userId: string, page: number, limit: number): Promise<PaginatedResponse<PostWithStatus>> {
    const skip = (page - 1) * limit;
    const take = limit;

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

    const postsWithStatus = saves.map(s => ({
      ...s.post,
      isSaved: true,
      isLiked: false, // Will be updated if needed
    }));

    return {
      data: postsWithStatus,
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

  async reportPost(postId: string, userId: string, data: ReportPostInput) {
    await prisma.postReport.create({
      data: {
        postId,
        userId,
        reason: data.reason
      },
    });
  }

  async getUserPosts(targetUserId: string, currentUserId: string, page: number, limit: number): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * limit;
    const take = limit;

    const whereClause = targetUserId === currentUserId
      ? { authorId: targetUserId, groupId: null }
      : { authorId: targetUserId, privacy: 'PUBLIC' as const, groupId: null };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({ where: whereClause }),
    ]);

    return {
      data: posts,
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

export const postService = new PostService();
