import { Request, Response, NextFunction } from 'express';
import { postService } from './post.service';
import { AuthRequest } from '../../shared/types';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../shared/constants';
import { sendSuccess } from '../../shared/utils';

export class PostController {
  async createPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { mediaIds, ...data } = req.body;
      const post = await postService.createPost(req.user!.userId, data, mediaIds);
      sendSuccess(res, post, SUCCESS_MESSAGES.POST_CREATED, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async getPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const postId = req.params.postId as string;
      const post = await postService.getPost(postId, req.user?.userId);
      sendSuccess(res, post);
    } catch (error) {
      next(error);
    }
  }

  async updatePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const postId = req.params.postId as string;
      const post = await postService.updatePost(postId, req.user!.userId, req.body);
      sendSuccess(res, post, SUCCESS_MESSAGES.POST_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async deletePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const postId = req.params.postId as string;
      await postService.deletePost(postId, req.user!.userId);
      sendSuccess(res, null, SUCCESS_MESSAGES.POST_DELETED);
    } catch (error) {
      next(error);
    }
  }

  async getFeed(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const result = await postService.getFeed(
        req.user!.userId,
        page as string,
        limit as string
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getUserPosts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const { page, limit } = req.query;
      const result = await postService.getUserPosts(
        userId,
        req.user?.userId,
        page as string,
        limit as string
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async likePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const postId = req.params.postId as string;
      await postService.likePost(req.user!.userId, postId);
      sendSuccess(res, null);
    } catch (error) {
      next(error);
    }
  }

  async unlikePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const postId = req.params.postId as string;
      await postService.unlikePost(req.user!.userId, postId);
      sendSuccess(res, null);
    } catch (error) {
      next(error);
    }
  }

  async votePoll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const postId = req.params.postId as string;
      const { optionId } = req.body;
      const result = await postService.votePoll(req.user!.userId, postId, optionId);
      sendSuccess(res, result, 'Đã bình chọn');
    } catch (error) {
      next(error);
    }
  }

  async unvotePoll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const postId = req.params.postId as string;
      await postService.unvotePoll(req.user!.userId, postId);
      sendSuccess(res, null, 'Đã hủy bình chọn');
    } catch (error) {
      next(error);
    }
  }

  async sharePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const postId = req.params.postId as string;
      await postService.sharePost(req.user!.userId, postId);
      sendSuccess(res, null, SUCCESS_MESSAGES.POST_SHARED);
    } catch (error) {
      next(error);
    }
  }

  async unsharePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const postId = req.params.postId as string;
      await postService.unsharePost(req.user!.userId, postId);
      sendSuccess(res, null, SUCCESS_MESSAGES.POST_UNSHARED);
    } catch (error) {
      next(error);
    }
  }

  async getSharedPosts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const { page, limit } = req.query;
      const result = await postService.getSharedPosts(
        userId,
        req.user?.userId,
        page as string,
        limit as string
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getUserReplies(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const { page, limit } = req.query;
      const result = await postService.getUserReplies(
        userId,
        req.user?.userId,
        page as string,
        limit as string
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const postId = req.params.postId as string;
      const comment = await postService.createComment(req.user!.userId, postId, req.body);
      sendSuccess(res, comment, SUCCESS_MESSAGES.COMMENT_CREATED, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async getComments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const postId = req.params.postId as string;
      const { page, limit } = req.query;
      const result = await postService.getComments(postId, req.user?.userId, page as string, limit as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getCommentReplies(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const commentId = req.params.commentId as string;
      const { page, limit } = req.query;
      const result = await postService.getCommentReplies(commentId, req.user?.userId, page as string, limit as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async likeComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const commentId = req.params.commentId as string;
      await postService.likeComment(req.user!.userId, commentId);
      sendSuccess(res, null, 'Comment liked');
    } catch (error) {
      next(error);
    }
  }

  async unlikeComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const commentId = req.params.commentId as string;
      await postService.unlikeComment(req.user!.userId, commentId);
      sendSuccess(res, null, 'Comment unliked');
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const commentId = req.params.commentId as string;
      await postService.deleteComment(commentId, req.user!.userId);
      sendSuccess(res, null, SUCCESS_MESSAGES.COMMENT_DELETED);
    } catch (error) {
      next(error);
    }
  }

  async shareComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const commentId = req.params.commentId as string;
      await postService.shareComment(req.user!.userId, commentId);
      sendSuccess(res, null, 'Comment shared');
    } catch (error) {
      next(error);
    }
  }

  async unshareComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const commentId = req.params.commentId as string;
      await postService.unshareComment(req.user!.userId, commentId);
      sendSuccess(res, null, 'Comment unshared');
    } catch (error) {
      next(error);
    }
  }

  async getSharedComments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const { page, limit } = req.query;
      const result = await postService.getSharedComments(
        userId,
        req.user?.userId,
        page as string,
        limit as string
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const postController = new PostController();
