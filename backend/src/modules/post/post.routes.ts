import { Router } from 'express';
import { postController } from './post.controller';
import { authenticate, optionalAuth, validateBody } from '../../middleware';
import { createPostSchema, updatePostSchema, createCommentSchema } from './post.validator';

const router = Router();

// Feed (protected)
router.get('/feed', authenticate, postController.getFeed);

// User posts (optional auth)
router.get('/user/:userId', optionalAuth, postController.getUserPosts);

// CRUD posts
router.post('/', authenticate, validateBody(createPostSchema), postController.createPost);
router.get('/:postId', optionalAuth, postController.getPost);
router.patch('/:postId', authenticate, validateBody(updatePostSchema), postController.updatePost);
router.delete('/:postId', authenticate, postController.deletePost);

// Likes
router.post('/:postId/like', authenticate, postController.likePost);
router.delete('/:postId/like', authenticate, postController.unlikePost);

// Comments
router.get('/:postId/comments', postController.getComments);
router.post('/:postId/comments', authenticate, validateBody(createCommentSchema), postController.createComment);
router.delete('/comments/:commentId', authenticate, postController.deleteComment);

export default router;
