import { Router } from 'express';
import { mediaController } from '../controllers';
import { authMiddleware, uploadSingle, uploadMultiple } from '../middleware';
import {
  validateFileExists,
  validateFilesExist,
  validateImageFile,
  validatePresignedUrlParams,
  validateDeletePermission,
} from '../validators';

const router = Router();

// Upload single file
router.post(
  '/upload',
  authMiddleware,
  uploadSingle,
  validateFileExists,
  (req, res) => mediaController.uploadSingle(req, res)
);

// Upload multiple files
router.post(
  '/upload/multiple',
  authMiddleware,
  uploadMultiple,
  validateFilesExist,
  (req, res) => mediaController.uploadMultiple(req, res)
);

// Upload avatar
router.post(
  '/upload/avatar',
  authMiddleware,
  uploadSingle,
  validateImageFile,
  (req, res) => mediaController.uploadAvatar(req, res)
);

// Upload cover photo
router.post(
  '/upload/cover',
  authMiddleware,
  uploadSingle,
  validateImageFile,
  (req, res) => mediaController.uploadCover(req, res)
);

// Get presigned URL
router.post(
  '/presigned-url',
  authMiddleware,
  validatePresignedUrlParams,
  (req, res) => mediaController.getPresignedUrl(req, res)
);

// Delete file
router.delete(
  '/:key(*)',
  authMiddleware,
  validateDeletePermission,
  (req, res) => mediaController.deleteFile(req, res)
);

// Get image metadata
router.post(
  '/metadata',
  uploadSingle,
  validateImageFile,
  (req, res) => mediaController.getMetadata(req, res)
);

export default router;
