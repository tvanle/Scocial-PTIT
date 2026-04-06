import { Router } from 'express';
import { profileRoutes } from './profile';
import { discoveryRoutes } from './discovery';
import { swipeRoutes } from './swipe';
import { matchRoutes } from './match';
import { locationRoutes } from './location';
import { datingChatRoutes } from './chat';
import { paymentRoutes } from './payment';

const router = Router();

router.use('/profile', profileRoutes);
router.use('/discovery', discoveryRoutes);
router.use('/swipe', swipeRoutes);
router.use('/matches', matchRoutes);
router.use('/location', locationRoutes);
router.use('/chat', datingChatRoutes);
router.use('/payment', paymentRoutes);

export default router;
