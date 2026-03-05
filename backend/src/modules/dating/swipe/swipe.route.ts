import { Router } from 'express';
import { swipeController } from './swipe.controller';
<<<<<<< HEAD
import { authenticate, validate } from '../../../middleware';
=======
import { authenticate, validateBody } from '../../../middleware';
>>>>>>> f9b4a30b4e403563d001bd67d7b7646e7fd223c6
import { swipeSchema } from './swipe.schema';

const router = Router();

router.use(authenticate);

router.post(
  '/',
<<<<<<< HEAD
  validate(swipeSchema),
  swipeController.swipe.bind(swipeController),
=======
  validateBody(swipeSchema),
  swipeController.swipe,
>>>>>>> f9b4a30b4e403563d001bd67d7b7646e7fd223c6
);

export default router;
