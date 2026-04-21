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
  poll: {
    include: {
      options: {
        orderBy: { order: 'asc' as const },
        include: {
          _count: { select: { votes: true } },
        },
      },
    },
  },
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
        locationName: data.locationName,
        latitude: data.latitude,
        longitude: data.longitude,
        media: mediaIds
          ? {
            connect: mediaIds.map((id) => ({ id })),
          }
          : undefined,
        poll: data.poll
          ? {
            create: {
              question: data.poll.question,
              options: {
                create: data.poll.options.map((opt, index) => ({
                  text: opt.text,
                  order: opt.order ?? index,
                })),
              },
            },
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

    // Sắp xếp theo thời gian mới nhất
    postsWithStatus.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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

  // Share comment (repost comment)
  async shareComment(userId: string, commentId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new AppError(ERROR_MESSAGES.COMMENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const existing = await prisma.commentShare.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (existing) {
      throw new AppError(ERROR_MESSAGES.ALREADY_SHARED, HTTP_STATUS.CONFLICT);
    }

    await prisma.commentShare.create({
      data: { userId, commentId },
    });
  }

  // Unshare comment (unrepost comment)
  async unshareComment(userId: string, commentId: string) {
    const share = await prisma.commentShare.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (!share) {
      throw new AppError(ERROR_MESSAGES.NOT_SHARED, HTTP_STATUS.BAD_REQUEST);
    }

    await prisma.commentShare.delete({
      where: { id: share.id },
    });
  }

  // Get shared comments by user
  async getSharedComments(userId: string, currentUserId?: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    const [shares, total] = await Promise.all([
      prisma.commentShare.findMany({
        where: { userId },
        include: {
          comment: {
            include: {
              author: { select: authorSelect },
              post: {
                include: postInclude,
              },
              _count: {
                select: {
                  likes: true,
                  replies: true,
                  shares: true,
                },
              },
            },
          },
        },
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.commentShare.count({ where: { userId } }),
    ]);

    // Check if current user liked these comments
    let likedCommentIds = new Set<string>();
    if (currentUserId) {
      const commentIds = shares.map((s) => s.comment.id);
      const liked = await prisma.commentLike.findMany({
        where: { userId: currentUserId, commentId: { in: commentIds } },
        select: { commentId: true },
      });
      likedCommentIds = new Set(liked.map((l) => l.commentId));
    }

    const data = shares.map((s) => {
      const { _count, ...comment } = s.comment;
      return {
        ...comment,
        likesCount: _count?.likes ?? 0,
        repliesCount: _count?.replies ?? 0,
        sharesCount: _count?.shares ?? 0,
        isLiked: likedCommentIds.has(comment.id),
        isShared: true,
        post: this.transformPost(s.comment.post),
      };
    });

    return paginate(data, total, p, l);
  }

  // Get user replies (comments)
  async getUserReplies(userId: string, currentUserId?: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { authorId: userId },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
              isVerified: true,
            },
          },
          post: {
            include: postInclude,
          },
        },
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.comment.count({ where: { authorId: userId } }),
    ]);

    // Get liked status for posts
    let likedPostIds = new Set<string>();
    let sharedPostIds = new Set<string>();
    if (currentUserId) {
      const postIds = comments.map((c) => c.post.id);
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

    const data = comments.map((comment) => ({
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: comment.author,
      },
      post: this.transformPost(comment.post, {
        isLiked: likedPostIds.has(comment.post.id),
        isShared: sharedPostIds.has(comment.post.id),
      }),
    }));

    return paginate(data, total, p, l);
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

  // Vote on poll option
  async votePoll(userId: string, postId: string, optionId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { poll: { include: { options: true } } },
    });

    if (!post || !post.poll) {
      throw new AppError('Bài viết không có bình chọn', HTTP_STATUS.NOT_FOUND);
    }

    const option = post.poll.options.find((o) => o.id === optionId);
    if (!option) {
      throw new AppError('Lựa chọn không hợp lệ', HTTP_STATUS.BAD_REQUEST);
    }

    // Check if user already voted on any option in this poll
    const existingVote = await prisma.pollVote.findFirst({
      where: {
        voterId: userId,
        option: { pollId: post.poll.id },
      },
    });

    if (existingVote) {
      // Change vote if different option
      if (existingVote.optionId !== optionId) {
        await prisma.pollVote.update({
          where: { id: existingVote.id },
          data: { optionId },
        });
      }
    } else {
      // Create new vote
      await prisma.pollVote.create({
        data: {
          optionId,
          voterId: userId,
        },
      });
    }

    // Return updated poll with vote counts
    const updatedPoll = await prisma.poll.findUnique({
      where: { id: post.poll.id },
      include: {
        options: {
          orderBy: { order: 'asc' },
          include: {
            _count: { select: { votes: true } },
          },
        },
      },
    });

    return {
      poll: updatedPoll,
      votedOptionId: optionId,
    };
  }

  // Remove vote from poll
  async unvotePoll(userId: string, postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { poll: true },
    });

    if (!post || !post.poll) {
      throw new AppError('Bài viết không có bình chọn', HTTP_STATUS.NOT_FOUND);
    }

    await prisma.pollVote.deleteMany({
      where: {
        voterId: userId,
        option: { pollId: post.poll.id },
      },
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
  async getComments(postId: string, currentUserId?: string, page?: string, limit?: string) {
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
              isVerified: true,
            },
          },
          _count: {
            select: {
              likes: true,
              replies: true,
              shares: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  fullName: true,
                  avatar: true,
                  isVerified: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                  replies: true,
                  shares: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
            take: 3, // Only show first 3 replies initially
          },
        },
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.comment.count({ where }),
    ]);

    // Get liked and shared status for comments and replies
    let likedCommentIds = new Set<string>();
    let sharedCommentIds = new Set<string>();
    if (currentUserId) {
      const allCommentIds = comments.flatMap(c => [c.id, ...c.replies.map(r => r.id)]);
      const [liked, shared] = await Promise.all([
        prisma.commentLike.findMany({
          where: { userId: currentUserId, commentId: { in: allCommentIds } },
          select: { commentId: true },
        }),
        prisma.commentShare.findMany({
          where: { userId: currentUserId, commentId: { in: allCommentIds } },
          select: { commentId: true },
        }),
      ]);
      likedCommentIds = new Set(liked.map(l => l.commentId));
      sharedCommentIds = new Set(shared.map(s => s.commentId));
    }

    // Transform comments to include likesCount, sharesCount, isLiked, isShared
    const transformedComments = comments.map(comment => ({
      ...comment,
      likesCount: comment._count.likes,
      repliesCount: comment._count.replies,
      sharesCount: comment._count.shares,
      isLiked: likedCommentIds.has(comment.id),
      isShared: sharedCommentIds.has(comment.id),
      _count: undefined,
      replies: comment.replies.map(reply => ({
        ...reply,
        likesCount: reply._count.likes,
        repliesCount: reply._count.replies,
        sharesCount: reply._count.shares,
        isLiked: likedCommentIds.has(reply.id),
        isShared: sharedCommentIds.has(reply.id),
        _count: undefined,
      })),
    }));

    return paginate(transformedComments, total, p, l);
  }

  // Get comment replies
  async getCommentReplies(commentId: string, currentUserId?: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    const [replies, total] = await Promise.all([
      prisma.comment.findMany({
        where: { parentId: commentId },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
              isVerified: true,
            },
          },
          _count: {
            select: {
              likes: true,
              replies: true,
              shares: true,
            },
          },
        },
        skip,
        take: l,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.comment.count({ where: { parentId: commentId } }),
    ]);

    // Get liked and shared status
    let likedCommentIds = new Set<string>();
    let sharedCommentIds = new Set<string>();
    if (currentUserId) {
      const replyIds = replies.map(r => r.id);
      const [liked, shared] = await Promise.all([
        prisma.commentLike.findMany({
          where: { userId: currentUserId, commentId: { in: replyIds } },
          select: { commentId: true },
        }),
        prisma.commentShare.findMany({
          where: { userId: currentUserId, commentId: { in: replyIds } },
          select: { commentId: true },
        }),
      ]);
      likedCommentIds = new Set(liked.map(l => l.commentId));
      sharedCommentIds = new Set(shared.map(s => s.commentId));
    }

    const transformedReplies = replies.map(reply => ({
      ...reply,
      likesCount: reply._count.likes,
      repliesCount: reply._count.replies,
      sharesCount: reply._count.shares,
      isLiked: likedCommentIds.has(reply.id),
      isShared: sharedCommentIds.has(reply.id),
      _count: undefined,
    }));

    return paginate(transformedReplies, total, p, l);
  }

  // Like comment
  async likeComment(userId: string, commentId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new AppError(ERROR_MESSAGES.COMMENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: { userId, commentId },
      },
    });

    if (existingLike) {
      throw new AppError(ERROR_MESSAGES.ALREADY_LIKED, HTTP_STATUS.CONFLICT);
    }

    await prisma.commentLike.create({
      data: { userId, commentId },
    });

    // Create notification (if not own comment)
    if (comment.authorId !== userId) {
      await prisma.notification.create({
        data: {
          type: 'LIKE',
          senderId: userId,
          receiverId: comment.authorId,
          referenceId: comment.postId,
          content: 'liked your comment',
        },
      });
    }
  }

  // Unlike comment
  async unlikeComment(userId: string, commentId: string) {
    const like = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: { userId, commentId },
      },
    });

    if (!like) {
      throw new AppError(ERROR_MESSAGES.NOT_LIKED, HTTP_STATUS.BAD_REQUEST);
    }

    await prisma.commentLike.delete({
      where: { id: like.id },
    });
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
