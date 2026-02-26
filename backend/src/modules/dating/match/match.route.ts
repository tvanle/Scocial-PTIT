import { Router } from 'express';
import { matchController } from './match.controller';
import { authenticate, validateQuery, validateParams } from '../../../middleware';
import { matchQuerySchema, matchParamsSchema } from './match.schema';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validateQuery(matchQuerySchema),
  matchController.getMatches,
);

router.get(
  '/:id',
  validateParams(matchParamsSchema),
  matchController.getMatchDetail,
);

export default router;
