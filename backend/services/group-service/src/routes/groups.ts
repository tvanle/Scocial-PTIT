import { Router, Request, Response } from 'express';
import { PrismaClient, GroupPrivacy, MemberRole } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const createGroupSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  privacy: z.enum(['PUBLIC', 'PRIVATE', 'SECRET']).default('PUBLIC'),
  rules: z.string().max(2000).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Get groups (discover)
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { page = '1', limit = '20', search, category } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {
      privacy: { not: 'SECRET' },
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where,
        skip,
        take,
        orderBy: { membersCount: 'desc' },
      }),
      prisma.group.count({ where }),
    ]);

    // Check if user is member of each group
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

    res.json({
      data: groupsWithMembership,
      meta: {
        total,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take),
        hasNext: skip + take < total,
        hasPrev: parseInt(page as string) > 1,
      },
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Failed to get groups' });
  }
});

// Get user's groups
router.get('/my-groups', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: { group: true },
      orderBy: { joinedAt: 'desc' },
    });

    res.json(
      memberships.map((m) => ({
        ...m.group,
        memberRole: m.role,
        joinedAt: m.joinedAt,
      }))
    );
  } catch (error) {
    console.error('Get my groups error:', error);
    res.status(500).json({ error: 'Failed to get groups' });
  }
});

// Create group
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = createGroupSchema.parse(req.body);

    const group = await prisma.$transaction(async (tx) => {
      const newGroup = await tx.group.create({
        data: {
          ...data,
          membersCount: 1,
        },
      });

      // Add creator as owner
      await tx.groupMember.create({
        data: {
          groupId: newGroup.id,
          userId,
          role: 'OWNER',
        },
      });

      return newGroup;
    });

    res.status(201).json(group);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Get group by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;

    const group = await prisma.group.findUnique({
      where: { id },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user can view this group
    if (group.privacy === 'SECRET') {
      const membership = userId
        ? await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId: id, userId } },
          })
        : null;

      if (!membership) {
        return res.status(404).json({ error: 'Group not found' });
      }
    }

    // Get user's membership
    const membership = userId
      ? await prisma.groupMember.findUnique({
          where: { groupId_userId: { groupId: id, userId } },
        })
      : null;

    // Get admins and moderators
    const staff = await prisma.groupMember.findMany({
      where: {
        groupId: id,
        role: { in: ['OWNER', 'ADMIN', 'MODERATOR'] },
      },
    });

    res.json({
      ...group,
      isMember: !!membership,
      memberRole: membership?.role,
      staff,
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Failed to get group' });
  }
});

// Update group
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin/owner
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const group = await prisma.group.update({
      where: { id },
      data: req.body,
    });

    res.json(group);
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// Delete group
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is owner
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });

    if (!membership || membership.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only owner can delete group' });
    }

    await prisma.group.delete({ where: { id } });

    res.json({ message: 'Group deleted' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// Join group
router.post('/:id/join', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;
    const { message } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if already member
    const existingMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'Already a member' });
    }

    // If requires approval, create join request
    if (group.requireApproval || group.privacy === 'PRIVATE') {
      const existingRequest = await prisma.groupJoinRequest.findFirst({
        where: { groupId: id, userId, status: 'PENDING' },
      });

      if (existingRequest) {
        return res.status(400).json({ error: 'Join request already pending' });
      }

      await prisma.groupJoinRequest.create({
        data: { groupId: id, userId, message },
      });

      return res.json({ message: 'Join request sent' });
    }

    // Direct join
    await prisma.$transaction([
      prisma.groupMember.create({
        data: { groupId: id, userId },
      }),
      prisma.group.update({
        where: { id },
        data: { membersCount: { increment: 1 } },
      }),
    ]);

    res.json({ message: 'Joined group' });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// Leave group
router.post('/:id/leave', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });

    if (!membership) {
      return res.status(400).json({ error: 'Not a member' });
    }

    if (membership.role === 'OWNER') {
      return res.status(400).json({ error: 'Owner cannot leave. Transfer ownership or delete group.' });
    }

    await prisma.$transaction([
      prisma.groupMember.delete({
        where: { groupId_userId: { groupId: id, userId } },
      }),
      prisma.group.update({
        where: { id },
        data: { membersCount: { decrement: 1 } },
      }),
    ]);

    res.json({ message: 'Left group' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ error: 'Failed to leave group' });
  }
});

// Get group members
router.get('/:id/members', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20', role } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { groupId: id };
    if (role) {
      where.role = role;
    }

    const [members, total] = await Promise.all([
      prisma.groupMember.findMany({
        where,
        skip,
        take,
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      }),
      prisma.groupMember.count({ where }),
    ]);

    res.json({
      data: members,
      meta: {
        total,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take),
        hasNext: skip + take < total,
        hasPrev: parseInt(page as string) > 1,
      },
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to get members' });
  }
});

// Remove member
router.delete('/:id/members/:memberId', async (req: Request, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if requester is admin/owner
    const requesterMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });

    if (!requesterMembership || !['OWNER', 'ADMIN', 'MODERATOR'].includes(requesterMembership.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const targetMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: memberId } },
    });

    if (!targetMembership) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Can't remove owner
    if (targetMembership.role === 'OWNER') {
      return res.status(403).json({ error: 'Cannot remove owner' });
    }

    // Admins can't remove other admins
    if (targetMembership.role === 'ADMIN' && requesterMembership.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only owner can remove admins' });
    }

    await prisma.$transaction([
      prisma.groupMember.delete({
        where: { groupId_userId: { groupId: id, userId: memberId } },
      }),
      prisma.group.update({
        where: { id },
        data: { membersCount: { decrement: 1 } },
      }),
    ]);

    res.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Update member role
router.put('/:id/members/:memberId/role', async (req: Request, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.headers['x-user-id'] as string;
    const { role } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only owner can change roles
    const requesterMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });

    if (!requesterMembership || requesterMembership.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only owner can change roles' });
    }

    if (role === 'OWNER') {
      // Transfer ownership
      await prisma.$transaction([
        prisma.groupMember.update({
          where: { groupId_userId: { groupId: id, userId } },
          data: { role: 'ADMIN' },
        }),
        prisma.groupMember.update({
          where: { groupId_userId: { groupId: id, userId: memberId } },
          data: { role: 'OWNER' },
        }),
      ]);
    } else {
      await prisma.groupMember.update({
        where: { groupId_userId: { groupId: id, userId: memberId } },
        data: { role },
      });
    }

    res.json({ message: 'Role updated' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Get join requests
router.get('/:id/join-requests', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin/moderator
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });

    if (!membership || !['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const requests = await prisma.groupJoinRequest.findMany({
      where: { groupId: id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    res.json(requests);
  } catch (error) {
    console.error('Get join requests error:', error);
    res.status(500).json({ error: 'Failed to get join requests' });
  }
});

// Handle join request
router.post('/:id/join-requests/:requestId', async (req: Request, res: Response) => {
  try {
    const { id, requestId } = req.params;
    const userId = req.headers['x-user-id'] as string;
    const { action } = req.body; // 'approve' or 'reject'

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin/moderator
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });

    if (!membership || !['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const request = await prisma.groupJoinRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.groupId !== id) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (action === 'approve') {
      await prisma.$transaction([
        prisma.groupJoinRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED', reviewedBy: userId, reviewedAt: new Date() },
        }),
        prisma.groupMember.create({
          data: { groupId: id, userId: request.userId },
        }),
        prisma.group.update({
          where: { id },
          data: { membersCount: { increment: 1 } },
        }),
      ]);
    } else {
      await prisma.groupJoinRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED', reviewedBy: userId, reviewedAt: new Date() },
      });
    }

    res.json({ message: action === 'approve' ? 'Request approved' : 'Request rejected' });
  } catch (error) {
    console.error('Handle join request error:', error);
    res.status(500).json({ error: 'Failed to handle request' });
  }
});

export default router;
