import { Router } from 'express';
import { mediaController } from './media.controller';
import { authenticate, uploadSingle, uploadMultiple } from '../../middleware';

const router = Router();

router.post('/upload', authenticate, uploadSingle, mediaController.uploadSingle);
router.post('/upload/multiple', authenticate, uploadMultiple, mediaController.uploadMultiple);
router.get('/:mediaId', mediaController.getMedia);
router.delete('/:mediaId', authenticate, mediaController.deleteMedia);

export default router;
