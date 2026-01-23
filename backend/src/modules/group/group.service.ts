import { prisma } from '../../config/database';
import { AppError } from '../../middleware';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../shared/constants';
import { parsePagination, paginate } from '../../shared/utils';
import { GroupPrivacy, GroupRole, MemberStatus } from '@prisma/client';

interface CreateGroupInput {
  name: string;
  description?: string;
  privacy?: GroupPrivacy;
}

interface UpdateGroupInput {
  name?: string;
  description?: string;
  privacy?: GroupPrivacy;
}

export class GroupService {
  // Create group
  async createGroup(ownerId: string, data: CreateGroupInput) {
    const group = await prisma.group.create({
      data: {
        name: data.name,
        description: data.description,
        privacy: data.privacy || 'PUBLIC',
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: 'OWNER',
            status: 'APPROVED',
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: { where: { status: 'APPROVED' } },
            posts: true,
          },
        },
      },
    });

    return group;
  }

  // Get group by ID
  async getGroup(groupId: string, userId?: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: { where: { status: 'APPROVED' } },
            posts: true,
          },
        },
      },
    });

    if (!group) {
      throw new AppError(ERROR_MESSAGES.GROUP_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Check if user is member
    let membership = null;
    if (userId) {
      membership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: { userId, groupId },
        },
      });
    }

    return {
      ...group,
      isMember: membership?.status === 'APPROVED',
      memberRole: membership?.role,
      memberStatus: membership?.status,
    };
  }

  // Update group
  async updateGroup(groupId: string, userId: string, data: UpdateGroupInput) {
    const group = await this.checkGroupAdmin(groupId, userId);

    return prisma.group.update({
      where: { id: groupId },
      data,
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: { where: { status: 'APPROVED' } },
            posts: true,
          },
        },
      },
    });
  }

  // Delete group
  async deleteGroup(groupId: string, userId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new AppError(ERROR_MESSAGES.GROUP_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (group.ownerId !== userId) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    await prisma.group.delete({
      where: { id: groupId },
    });
  }

  // List groups
  async listGroups(page?: string, limit?: string, search?: string) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    const where = search
      ? {
          name: { contains: search, mode: 'insensitive' as const },
          privacy: 'PUBLIC' as const,
        }
      : { privacy: 'PUBLIC' as const };

    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              members: { where: { status: 'APPROVED' } },
            },
          },
        },
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.group.count({ where }),
    ]);

    return paginate(groups, total, p, l);
  }

  // Join group
  async joinGroup(groupId: string, userId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new AppError(ERROR_MESSAGES.GROUP_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const existingMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: { userId, groupId },
      },
    });

    if (existingMember) {
      throw new AppError(ERROR_MESSAGES.ALREADY_MEMBER, HTTP_STATUS.CONFLICT);
    }

    // Auto-approve for public groups
    const status = group.privacy === 'PUBLIC' ? 'APPROVED' : 'PENDING';

    await prisma.groupMember.create({
      data: {
        userId,
        groupId,
        role: 'MEMBER',
        status,
      },
    });

    // Create notification for group owner if pending
    if (status === 'PENDING') {
      await prisma.notification.create({
        data: {
          type: 'GROUP_REQUEST',
          senderId: userId,
          receiverId: group.ownerId,
          referenceId: groupId,
        },
      });
    }

    return { status };
  }

  // Leave group
  async leaveGroup(groupId: string, userId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new AppError(ERROR_MESSAGES.GROUP_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (group.ownerId === userId) {
      throw new AppError(ERROR_MESSAGES.CANNOT_REMOVE_OWNER, HTTP_STATUS.BAD_REQUEST);
    }

    const member = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: { userId, groupId },
      },
    });

    if (!member) {
      throw new AppError(ERROR_MESSAGES.NOT_MEMBER, HTTP_STATUS.BAD_REQUEST);
    }

    await prisma.groupMember.delete({
      where: { id: member.id },
    });
  }

  // Approve member
  async approveMember(groupId: string, adminId: string, memberId: string) {
    await this.checkGroupAdmin(groupId, adminId);

    const member = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: { userId: memberId, groupId },
      },
    });

    if (!member) {
      throw new AppError(ERROR_MESSAGES.NOT_MEMBER, HTTP_STATUS.NOT_FOUND);
    }

    await prisma.groupMember.update({
      where: { id: member.id },
      data: { status: 'APPROVED' },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        type: 'GROUP_APPROVED',
        senderId: adminId,
        receiverId: memberId,
        referenceId: groupId,
      },
    });
  }

  // Remove member
  async removeMember(groupId: string, adminId: string, memberId: string) {
    const group = await this.checkGroupAdmin(groupId, adminId);

    if (group.ownerId === memberId) {
      throw new AppError(ERROR_MESSAGES.CANNOT_REMOVE_OWNER, HTTP_STATUS.BAD_REQUEST);
    }

    const member = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: { userId: memberId, groupId },
      },
    });

    if (!member) {
      throw new AppError(ERROR_MESSAGES.NOT_MEMBER, HTTP_STATUS.NOT_FOUND);
    }

    await prisma.groupMember.delete({
      where: { id: member.id },
    });
  }

  // Get members
  async getMembers(groupId: string, page?: string, limit?: string, status?: MemberStatus) {
    const { page: p, limit: l, skip } = parsePagination(page, limit);

    const where = {
      groupId,
      status: status || 'APPROVED',
    };

    const [members, total] = await Promise.all([
      prisma.groupMember.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
              studentId: true,
            },
          },
        },
        skip,
        take: l,
        orderBy: { joinedAt: 'desc' },
      }),
      prisma.groupMember.count({ where }),
    ]);

    const data = members.map((m) => ({
      ...m.user,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
    }));

    return paginate(data, total, p, l);
  }

  // Helper: Check if user is admin/owner
  private async checkGroupAdmin(groupId: string, userId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new AppError(ERROR_MESSAGES.GROUP_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const member = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: { userId, groupId },
      },
    });

    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    return group;
  }
}

export const groupService = new GroupService();
