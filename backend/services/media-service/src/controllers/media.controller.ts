import { Response } from 'express';
import { storageService, imageService } from '../services';
import { AuthenticatedRequest } from '../types';
import { ERROR_MESSAGES } from '../constants';

class MediaController {
  // Upload single file
  async uploadSingle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { buffer, originalname, mimetype, size } = req.file!;
      const mediaType = storageService.getMediaType(mimetype);

      let processedBuffer = buffer;
      let metadata: Record<string, any> = { size };

      // Process images
      if (mediaType === 'image') {
        const processed = await imageService.processImage(buffer);
        processedBuffer = processed.buffer;

        metadata = {
          ...(await imageService.getImageMetadata(processedBuffer)),
          blurPlaceholder: await imageService.createBlurPlaceholder(buffer),
        };
      }

      const result = await storageService.uploadFile(
        processedBuffer,
        userId,
        originalname,
        mimetype,
        processedBuffer.length
      );

      res.json({ ...result, metadata });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.UPLOAD_FAILED });
    }
  }

  // Upload multiple files
  async uploadMultiple(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const files = req.files as Express.Multer.File[];

      const results = await Promise.all(
        files.map(async (file) => {
          const { buffer, originalname, mimetype } = file;
          const mediaType = storageService.getMediaType(mimetype);

          let processedBuffer = buffer;

          if (mediaType === 'image') {
            const processed = await imageService.processImage(buffer);
            processedBuffer = processed.buffer;
          }

          return storageService.uploadFile(
            processedBuffer,
            userId,
            originalname,
            mimetype,
            processedBuffer.length
          );
        })
      );

      res.json(results);
    } catch (error) {
      console.error('Multiple upload error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.UPLOAD_FAILED });
    }
  }

  // Upload avatar
  async uploadAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { buffer, originalname } = req.file!;

      const avatarSizes = await imageService.processAvatar(buffer);
      const results: Record<string, any> = {};

      for (const [sizeName, processed] of avatarSizes) {
        const result = await storageService.uploadFile(
          processed.buffer,
          userId,
          `avatar_${sizeName}_${originalname}`,
          'image/jpeg',
          processed.size
        );
        results[sizeName] = result;
      }

      res.json({
        avatars: results,
        default: results.medium?.url || results.large?.url,
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.UPLOAD_FAILED });
    }
  }

  // Upload cover photo
  async uploadCover(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { buffer, originalname } = req.file!;

      const coverSizes = await imageService.processCoverPhoto(buffer);
      const results: Record<string, any> = {};

      for (const [sizeName, processed] of coverSizes) {
        const result = await storageService.uploadFile(
          processed.buffer,
          userId,
          `cover_${sizeName}_${originalname}`,
          'image/jpeg',
          processed.size
        );
        results[sizeName] = result;
      }

      res.json({
        covers: results,
        default: results.large?.url || results.medium?.url,
      });
    } catch (error) {
      console.error('Cover upload error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.UPLOAD_FAILED });
    }
  }

  // Get presigned URL
  async getPresignedUrl(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { fileName, mimeType } = req.body;

      const presignedData = await storageService.getPresignedUploadUrl(userId, fileName, mimeType);
      res.json(presignedData);
    } catch (error) {
      console.error('Presigned URL error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.PRESIGNED_URL_FAILED });
    }
  }

  // Delete file
  async deleteFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { key } = req.params;

      await storageService.deleteFile(key);
      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.DELETE_FAILED });
    }
  }

  // Get image metadata
  async getMetadata(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const metadata = await imageService.getImageMetadata(req.file!.buffer);
      const blurPlaceholder = await imageService.createBlurPlaceholder(req.file!.buffer);

      res.json({ ...metadata, blurPlaceholder });
    } catch (error) {
      console.error('Metadata error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.METADATA_FAILED });
    }
  }
}

export const mediaController = new MediaController();
