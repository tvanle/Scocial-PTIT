import { Response } from 'express';
import { postService } from '../services';
import { AuthenticatedRequest } from '../types';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import { config } from '../config';

class PostController {
  async getFeed(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { page = '1', limit = '20', cursor } = req.query;

      const result = await postService.getFeed(
        userId,
        parseInt(page as string),
        Math.min(parseInt(limit as string), config.pagination.maxLimit),
        cursor as string | undefined
      );

      res.json(result);
    } catch (error) {
      console.error('Get feed error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.GET_FEED_FAILED });
    }
  }

  async createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const post = await postService.createPost(userId, req.body);
      res.status(201).json(post);
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.CREATE_POST_FAILED });
    }
  }

  async getPostById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const post = await postService.getPostById(id, userId);
      res.json(post);
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.POST_NOT_FOUND) {
        res.status(404).json({ error: error.message });
        return;
      }
      console.error('Get post error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.GET_POST_FAILED });
    }
  }

  async updatePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const post = await postService.updatePost(id, userId, req.body);
      res.json(post);
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.POST_NOT_FOUND) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message === ERROR_MESSAGES.NOT_AUTHORIZED_EDIT) {
        res.status(403).json({ error: error.message });
        return;
      }
      console.error('Update post error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.UPDATE_POST_FAILED });
    }
  }

  async deletePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      await postService.deletePost(id, userId);
      res.json({ message: SUCCESS_MESSAGES.POST_DELETED });
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.POST_NOT_FOUND) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message === ERROR_MESSAGES.NOT_AUTHORIZED_DELETE) {
        res.status(403).json({ error: error.message });
        return;
      }
      console.error('Delete post error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.DELETE_POST_FAILED });
    }
  }

  async likePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      await postService.likePost(id, userId);
      res.json({ message: SUCCESS_MESSAGES.POST_LIKED });
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.ALREADY_LIKED) {
        res.status(400).json({ error: error.message });
        return;
      }
      console.error('Like post error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.LIKE_POST_FAILED });
    }
  }

  async unlikePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      await postService.unlikePost(id, userId);
      res.json({ message: SUCCESS_MESSAGES.POST_UNLIKED });
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.NOT_LIKED) {
        res.status(400).json({ error: error.message });
        return;
      }
      console.error('Unlike post error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.UNLIKE_POST_FAILED });
    }
  }

  async sharePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const post = await postService.sharePost(id, userId, req.body);
      res.status(201).json(post);
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.POST_NOT_FOUND) {
        res.status(404).json({ error: error.message });
        return;
      }
      console.error('Share post error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.SHARE_POST_FAILED });
    }
  }

  async savePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      await postService.savePost(id, userId);
      res.json({ message: SUCCESS_MESSAGES.POST_SAVED });
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.ALREADY_SAVED) {
        res.status(400).json({ error: error.message });
        return;
      }
      console.error('Save post error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.SAVE_POST_FAILED });
    }
  }

  async unsavePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      await postService.unsavePost(id, userId);
      res.json({ message: SUCCESS_MESSAGES.POST_UNSAVED });
    } catch (error) {
      console.error('Unsave post error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.UNSAVE_POST_FAILED });
    }
  }

  async getSavedPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { page = '1', limit = '20' } = req.query;

      const result = await postService.getSavedPosts(
        userId,
        parseInt(page as string),
        Math.min(parseInt(limit as string), config.pagination.maxLimit)
      );

      res.json(result);
    } catch (error) {
      console.error('Get saved posts error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.GET_SAVED_POSTS_FAILED });
    }
  }

  async reportPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      await postService.reportPost(id, userId, req.body);
      res.json({ message: SUCCESS_MESSAGES.POST_REPORTED });
    } catch (error) {
      console.error('Report post error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.REPORT_POST_FAILED });
    }
  }

  async getUserPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const currentUserId = req.userId!;
      const { page = '1', limit = '20' } = req.query;

      const result = await postService.getUserPosts(
        userId,
        currentUserId,
        parseInt(page as string),
        Math.min(parseInt(limit as string), config.pagination.maxLimit)
      );

      res.json(result);
    } catch (error) {
      console.error('Get user posts error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.GET_USER_POSTS_FAILED });
    }
  }
}

export const postController = new PostController();
