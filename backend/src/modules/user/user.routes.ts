import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate, optionalAuth, validateBody } from '../../middleware';
import { updateProfileSchema } from './user.validator';
import { uploadMemory } from '../../middleware/upload.middleware';

const router = Router();

// Search users (public)
router.get('/search', userController.searchUsers);

// Update profile (protected) - must be before /:userId to avoid conflict
router.patch('/profile', authenticate, validateBody(updateProfileSchema), userController.updateProfile);

// Avatar & cover upload (protected)
router.post('/avatar', authenticate, uploadMemory.single('avatar'), userController.uploadAvatar);
router.post('/cover', authenticate, uploadMemory.single('cover'), userController.uploadCover);

// Get user profile (optional auth for isFollowing check)
router.get('/:userId', optionalAuth, userController.getProfile);

// Follow system (protected)
router.post('/:userId/follow', authenticate, userController.followUser);
router.delete('/:userId/follow', authenticate, userController.unfollowUser);

// Get followers/following (public)
router.get('/:userId/followers', userController.getFollowers);
router.get('/:userId/following', userController.getFollowing);

export default router;
