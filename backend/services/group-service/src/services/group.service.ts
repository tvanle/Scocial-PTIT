import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware';
import { ERROR_MESSAGES } from '../constants';
import type {
  CreateGroupData,
  UpdateGroupData,
  GroupFilters,
  PaginationQuery,
  PaginatedResponse,
  JoinGroupData,
  HandleJoinRequestData,
  UpdateMemberRoleData,
} from '../types';

const prisma = new PrismaClient();

export class GroupService {
  async getGroups(
    userId: string | undefined,
    pagination: PaginationQuery,
    filters: GroupFilters
  ): Promise<PaginatedResponse<any>> {
    const page = parseInt(pagination.page || '1');
    const limit = parseInt(pagination.limit || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      privacy: { not: 'SECRET' },
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.category) {
      where.category = filters.category;
    }

    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where,
        skip,
        take: limit,
        orderBy: { membersCount: 'desc' },
      }),
      prisma.group.count({ where }),
    ]);

    const groupsWithMembership = await Promise.all(
      groups.map(async (group) => {
        const membership = userId
          ? await prisma.groupMember.findUnique({
              where: { groupId_userId: { groupId: group.id, userId } },
            })
          : null;

        return {
          ...group,
          isMember: !!membership,
          memberRole: membership?.role,
        };
      })
    );

    return {
      data: groupsWithMembership,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getUserGroups(userId: string): Promise<any[]> {
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: { group: true },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      ...m.group,
      memberRole: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  async createGroup(userId: string, data: CreateGroupData): Promise<any> {
    const group = await prisma.$transaction(async (tx) => {
      const newGroup = await tx.group.create({
        data: {
          ...data,
          membersCount: 1,
        },
      });

      await tx.groupMember.create({
        data: {
          groupId: newGroup.id,
          userId,
          role: 'OWNER',
        },
      });

      return newGroup;
    });

    return group;
  }

  async getGroupById(groupId: string, userId?: string): Promise<any> {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new AppError(404, ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    if (group.privacy === 'SECRET') {
      const membership = userId
        ? await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
          })
        : null;

      if (!membership) {
        throw new AppError(404, ERROR_MESSAGES.GROUP_NOT_FOUND);
      }
    }

    const membership = userId
      ? await prisma.groupMember.findUnique({
          where: { groupId_userId: { groupId, userId } },
        })
      : null;

    const staff = await prisma.groupMember.findMany({
      where: {
        groupId,
        role: { in: ['OWNER', 'ADMIN', 'MODERATOR'] },
      },
    });

    return {
      ...group,
      isMember: !!membership,
      memberRole: membership?.role,
      staff,
    };
  }

  async updateGroup(groupId: string, userId: string, data: UpdateGroupData): Promise<any> {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new AppError(403, ERROR_MESSAGES.NOT_AUTHORIZED);
    }

    const group = await prisma.group.update({
      where: { id: groupId },
      data,
    });

    return group;
  }

  async deleteGroup(groupId: string, userId: string): Promise<void> {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership || membership.role !== 'OWNER') {
      throw new AppError(403, ERROR_MESSAGES.ONLY_OWNER_CAN_DELETE);
    }

    await prisma.group.delete({ where: { id: groupId } });
  }

  async joinGroup(groupId: string, userId: string, data: JoinGroupData): Promise<{ message: string }> {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new AppError(404, ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    const existingMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (existingMember) {
      throw new AppError(400, ERROR_MESSAGES.ALREADY_MEMBER);
    }

    if (group.requireApproval || group.privacy === 'PRIVATE') {
      const existingRequest = await prisma.groupJoinRequest.findFirst({
        where: { groupId, userId, status: 'PENDING' },
      });

      if (existingRequest) {
        throw new AppError(400, ERROR_MESSAGES.JOIN_REQUEST_ALREADY_PENDING);
      }

      await prisma.groupJoinRequest.create({
        data: { groupId, userId, message: data.message },
      });

      return { message: 'Join request sent' };
    }

    await prisma.$transaction([
      prisma.groupMember.create({
        data: { groupId, userId },
      }),
      prisma.group.update({
        where: { id: groupId },
        data: { membersCount: { increment: 1 } },
      }),
    ]);

    return { message: 'Joined group' };
  }

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership) {
      throw new AppError(400, ERROR_MESSAGES.NOT_MEMBER);
    }

    if (membership.role === 'OWNER') {
      throw new AppError(400, ERROR_MESSAGES.OWNER_CANNOT_LEAVE);
    }

    await prisma.$transaction([
      prisma.groupMember.delete({
        where: { groupId_userId: { groupId, userId } },
      }),
      prisma.group.update({
        where: { id: groupId },
        data: { membersCount: { decrement: 1 } },
      }),
    ]);
  }

  async getMembers(groupId: string, pagination: PaginationQuery, role?: string): Promise<PaginatedResponse<any>> {
    const page = parseInt(pagination.page || '1');
    const limit = parseInt(pagination.limit || '20');
    const skip = (page - 1) * limit;

    const where: any = { groupId };
    if (role) {
      where.role = role;
    }

    const [members, total] = await Promise.all([
      prisma.groupMember.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      }),
      prisma.groupMember.count({ where }),
    ]);

    return {
      data: members,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async removeMember(groupId: string, userId: string, memberId: string): Promise<void> {
    const requesterMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!requesterMembership || !['OWNER', 'ADMIN', 'MODERATOR'].includes(requesterMembership.role)) {
      throw new AppError(403, ERROR_MESSAGES.NOT_AUTHORIZED);
    }

    const targetMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: memberId } },
    });

    if (!targetMembership) {
      throw new AppError(404, ERROR_MESSAGES.MEMBER_NOT_FOUND);
    }

    if (targetMembership.role === 'OWNER') {
      throw new AppError(403, ERROR_MESSAGES.CANNOT_REMOVE_OWNER);
    }

    if (targetMembership.role === 'ADMIN' && requesterMembership.role !== 'OWNER') {
      throw new AppError(403, ERROR_MESSAGES.ONLY_OWNER_CAN_REMOVE_ADMINS);
    }

    await prisma.$transaction([
      prisma.groupMember.delete({
        where: { groupId_userId: { groupId, userId: memberId } },
      }),
      prisma.group.update({
        where: { id: groupId },
        data: { membersCount: { decrement: 1 } },
      }),
    ]);
  }

  async updateMemberRole(groupId: string, userId: string, memberId: string, data: UpdateMemberRoleData): Promise<void> {
    const requesterMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!requesterMembership || requesterMembership.role !== 'OWNER') {
      throw new AppError(403, ERROR_MESSAGES.ONLY_OWNER_CAN_CHANGE_ROLES);
    }

    if (data.role === 'OWNER') {
      await prisma.$transaction([
        prisma.groupMember.update({
          where: { groupId_userId: { groupId, userId } },
          data: { role: 'ADMIN' },
        }),
        prisma.groupMember.update({
          where: { groupId_userId: { groupId, userId: memberId } },
          data: { role: 'OWNER' },
        }),
      ]);
    } else {
      await prisma.groupMember.update({
        where: { groupId_userId: { groupId, userId: memberId } },
        data: { role: data.role },
      });
    }
  }

  async getJoinRequests(groupId: string, userId: string): Promise<any[]> {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership || !['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role)) {
      throw new AppError(403, ERROR_MESSAGES.NOT_AUTHORIZED);
    }

    const requests = await prisma.groupJoinRequest.findMany({
      where: { groupId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  }

  async handleJoinRequest(
    groupId: string,
    requestId: string,
    userId: string,
    data: HandleJoinRequestData
  ): Promise<{ message: string }> {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership || !['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role)) {
      throw new AppError(403, ERROR_MESSAGES.NOT_AUTHORIZED);
    }

    const request = await prisma.groupJoinRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.groupId !== groupId) {
      throw new AppError(404, ERROR_MESSAGES.REQUEST_NOT_FOUND);
    }

    if (data.action === 'approve') {
      await prisma.$transaction([
        prisma.groupJoinRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED', reviewedBy: userId, reviewedAt: new Date() },
        }),
        prisma.groupMember.create({
          data: { groupId, userId: request.userId },
        }),
        prisma.group.update({
          where: { id: groupId },
          data: { membersCount: { increment: 1 } },
        }),
      ]);
      return { message: 'Request approved' };
    } else {
      await prisma.groupJoinRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED', reviewedBy: userId, reviewedAt: new Date() },
      });
      return { message: 'Request rejected' };
    }
  }
}

export const groupService = new GroupService();
