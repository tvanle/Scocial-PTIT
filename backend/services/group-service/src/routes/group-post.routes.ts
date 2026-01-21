import { Router } from 'express';
import { groupPostController } from '../controllers';
import { requireAuth, optionalAuth, asyncHandler } from '../middleware';
import { validateBody, validateQuery } from '../middleware';
import { createPostSchema, createCommentSchema, paginationSchema } from '../validators';

const router = Router();

// Get group posts - Public with optional auth
router.get(
  '/:groupId/posts',
  optionalAuth,
  validateQuery(paginationSchema),
  asyncHandler(groupPostController.getPosts.bind(groupPostController))
);

// Create post in group - Requires auth
router.post(
  '/:groupId/posts',
  requireAuth,
  validateBody(createPostSchema),
  asyncHandler(groupPostController.createPost.bind(groupPostController))
);

// Delete post - Requires auth
router.delete(
  '/:groupId/posts/:postId',
  requireAuth,
  asyncHandler(groupPostController.deletePost.bind(groupPostController))
);

// Like post - Requires auth
router.post(
  '/:groupId/posts/:postId/like',
  requireAuth,
  asyncHandler(groupPostController.likePost.bind(groupPostController))
);

// Unlike post - Requires auth
router.post(
  '/:groupId/posts/:postId/unlike',
  requireAuth,
  asyncHandler(groupPostController.unlikePost.bind(groupPostController))
);

// Pin/Unpin post - Requires auth
router.post(
  '/:groupId/posts/:postId/pin',
  requireAuth,
  asyncHandler(groupPostController.togglePin.bind(groupPostController))
);

// Get post comments - Public with optional auth
router.get(
  '/:groupId/posts/:postId/comments',
  optionalAuth,
  validateQuery(paginationSchema),
  asyncHandler(groupPostController.getComments.bind(groupPostController))
);

// Add comment - Requires auth
router.post(
  '/:groupId/posts/:postId/comments',
  requireAuth,
  validateBody(createCommentSchema),
  asyncHandler(groupPostController.createComment.bind(groupPostController))
);

export default router;
