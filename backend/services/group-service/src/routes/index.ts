import { Router } from 'express';
import groupRoutes from './group.routes';
import groupPostRoutes from './group-post.routes';

const router = Router();

// Mount routes
router.use('/', groupRoutes);
router.use('/', groupPostRoutes);

export default router;
