import { Router } from 'express';
import { friendController } from '../controllers';
import { authMiddleware } from '../middleware';

const router = Router();

// Friends management
router.get('/friends', authMiddleware, (req, res) => friendController.getFriends(req, res));
router.get('/friend-requests', authMiddleware, (req, res) => friendController.getFriendRequests(req, res));
router.get('/blocked', authMiddleware, (req, res) => friendController.getBlockedUsers(req, res));

// User actions (by ID)
router.post('/:id/friend-request', authMiddleware, (req, res) => friendController.sendFriendRequest(req, res));
router.post('/:id/friend-request/accept', authMiddleware, (req, res) => friendController.acceptFriendRequest(req, res));
router.post('/:id/friend-request/reject', authMiddleware, (req, res) => friendController.rejectFriendRequest(req, res));
router.post('/:id/unfriend', authMiddleware, (req, res) => friendController.unfriend(req, res));
router.post('/:id/follow', authMiddleware, (req, res) => friendController.follow(req, res));
router.post('/:id/unfollow', authMiddleware, (req, res) => friendController.unfollow(req, res));
router.get('/:id/followers', (req, res) => friendController.getFollowers(req, res));
router.get('/:id/following', (req, res) => friendController.getFollowing(req, res));
router.post('/:id/block', authMiddleware, (req, res) => friendController.blockUser(req, res));
router.post('/:id/unblock', authMiddleware, (req, res) => friendController.unblockUser(req, res));

export default router;
