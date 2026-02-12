import { Router } from 'express';
import { swipeController } from './swipe.controller';
import { authenticate, validate } from '../../../middleware';
import { swipeSchema } from './swipe.schema';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate(swipeSchema),
  swipeController.swipe.bind(swipeController),
);

export default router;
