import { Router } from 'express';
import { groupController } from '../controllers';
import { requireAuth, optionalAuth, asyncHandler } from '../middleware';
import { validateBody, validateQuery } from '../middleware';
import {
  createGroupSchema,
  updateGroupSchema,
  joinGroupSchema,
  handleJoinRequestSchema,
  updateMemberRoleSchema,
  groupFiltersSchema,
  memberFiltersSchema,
  paginationSchema,
} from '../validators';

const router = Router();

// Get groups (discover) - Public with optional auth
router.get(
  '/',
  optionalAuth,
  validateQuery(groupFiltersSchema),
  asyncHandler(groupController.getGroups.bind(groupController))
);

// Get user's groups - Requires auth
router.get(
  '/my-groups',
  requireAuth,
  asyncHandler(groupController.getUserGroups.bind(groupController))
);

// Create group - Requires auth
router.post(
  '/',
  requireAuth,
  validateBody(createGroupSchema),
  asyncHandler(groupController.createGroup.bind(groupController))
);

// Get group by ID - Public with optional auth
router.get(
  '/:id',
  optionalAuth,
  asyncHandler(groupController.getGroupById.bind(groupController))
);

// Update group - Requires auth
router.put(
  '/:id',
  requireAuth,
  validateBody(updateGroupSchema),
  asyncHandler(groupController.updateGroup.bind(groupController))
);

// Delete group - Requires auth
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(groupController.deleteGroup.bind(groupController))
);

// Join group - Requires auth
router.post(
  '/:id/join',
  requireAuth,
  validateBody(joinGroupSchema),
  asyncHandler(groupController.joinGroup.bind(groupController))
);

// Leave group - Requires auth
router.post(
  '/:id/leave',
  requireAuth,
  asyncHandler(groupController.leaveGroup.bind(groupController))
);

// Get group members
router.get(
  '/:id/members',
  validateQuery(memberFiltersSchema),
  asyncHandler(groupController.getMembers.bind(groupController))
);

// Remove member - Requires auth
router.delete(
  '/:id/members/:memberId',
  requireAuth,
  asyncHandler(groupController.removeMember.bind(groupController))
);

// Update member role - Requires auth
router.put(
  '/:id/members/:memberId/role',
  requireAuth,
  validateBody(updateMemberRoleSchema),
  asyncHandler(groupController.updateMemberRole.bind(groupController))
);

// Get join requests - Requires auth
router.get(
  '/:id/join-requests',
  requireAuth,
  asyncHandler(groupController.getJoinRequests.bind(groupController))
);

// Handle join request - Requires auth
router.post(
  '/:id/join-requests/:requestId',
  requireAuth,
  validateBody(handleJoinRequestSchema),
  asyncHandler(groupController.handleJoinRequest.bind(groupController))
);

export default router;
