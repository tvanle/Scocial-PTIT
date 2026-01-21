import { Router } from 'express';
import { userController } from '../controllers';
import { authMiddleware, optionalAuthMiddleware, validate } from '../middleware';
import { updateProfileSchema } from '../validators';

const router = Router();

// Protected routes
router.get('/profile', authMiddleware, (req, res) => userController.getProfile(req, res));
router.put('/profile', authMiddleware, validate(updateProfileSchema), (req, res) => userController.updateProfile(req, res));
router.get('/search', authMiddleware, (req, res) => userController.searchUsers(req, res));
router.post('/avatar', authMiddleware, (req, res) => userController.updateAvatar(req, res));
router.post('/cover', authMiddleware, (req, res) => userController.updateCover(req, res));
router.get('/suggestions', authMiddleware, (req, res) => userController.getSuggestions(req, res));

// Get user by ID (optional auth for relationship status)
router.get('/:id', optionalAuthMiddleware, (req, res) => userController.getUserById(req, res));

export default router;
