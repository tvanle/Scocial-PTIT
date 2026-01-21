import { Response } from 'express';
import { AuthRequest } from '../middleware';
import { groupService } from '../services';
import { SUCCESS_MESSAGES } from '../constants';
import type { CreateGroupData, UpdateGroupData, JoinGroupData, HandleJoinRequestData, UpdateMemberRoleData } from '../types';

export class GroupController {
  async getGroups(req: AuthRequest, res: Response): Promise<void> {
    const { page, limit, search, category } = req.query;

    const result = await groupService.getGroups(
      req.userId,
      { page: page as string, limit: limit as string },
      { search: search as string, category: category as string }
    );

    res.json(result);
  }

  async getUserGroups(req: AuthRequest, res: Response): Promise<void> {
    const groups = await groupService.getUserGroups(req.userId!);
    res.json(groups);
  }

  async createGroup(req: AuthRequest, res: Response): Promise<void> {
    const data: CreateGroupData = req.body;
    const group = await groupService.createGroup(req.userId!, data);
    res.status(201).json(group);
  }

  async getGroupById(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const group = await groupService.getGroupById(id, req.userId);
    res.json(group);
  }

  async updateGroup(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const data: UpdateGroupData = req.body;
    const group = await groupService.updateGroup(id, req.userId!, data);
    res.json(group);
  }

  async deleteGroup(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    await groupService.deleteGroup(id, req.userId!);
    res.json({ message: SUCCESS_MESSAGES.GROUP_DELETED });
  }

  async joinGroup(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const data: JoinGroupData = req.body;
    const result = await groupService.joinGroup(id, req.userId!, data);
    res.json(result);
  }

  async leaveGroup(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    await groupService.leaveGroup(id, req.userId!);
    res.json({ message: SUCCESS_MESSAGES.LEFT_GROUP });
  }

  async getMembers(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { page, limit, role } = req.query;

    const result = await groupService.getMembers(
      id,
      { page: page as string, limit: limit as string },
      role as string
    );

    res.json(result);
  }

  async removeMember(req: AuthRequest, res: Response): Promise<void> {
    const { id, memberId } = req.params;
    await groupService.removeMember(id, req.userId!, memberId);
    res.json({ message: SUCCESS_MESSAGES.MEMBER_REMOVED });
  }

  async updateMemberRole(req: AuthRequest, res: Response): Promise<void> {
    const { id, memberId } = req.params;
    const data: UpdateMemberRoleData = req.body;
    await groupService.updateMemberRole(id, req.userId!, memberId, data);
    res.json({ message: SUCCESS_MESSAGES.ROLE_UPDATED });
  }

  async getJoinRequests(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const requests = await groupService.getJoinRequests(id, req.userId!);
    res.json(requests);
  }

  async handleJoinRequest(req: AuthRequest, res: Response): Promise<void> {
    const { id, requestId } = req.params;
    const data: HandleJoinRequestData = req.body;
    const result = await groupService.handleJoinRequest(id, requestId, req.userId!, data);
    res.json(result);
  }
}

export const groupController = new GroupController();
