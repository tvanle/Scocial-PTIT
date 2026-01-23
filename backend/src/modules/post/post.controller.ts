import { Request, Response, NextFunction } from 'express';
import { postService } from './post.service';
import { AuthRequest } from '../../shared/types';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../shared/constants';
import { sendSuccess } from '../../shared/utils';

export class PostController {
  async createPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const post = await postService.createPost(req.user!.userId, req.body);
      sendSuccess(res, post, SUCCESS_MESSAGES.POST_CREATED, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async getPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const post = await postService.getPost(postId, req.user?.userId);
      sendSuccess(res, post);
    } catch (error) {
      next(error);
    }
  }

  async updatePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const post = await postService.updatePost(postId, req.user!.userId, req.body);
      sendSuccess(res, post, SUCCESS_MESSAGES.POST_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async deletePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
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
      const { userId } = req.params;
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
      const { postId } = req.params;
      await postService.likePost(req.user!.userId, postId);
      sendSuccess(res, null);
    } catch (error) {
      next(error);
    }
  }

  async unlikePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      await postService.unlikePost(req.user!.userId, postId);
      sendSuccess(res, null);
    } catch (error) {
      next(error);
    }
  }

  async createComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const comment = await postService.createComment(req.user!.userId, postId, req.body);
      sendSuccess(res, comment, SUCCESS_MESSAGES.COMMENT_CREATED, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const { page, limit } = req.query;
      const result = await postService.getComments(postId, page as string, limit as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      await postService.deleteComment(commentId, req.user!.userId);
      sendSuccess(res, null, SUCCESS_MESSAGES.COMMENT_DELETED);
    } catch (error) {
      next(error);
    }
  }
}

export const postController = new PostController();
