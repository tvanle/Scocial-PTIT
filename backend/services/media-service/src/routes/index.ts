import { Router } from 'express';
import mediaRoutes from './media.routes';

const router = Router();

router.use('/media', mediaRoutes);

export default router;
