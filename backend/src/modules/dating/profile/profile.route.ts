import { Router } from 'express';
import { profileController } from './profile.controller';
import { authenticate, validateBody, validateParams } from '../../../middleware';
import {
  createDatingProfileSchema,
  updateDatingProfileSchema,
  addPhotoSchema,
  updatePromptsSchema,
  updateLifestyleSchema,
  updatePreferencesSchema,
  photoIdParamSchema,
  userIdParamSchema,
} from './profile.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Profile routes
router.post('/', validateBody(createDatingProfileSchema), profileController.createProfile);
router.put('/', validateBody(updateDatingProfileSchema), profileController.updateProfile);
router.get('/me', profileController.getMyProfile);
router.get('/:userId', validateParams(userIdParamSchema), profileController.getProfileByUserId);

// Photo routes
router.post('/photos', validateBody(addPhotoSchema), profileController.addPhoto);
router.delete('/photos/:id', validateParams(photoIdParamSchema), profileController.deletePhoto);

// Prompts, Lifestyle, Preferences routes
router.put('/prompts', validateBody(updatePromptsSchema), profileController.updatePrompts);
router.put('/lifestyle', validateBody(updateLifestyleSchema), profileController.updateLifestyle);
router.put('/preferences', validateBody(updatePreferencesSchema), profileController.updatePreferences);

export default router;
