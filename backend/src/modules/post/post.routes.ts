import { Router } from 'express';
import { postController } from './post.controller';
import { authenticate, optionalAuth, validateBody } from '../../middleware';
import { createPostSchema, updatePostSchema, createCommentSchema } from './post.validator';

const router = Router();

// Feed (protected)
router.get('/feed', authenticate, postController.getFeed);

// User posts (optional auth)
router.get('/user/:userId', optionalAuth, postController.getUserPosts);

// User shared posts (optional auth)
router.get('/user/:userId/shares', optionalAuth, postController.getSharedPosts);

// User replies/comments (optional auth)
router.get('/user/:userId/replies', optionalAuth, postController.getUserReplies);

// CRUD posts
router.post('/', authenticate, validateBody(createPostSchema), postController.createPost);
router.get('/:postId', optionalAuth, postController.getPost);
router.patch('/:postId', authenticate, validateBody(updatePostSchema), postController.updatePost);
router.delete('/:postId', authenticate, postController.deletePost);

// Likes
router.post('/:postId/like', authenticate, postController.likePost);
router.delete('/:postId/like', authenticate, postController.unlikePost);

// Poll votes
router.post('/:postId/vote', authenticate, postController.votePoll);
router.delete('/:postId/vote', authenticate, postController.unvotePoll);

// Shares (repost)
router.post('/:postId/share', authenticate, postController.sharePost);
router.delete('/:postId/share', authenticate, postController.unsharePost);

// Comments
router.get('/:postId/comments', optionalAuth, postController.getComments);
router.post('/:postId/comments', authenticate, validateBody(createCommentSchema), postController.createComment);
router.delete('/comments/:commentId', authenticate, postController.deleteComment);

// Comment replies
router.get('/comments/:commentId/replies', optionalAuth, postController.getCommentReplies);

// Comment likes
router.post('/comments/:commentId/like', authenticate, postController.likeComment);
router.delete('/comments/:commentId/like', authenticate, postController.unlikeComment);

// Comment shares (repost comment)
router.post('/comments/:commentId/share', authenticate, postController.shareComment);
router.delete('/comments/:commentId/share', authenticate, postController.unshareComment);

// User shared comments
router.get('/user/:userId/comment-shares', optionalAuth, postController.getSharedComments);

export default router;
