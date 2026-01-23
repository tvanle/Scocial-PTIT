import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate, optionalAuth, validateBody } from '../../middleware';
import { updateProfileSchema } from './user.validator';

const router = Router();

// Search users (public)
router.get('/search', userController.searchUsers);

// Get user profile (optional auth for isFollowing check)
router.get('/:userId', optionalAuth, userController.getProfile);

// Update profile (protected)
router.patch('/profile', authenticate, validateBody(updateProfileSchema), userController.updateProfile);

// Follow system (protected)
router.post('/:userId/follow', authenticate, userController.followUser);
router.delete('/:userId/follow', authenticate, userController.unfollowUser);

// Get followers/following (public)
router.get('/:userId/followers', userController.getFollowers);
router.get('/:userId/following', userController.getFollowing);

export default router;
