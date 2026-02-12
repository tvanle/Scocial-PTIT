import { Router } from 'express';
import { discoveryController } from './discovery.controller';
import { authenticate, validateQuery } from '../../../middleware';
import { discoveryQuerySchema } from './discovery.schema';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validateQuery(discoveryQuerySchema),
  discoveryController.getCandidates.bind(discoveryController),
);

export default router;
