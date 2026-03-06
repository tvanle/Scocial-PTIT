import { prisma } from '../../config/database';
import { AppError } from '../../middleware';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../shared/constants';
import { parsePagination, paginate } from '../../shared/utils';
import { CreatePostInput, UpdatePostInput, CreateCommentInput } from './post.validator';

const authorSelect = {
  id: true,
  fullName: true,
  avatar: true,
  studentId: true,
  isVerified: true,
};

const postInclude = {
  author: { select: authorSelect },
  media: true,
  _count: {
    select: {
      comments: true,
      likes: true,
      shares: true,
    },
  },
};

export class PostService {
  // Transform post to flatten _count into likesCount/commentsCount/sharesCount
  private transformPost(post: any, extra?: Record<string, any>) {
    const { _count, ...rest } = post;
    return {
      ...rest,
      likesCount: _count?.likes ?? 0,
      commentsCount: _count?.comments ?? 0,
      sharesCount: _count?.shares ?? 0,
      ...extra,
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
      include: postInclude,
    });

    return this.transformPost(post);
  }

  // Get post by ID
  async getPost(postId: string, userId?: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: postInclude,
    });

    if (!post) {
      throw new AppError(ERROR_MESSAGES.POST_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    let isLiked = false;
    let isShared = false;
    if (userId) {
      const [like, share] = await Promise.all([
        prisma.like.findUnique({
          where: { userId_postId: { userId, postId } },
        }),
        prisma.share.findUnique({
          where: { userId_postId: { userId, postId } },
        }),
      ]);
      isLiked = !!like;
      isShared = !!share;
    }

    return this.transformPost(post, { isLiked, isShared });
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
      include: postInclude,
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

  // Get feed
  async getFeed(userId: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = new Set(following.map((f) => f.followingId));

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        include: postInclude,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count(),
    ]);

    // Check liked + shared status
    const postIds = posts.map((p) => p.id);
    const [likedPosts, sharedPosts] = await Promise.all([
      prisma.like.findMany({
        where: { userId, postId: { in: postIds } },
        select: { postId: true },
      }),
      prisma.share.findMany({
        where: { userId, postId: { in: postIds } },
        select: { postId: true },
      }),
    ]);

    const likedPostIds = new Set(likedPosts.map((l) => l.postId));
    const sharedPostIds = new Set(sharedPosts.map((s) => s.postId));

    const postsWithStatus = posts.map((post) => ({
      ...this.transformPost(post, {
        isLiked: likedPostIds.has(post.id),
        isShared: sharedPostIds.has(post.id),
      }),
      isFollowing: followingIds.has(post.authorId),
    }));

    postsWithStatus.sort((a, b) => {
      const aIsFollowed = a.isFollowing || a.author.id === userId ? 1 : 0;
      const bIsFollowed = b.isFollowing || b.author.id === userId ? 1 : 0;
      if (aIsFollowed !== bIsFollowed) return bIsFollowed - aIsFollowed;
      return 0;
    });

    return paginate(postsWithStatus, total, p, l);
  }

  // Get user posts
  async getUserPosts(userId: string, currentUserId?: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    const where = { authorId: userId };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: postInclude,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({ where }),
    ]);

    let likedPostIds = new Set<string>();
    let sharedPostIds = new Set<string>();
    if (currentUserId) {
      const postIds = posts.map((p) => p.id);
      const [liked, shared] = await Promise.all([
        prisma.like.findMany({
          where: { userId: currentUserId, postId: { in: postIds } },
          select: { postId: true },
        }),
        prisma.share.findMany({
          where: { userId: currentUserId, postId: { in: postIds } },
          select: { postId: true },
        }),
      ]);
      likedPostIds = new Set(liked.map((l) => l.postId));
      sharedPostIds = new Set(shared.map((s) => s.postId));
    }

    return paginate(
      posts.map((post) =>
        this.transformPost(post, {
          isLiked: likedPostIds.has(post.id),
          isShared: sharedPostIds.has(post.id),
        })
      ),
      total,
      p,
      l
    );
  }

  // Share post (repost)
  async sharePost(userId: string, postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new AppError(ERROR_MESSAGES.POST_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const existing = await prisma.share.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      throw new AppError(ERROR_MESSAGES.ALREADY_SHARED, HTTP_STATUS.CONFLICT);
    }

    await prisma.share.create({
      data: { userId, postId },
    });
  }

  // Unshare post (unrepost)
  async unsharePost(userId: string, postId: string) {
    const share = await prisma.share.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (!share) {
      throw new AppError(ERROR_MESSAGES.NOT_SHARED, HTTP_STATUS.BAD_REQUEST);
    }

    await prisma.share.delete({
      where: { id: share.id },
    });
  }

  // Get shared posts by user
  async getSharedPosts(userId: string, currentUserId?: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    const [shares, total] = await Promise.all([
      prisma.share.findMany({
        where: { userId },
        include: {
          post: {
            include: postInclude,
          },
        },
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.share.count({ where: { userId } }),
    ]);

    const posts = shares.map((s) => s.post);

    let likedPostIds = new Set<string>();
    if (currentUserId) {
      const postIds = posts.map((p) => p.id);
      const liked = await prisma.like.findMany({
        where: { userId: currentUserId, postId: { in: postIds } },
        select: { postId: true },
      });
      likedPostIds = new Set(liked.map((l) => l.postId));
    }

    return paginate(
      posts.map((post) =>
        this.transformPost(post, {
          isLiked: likedPostIds.has(post.id),
          isShared: true,
        })
      ),
      total,
      p,
      l
    );
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
