import { Response } from 'express';
import { AuthRequest } from '../middleware';
import { groupPostService } from '../services';
import { SUCCESS_MESSAGES } from '../constants';
import type { CreateGroupPostData, CreateCommentData } from '../types';

export class GroupPostController {
  async getPosts(req: AuthRequest, res: Response): Promise<void> {
    const { groupId } = req.params;
    const { page, limit } = req.query;

    const result = await groupPostService.getPosts(
      groupId,
      req.userId,
      { page: page as string, limit: limit as string }
    );

    res.json(result);
  }

  async createPost(req: AuthRequest, res: Response): Promise<void> {
    const { groupId } = req.params;
    const data: CreateGroupPostData = req.body;

    const post = await groupPostService.createPost(groupId, req.userId!, data);
    res.status(201).json(post);
  }

  async deletePost(req: AuthRequest, res: Response): Promise<void> {
    const { groupId, postId } = req.params;

    await groupPostService.deletePost(groupId, postId, req.userId!);
    res.json({ message: SUCCESS_MESSAGES.POST_DELETED });
  }

  async likePost(req: AuthRequest, res: Response): Promise<void> {
    const { postId } = req.params;

    await groupPostService.likePost(postId, req.userId!);
    res.json({ message: SUCCESS_MESSAGES.POST_LIKED });
  }

  async unlikePost(req: AuthRequest, res: Response): Promise<void> {
    const { postId } = req.params;

    await groupPostService.unlikePost(postId, req.userId!);
    res.json({ message: SUCCESS_MESSAGES.POST_UNLIKED });
  }

  async togglePin(req: AuthRequest, res: Response): Promise<void> {
    const { groupId, postId } = req.params;

    const result = await groupPostService.togglePin(groupId, postId, req.userId!);
    const message = result.isPinned ? SUCCESS_MESSAGES.POST_PINNED : SUCCESS_MESSAGES.POST_UNPINNED;
    res.json({ message });
  }

  async getComments(req: AuthRequest, res: Response): Promise<void> {
    const { postId } = req.params;
    const { page, limit } = req.query;

    const result = await groupPostService.getComments(
      postId,
      req.userId,
      { page: page as string, limit: limit as string }
    );

    res.json(result);
  }

  async createComment(req: AuthRequest, res: Response): Promise<void> {
    const { postId } = req.params;
    const data: CreateCommentData = req.body;

    const comment = await groupPostService.createComment(postId, req.userId!, data);
    res.status(201).json(comment);
  }
}

export const groupPostController = new GroupPostController();
