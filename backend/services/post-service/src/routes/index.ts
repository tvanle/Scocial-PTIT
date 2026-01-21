import { Router } from 'express';
import postRoutes from './post.routes';
import commentRoutes from './comment.routes';

const router = Router();

router.use('/posts', postRoutes);
router.use('/posts', commentRoutes);

export default router;
