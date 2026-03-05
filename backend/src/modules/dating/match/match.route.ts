import { Router } from 'express';
import { matchController } from './match.controller';
import { authenticate, validateQuery, validateParams } from '../../../middleware';
import { matchQuerySchema, matchParamsSchema } from './match.schema';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validateQuery(matchQuerySchema),
<<<<<<< HEAD
  matchController.getMatches.bind(matchController),
=======
  matchController.getMatches,
>>>>>>> f9b4a30b4e403563d001bd67d7b7646e7fd223c6
);

router.get(
  '/:id',
  validateParams(matchParamsSchema),
<<<<<<< HEAD
  matchController.getMatchDetail.bind(matchController),
=======
  matchController.getMatchDetail,
>>>>>>> f9b4a30b4e403563d001bd67d7b7646e7fd223c6
);

export default router;
