import { Response } from 'express';
import { commentService } from '../services';
import { AuthenticatedRequest } from '../types';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import { config } from '../config';

class CommentController {
  async getComments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const { page = '1', limit = '20' } = req.query;
      const userId = req.userId;

      const result = await commentService.getComments(
        postId,
        userId,
        parseInt(page as string),
        Math.min(parseInt(limit as string), config.pagination.maxLimit)
      );

      res.json(result);
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.GET_COMMENTS_FAILED });
    }
  }

  async addComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const userId = req.userId!;

      const comment = await commentService.addComment(postId, userId, req.body);
      res.status(201).json(comment);
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.POST_NOT_FOUND) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message === ERROR_MESSAGES.PARENT_COMMENT_NOT_FOUND) {
        res.status(404).json({ error: error.message });
        return;
      }
      console.error('Add comment error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.ADD_COMMENT_FAILED });
    }
  }

  async deleteComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId, commentId } = req.params;
      const userId = req.userId!;

      await commentService.deleteComment(postId, commentId, userId);
      res.json({ message: SUCCESS_MESSAGES.COMMENT_DELETED });
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.COMMENT_NOT_FOUND) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message === ERROR_MESSAGES.NOT_AUTHORIZED) {
        res.status(403).json({ error: error.message });
        return;
      }
      console.error('Delete comment error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.DELETE_COMMENT_FAILED });
    }
  }

  async likeComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const userId = req.userId!;

      await commentService.likeComment(commentId, userId);
      res.json({ message: SUCCESS_MESSAGES.COMMENT_LIKED });
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.ALREADY_LIKED) {
        res.status(400).json({ error: error.message });
        return;
      }
      console.error('Like comment error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.LIKE_COMMENT_FAILED });
    }
  }

  async unlikeComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const userId = req.userId!;

      await commentService.unlikeComment(commentId, userId);
      res.json({ message: SUCCESS_MESSAGES.COMMENT_UNLIKED });
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.NOT_LIKED) {
        res.status(400).json({ error: error.message });
        return;
      }
      console.error('Unlike comment error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.UNLIKE_COMMENT_FAILED });
    }
  }

  async getReplies(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const { page = '1', limit = '20' } = req.query;
      const userId = req.userId;

      const result = await commentService.getReplies(
        commentId,
        userId,
        parseInt(page as string),
        Math.min(parseInt(limit as string), config.pagination.maxLimit)
      );

      res.json(result);
    } catch (error) {
      console.error('Get replies error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.GET_REPLIES_FAILED });
    }
  }
}

export const commentController = new CommentController();
