import { Router } from 'express';
import { groupController } from './group.controller';
import { authenticate, optionalAuth } from '../../middleware';

const router = Router();

// List groups (public)
router.get('/', groupController.listGroups);

// CRUD groups
router.post('/', authenticate, groupController.createGroup);
router.get('/:groupId', optionalAuth, groupController.getGroup);
router.patch('/:groupId', authenticate, groupController.updateGroup);
router.delete('/:groupId', authenticate, groupController.deleteGroup);

// Membership
router.post('/:groupId/join', authenticate, groupController.joinGroup);
router.delete('/:groupId/leave', authenticate, groupController.leaveGroup);

// Members management
router.get('/:groupId/members', groupController.getMembers);
router.post('/:groupId/members/:memberId/approve', authenticate, groupController.approveMember);
router.delete('/:groupId/members/:memberId', authenticate, groupController.removeMember);

export default router;
