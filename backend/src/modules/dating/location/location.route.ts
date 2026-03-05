import { Router } from 'express';
import { locationController } from './location.controller';
import { authenticate, validateBody, validateQuery } from '../../../middleware';
import { updateLocationSchema, nearbyQuerySchema } from './location.schema';

const router = Router();

router.use(authenticate);

// POST /dating/location – update GPS khi vào dating
router.post(
  '/',
  validateBody(updateLocationSchema),
  locationController.updateLocation,
);

// GET /dating/nearby – tìm người gần, sort theo khoảng cách
router.get(
  '/nearby',
  validateQuery(nearbyQuerySchema),
  locationController.getNearbyUsers,
);

export default router;
