import { Router } from 'express';
import userRoutes from './user.routes';
import friendRoutes from './friend.routes';

const router = Router();

router.use('/users', userRoutes);
router.use('/users', friendRoutes);

export default router;
