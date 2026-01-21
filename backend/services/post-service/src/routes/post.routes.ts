import { Router } from 'express';
import { postController } from '../controllers';
import { authMiddleware, validate } from '../middleware';
import {
  createPostSchema,
  updatePostSchema,
  sharePostSchema,
  reportPostSchema
} from '../validators';

const router = Router();

// All routes require authentication
router.get('/feed', authMiddleware, (req, res) => postController.getFeed(req, res));
router.get('/saved', authMiddleware, (req, res) => postController.getSavedPosts(req, res));
router.get('/user/:userId', authMiddleware, (req, res) => postController.getUserPosts(req, res));
router.get('/:id', authMiddleware, (req, res) => postController.getPostById(req, res));

router.post('/', authMiddleware, validate(createPostSchema), (req, res) => postController.createPost(req, res));

router.put('/:id', authMiddleware, validate(updatePostSchema), (req, res) => postController.updatePost(req, res));

router.delete('/:id', authMiddleware, (req, res) => postController.deletePost(req, res));

// Post actions
router.post('/:id/like', authMiddleware, (req, res) => postController.likePost(req, res));
router.post('/:id/unlike', authMiddleware, (req, res) => postController.unlikePost(req, res));
router.post('/:id/share', authMiddleware, validate(sharePostSchema), (req, res) => postController.sharePost(req, res));
router.post('/:id/save', authMiddleware, (req, res) => postController.savePost(req, res));
router.post('/:id/unsave', authMiddleware, (req, res) => postController.unsavePost(req, res));
router.post('/:id/report', authMiddleware, validate(reportPostSchema), (req, res) => postController.reportPost(req, res));

export default router;
