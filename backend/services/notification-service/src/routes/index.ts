import { Router } from 'express';
import notificationRoutes from './notification.routes';

const router = Router();

// Mount notification routes
router.use('/notifications', notificationRoutes);

export default router;
