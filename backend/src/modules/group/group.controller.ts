import { Request, Response, NextFunction } from 'express';
import { groupService } from './group.service';
import { AuthRequest } from '../../shared/types';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../shared/constants';
import { sendSuccess } from '../../shared/utils';
import { MemberStatus } from '@prisma/client';

export class GroupController {
  async createGroup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const group = await groupService.createGroup(req.user!.userId, req.body);
      sendSuccess(res, group, SUCCESS_MESSAGES.GROUP_CREATED, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async getGroup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const groupId = req.params.groupId as string;
      const group = await groupService.getGroup(groupId, req.user?.userId);
      sendSuccess(res, group);
    } catch (error) {
      next(error);
    }
  }

  async updateGroup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const groupId = req.params.groupId as string;
      const group = await groupService.updateGroup(groupId, req.user!.userId, req.body);
      sendSuccess(res, group, SUCCESS_MESSAGES.GROUP_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async deleteGroup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const groupId = req.params.groupId as string;
      await groupService.deleteGroup(groupId, req.user!.userId);
      sendSuccess(res, null, SUCCESS_MESSAGES.GROUP_DELETED);
    } catch (error) {
      next(error);
    }
  }

  async listGroups(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search } = req.query;
      const result = await groupService.listGroups(
        page as string,
        limit as string,
        search as string
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async joinGroup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const groupId = req.params.groupId as string;
      const result = await groupService.joinGroup(groupId, req.user!.userId);
      sendSuccess(res, result, SUCCESS_MESSAGES.JOIN_REQUEST_SENT);
    } catch (error) {
      next(error);
    }
  }

  async leaveGroup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const groupId = req.params.groupId as string;
      await groupService.leaveGroup(groupId, req.user!.userId);
      sendSuccess(res, null);
    } catch (error) {
      next(error);
    }
  }

  async approveMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const groupId = req.params.groupId as string;
      const memberId = req.params.memberId as string;
      await groupService.approveMember(groupId, req.user!.userId, memberId);
      sendSuccess(res, null, SUCCESS_MESSAGES.MEMBER_APPROVED);
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const groupId = req.params.groupId as string;
      const memberId = req.params.memberId as string;
      await groupService.removeMember(groupId, req.user!.userId, memberId);
      sendSuccess(res, null, SUCCESS_MESSAGES.MEMBER_REMOVED);
    } catch (error) {
      next(error);
    }
  }

  async getMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const groupId = req.params.groupId as string;
      const { page, limit, status } = req.query;
      const result = await groupService.getMembers(
        groupId,
        page as string,
        limit as string,
        status as MemberStatus
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const groupController = new GroupController();
