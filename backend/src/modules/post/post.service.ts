import { prisma } from '../../config/database';
import { AppError } from '../../middleware';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../shared/constants';
import { parsePagination, paginate } from '../../shared/utils';
import { CreatePostInput, UpdatePostInput, CreateCommentInput } from './post.validator';

export class PostService {
  // Transform post to flatten _count into likesCount/commentsCount
  private transformPost(post: any) {
    const { _count, ...rest } = post;
    return {
      ...rest,
      likesCount: _count?.likes ?? 0,
      commentsCount: _count?.comments ?? 0,
    };
  }
  // Create post
  async createPost(authorId: string, data: CreatePostInput, mediaIds?: string[]) {
    const post = await prisma.post.create({
      data: {
        content: data.content,
        privacy: data.privacy,
        authorId,
        media: mediaIds
          ? {
            connect: mediaIds.map((id) => ({ id })),
          }
          : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            studentId: true,
            isVerified: true,
          },
        },
        media: true,
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    return this.transformPost(post);
  }

  // Get post by ID
  async getPost(postId: string, userId?: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            studentId: true,
            isVerified: true,
          },
        },
        media: true,
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    if (!post) {
      throw new AppError(ERROR_MESSAGES.POST_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Check if user liked this post
    let isLiked = false;
    if (userId) {
      const like = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
      isLiked = !!like;
    }

    return { ...this.transformPost(post), isLiked };
  }

  // Update post
  async updatePost(postId: string, authorId: string, data: UpdatePostInput) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new AppError(ERROR_MESSAGES.POST_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (post.authorId !== authorId) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data,
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            studentId: true,
            isVerified: true,
          },
        },
        media: true,
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    return this.transformPost(updated);
  }

  // Delete post
  async deletePost(postId: string, authorId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new AppError(ERROR_MESSAGES.POST_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (post.authorId !== authorId) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    await prisma.post.delete({
      where: { id: postId },
    });
  }

  // Get feed - all posts are public, followed users' posts prioritized first (Threads-style)
  async getFeed(userId: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    // Get followed user IDs for priority sorting
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = new Set(following.map((f) => f.followingId));

    // All posts are public - show everything
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
              studentId: true,
              isVerified: true,
            },
          },
          media: true,
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count(),
    ]);

    // Check liked status for each post
    const likedPosts = await prisma.like.findMany({
      where: {
        userId,
        postId: { in: posts.map((p) => p.id) },
      },
      select: { postId: true },
    });

    const likedPostIds = new Set(likedPosts.map((l) => l.postId));

    // Transform and mark followed authors' posts
    const postsWithStatus = posts.map((post) => ({
      ...this.transformPost(post),
      isLiked: likedPostIds.has(post.id),
      isFollowing: followingIds.has(post.authorId),
    }));

    // Sort: followed users' posts first, then by recency (already sorted by createdAt desc)
    postsWithStatus.sort((a, b) => {
      const aIsFollowed = a.isFollowing || a.author.id === userId ? 1 : 0;
      const bIsFollowed = b.isFollowing || b.author.id === userId ? 1 : 0;
      if (aIsFollowed !== bIsFollowed) return bIsFollowed - aIsFollowed;
      return 0; // Keep existing createdAt desc order
    });

    return paginate(postsWithStatus, total, p, l);
  }

  // Get user posts (all posts are public)
  async getUserPosts(userId: string, currentUserId?: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    const where = {
      authorId: userId,
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
              studentId: true,
              isVerified: true,
            },
          },
          media: true,
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({ where }),
    ]);

    return paginate(posts.map((p) => this.transformPost(p)), total, p, l);
  }

  // Like post
  async likePost(userId: string, postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new AppError(ERROR_MESSAGES.POST_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (existingLike) {
      throw new AppError(ERROR_MESSAGES.ALREADY_LIKED, HTTP_STATUS.CONFLICT);
    }

    await prisma.like.create({
      data: { userId, postId },
    });

    // Create notification (if not own post)
    if (post.authorId !== userId) {
      await prisma.notification.create({
        data: {
          type: 'LIKE',
          senderId: userId,
          receiverId: post.authorId,
          referenceId: postId,
        },
      });
    }
  }

  // Unlike post
  async unlikePost(userId: string, postId: string) {
    const like = await prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (!like) {
      throw new AppError(ERROR_MESSAGES.NOT_LIKED, HTTP_STATUS.BAD_REQUEST);
    }

    await prisma.like.delete({
      where: { id: like.id },
    });
  }

  // Create comment
  async createComment(userId: string, postId: string, data: CreateCommentInput) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new AppError(ERROR_MESSAGES.POST_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        authorId: userId,
        postId,
        parentId: data.parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    // Create notification (if not own post)
    if (post.authorId !== userId) {
      await prisma.notification.create({
        data: {
          type: 'COMMENT',
          senderId: userId,
          receiverId: post.authorId,
          referenceId: postId,
        },
      });
    }

    return comment;
  }

  // Get comments
  async getComments(postId: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    const where = {
      postId,
      parentId: null, // Only top-level comments
    };

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  fullName: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.comment.count({ where }),
    ]);

    return paginate(comments, total, p, l);
  }

  // Delete comment
  async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new AppError(ERROR_MESSAGES.COMMENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (comment.authorId !== userId) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });
  }
}

export const postService = new PostService();
