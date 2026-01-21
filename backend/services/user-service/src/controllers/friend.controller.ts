import { Response } from 'express';
import { friendService } from '../services';
import { AuthenticatedRequest } from '../types';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import { config } from '../config';

class FriendController {
  async getFriends(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { page = '1', limit = '20' } = req.query;

      const result = await friendService.getFriends(
        userId,
        parseInt(page as string),
        Math.min(parseInt(limit as string), config.pagination.maxLimit)
      );

      res.json(result);
    } catch (error) {
      console.error('Get friends error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.GET_FRIENDS_FAILED });
    }
  }

  async getFriendRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { page = '1', limit = '20' } = req.query;

      const result = await friendService.getFriendRequests(
        userId,
        parseInt(page as string),
        Math.min(parseInt(limit as string), config.pagination.maxLimit)
      );

      res.json(result);
    } catch (error) {
      console.error('Get friend requests error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.GET_REQUESTS_FAILED });
    }
  }

  async sendFriendRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { id: receiverId } = req.params;

      const request = await friendService.sendFriendRequest(userId, receiverId);
      res.status(201).json(request);
    } catch (error: any) {
      if ([ERROR_MESSAGES.CANNOT_SELF_ACTION, ERROR_MESSAGES.ALREADY_FRIENDS, ERROR_MESSAGES.REQUEST_EXISTS].includes(error.message)) {
        res.status(400).json({ error: error.message });
        return;
      }
      console.error('Send friend request error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.SEND_REQUEST_FAILED });
    }
  }

  async acceptFriendRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { id: senderId } = req.params;

      await friendService.acceptFriendRequest(userId, senderId);
      res.json({ message: SUCCESS_MESSAGES.REQUEST_ACCEPTED });
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.REQUEST_NOT_FOUND) {
        res.status(404).json({ error: error.message });
        return;
      }
      console.error('Accept friend request error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.ACCEPT_REQUEST_FAILED });
    }
  }

  async rejectFriendRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { id: senderId } = req.params;

      await friendService.rejectFriendRequest(userId, senderId);
      res.json({ message: SUCCESS_MESSAGES.REQUEST_REJECTED });
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.REQUEST_NOT_FOUND) {
        res.status(404).json({ error: error.message });
        return;
      }
      console.error('Reject friend request error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.REJECT_REQUEST_FAILED });
    }
  }

  async unfriend(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { id: friendId } = req.params;

      await friendService.unfriend(userId, friendId);
      res.json({ message: SUCCESS_MESSAGES.UNFRIENDED });
    } catch (error) {
      console.error('Unfriend error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.UNFRIEND_FAILED });
    }
  }

  async follow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { id: followingId } = req.params;

      await friendService.follow(userId, followingId);
      res.json({ message: SUCCESS_MESSAGES.FOLLOWED });
    } catch (error: any) {
      if ([ERROR_MESSAGES.CANNOT_SELF_ACTION, ERROR_MESSAGES.ALREADY_FOLLOWING].includes(error.message)) {
        res.status(400).json({ error: error.message });
        return;
      }
      console.error('Follow error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.FOLLOW_FAILED });
    }
  }

  async unfollow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { id: followingId } = req.params;

      await friendService.unfollow(userId, followingId);
      res.json({ message: SUCCESS_MESSAGES.UNFOLLOWED });
    } catch (error) {
      console.error('Unfollow error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.UNFOLLOW_FAILED });
    }
  }

  async getFollowers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = '1', limit = '20' } = req.query;

      const result = await friendService.getFollowers(
        id,
        parseInt(page as string),
        Math.min(parseInt(limit as string), config.pagination.maxLimit)
      );

      res.json(result);
    } catch (error) {
      console.error('Get followers error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.GET_FOLLOWERS_FAILED });
    }
  }

  async getFollowing(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = '1', limit = '20' } = req.query;

      const result = await friendService.getFollowing(
        id,
        parseInt(page as string),
        Math.min(parseInt(limit as string), config.pagination.maxLimit)
      );

      res.json(result);
    } catch (error) {
      console.error('Get following error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.GET_FOLLOWING_FAILED });
    }
  }

  async blockUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { id: blockedId } = req.params;

      await friendService.blockUser(userId, blockedId);
      res.json({ message: SUCCESS_MESSAGES.BLOCKED });
    } catch (error) {
      console.error('Block error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.BLOCK_FAILED });
    }
  }

  async unblockUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { id: blockedId } = req.params;

      await friendService.unblockUser(userId, blockedId);
      res.json({ message: SUCCESS_MESSAGES.UNBLOCKED });
    } catch (error) {
      console.error('Unblock error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.UNBLOCK_FAILED });
    }
  }

  async getBlockedUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const users = await friendService.getBlockedUsers(userId);
      res.json(users);
    } catch (error) {
      console.error('Get blocked users error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.GET_BLOCKED_FAILED });
    }
  }
}

export const friendController = new FriendController();
