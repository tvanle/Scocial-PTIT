import { Response } from 'express';
import { userService } from '../services';
import { AuthenticatedRequest } from '../types';
import { ERROR_MESSAGES } from '../constants';
import { config } from '../config';

class UserController {
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const user = await userService.getProfile(userId);
      res.json(user);
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.USER_NOT_FOUND) {
        res.status(404).json({ error: error.message });
        return;
      }
      console.error('Get profile error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.GET_PROFILE_FAILED });
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const user = await userService.updateProfile(userId, req.body);
      res.json(user);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.UPDATE_PROFILE_FAILED });
    }
  }

  async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = req.userId;
      const user = await userService.getUserById(id, currentUserId);
      res.json(user);
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.USER_NOT_FOUND) {
        res.status(404).json({ error: error.message });
        return;
      }
      console.error('Get user error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.GET_USER_FAILED });
    }
  }

  async searchUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { query, page = '1', limit = '20' } = req.query;
      const currentUserId = req.userId!;

      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: ERROR_MESSAGES.SEARCH_QUERY_REQUIRED });
        return;
      }

      const result = await userService.searchUsers(
        query,
        currentUserId,
        parseInt(page as string),
        Math.min(parseInt(limit as string), config.pagination.maxLimit)
      );

      res.json(result);
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.SEARCH_FAILED });
    }
  }

  async updateAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { url } = req.body;

      if (!url) {
        res.status(400).json({ error: ERROR_MESSAGES.AVATAR_URL_REQUIRED });
        return;
      }

      const result = await userService.updateAvatar(userId, url);
      res.json(result);
    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.UPLOAD_AVATAR_FAILED });
    }
  }

  async updateCover(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { url } = req.body;

      if (!url) {
        res.status(400).json({ error: ERROR_MESSAGES.COVER_URL_REQUIRED });
        return;
      }

      const result = await userService.updateCover(userId, url);
      res.json(result);
    } catch (error) {
      console.error('Upload cover error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.UPLOAD_COVER_FAILED });
    }
  }

  async getSuggestions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { limit = '10' } = req.query;

      const users = await userService.getSuggestions(
        userId,
        Math.min(parseInt(limit as string), config.pagination.maxLimit)
      );

      res.json(users);
    } catch (error) {
      console.error('Get suggestions error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.GET_SUGGESTIONS_FAILED });
    }
  }
}

export const userController = new UserController();
