import { Router } from 'express';
import { profileRoutes } from './profile';
import { discoveryRoutes } from './discovery';
import { swipeRoutes } from './swipe';
import { matchRoutes } from './match';

const router = Router();

// Submodules
router.use('/profile', profileRoutes);
router.use('/discovery', discoveryRoutes);
router.use('/swipe', swipeRoutes);
router.use('/matches', matchRoutes);

export default router;
