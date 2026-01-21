import { Router } from 'express';
import { commentController } from '../controllers';
import { authMiddleware, optionalAuthMiddleware, validate } from '../middleware';
import { createCommentSchema } from '../validators';

const router = Router();

// Get comments (optional auth for viewing)
router.get('/:postId/comments', optionalAuthMiddleware, (req, res) => commentController.getComments(req, res));

// Get comment replies (optional auth for viewing)
router.get('/:postId/comments/:commentId/replies', optionalAuthMiddleware, (req, res) => commentController.getReplies(req, res));

// Add comment (requires auth)
router.post('/:postId/comments', authMiddleware, validate(createCommentSchema), (req, res) => commentController.addComment(req, res));

// Delete comment (requires auth)
router.delete('/:postId/comments/:commentId', authMiddleware, (req, res) => commentController.deleteComment(req, res));

// Like/unlike comment (requires auth)
router.post('/:postId/comments/:commentId/like', authMiddleware, (req, res) => commentController.likeComment(req, res));
router.post('/:postId/comments/:commentId/unlike', authMiddleware, (req, res) => commentController.unlikeComment(req, res));

export default router;
