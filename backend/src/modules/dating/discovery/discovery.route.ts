import { Router } from 'express';
import { discoveryController } from './discovery.controller';
import { authenticate, validateQuery } from '../../../middleware';
import { discoveryQuerySchema } from './discovery.schema';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validateQuery(discoveryQuerySchema),
<<<<<<< HEAD
  discoveryController.getCandidates.bind(discoveryController),
=======
  discoveryController.getCandidates,
>>>>>>> f9b4a30b4e403563d001bd67d7b7646e7fd223c6
);

export default router;
