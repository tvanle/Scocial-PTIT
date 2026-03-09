import { Router } from 'express';
import { swipeController } from './swipe.controller';
import { authenticate, validateBody } from '../../../middleware';
import { swipeSchema } from './swipe.schema';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validateBody(swipeSchema),
  swipeController.swipe,
);

router.get(
  '/likes/incoming',
  swipeController.getIncomingLikes,
);

router.get(
  '/likes/sent',
  swipeController.getSentLikes,
);

export default router;
