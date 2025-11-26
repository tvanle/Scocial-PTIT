import { Router, Request, Response } from 'express';
import multer from 'multer';
import {
  uploadFile,
  deleteFile,
  getPresignedUploadUrl,
  getMediaType,
} from '../utils/storage';
import {
  processImage,
  processAvatar,
  processCoverPhoto,
  getImageMetadata,
  createBlurPlaceholder,
  IMAGE_SIZES,
} from '../utils/imageProcessor';

const router = Router();

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});

// Upload single file
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { buffer, originalname, mimetype, size } = req.file;
    const mediaType = getMediaType(mimetype);

    let processedBuffer = buffer;
    let metadata: any = { size };

    // Process images
    if (mediaType === 'image') {
      const processed = await processImage(buffer, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 85,
      });
      processedBuffer = processed.buffer;

      metadata = {
        ...await getImageMetadata(processedBuffer),
        blurPlaceholder: await createBlurPlaceholder(buffer),
      };
    }

    const result = await uploadFile(
      processedBuffer,
      userId,
      originalname,
      mimetype,
      processedBuffer.length
    );

    res.json({
      ...result,
      metadata,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Upload multiple files
router.post('/upload/multiple', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const results = await Promise.all(
      req.files.map(async (file) => {
        const { buffer, originalname, mimetype, size } = file;
        const mediaType = getMediaType(mimetype);

        let processedBuffer = buffer;

        if (mediaType === 'image') {
          const processed = await processImage(buffer, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 85,
          });
          processedBuffer = processed.buffer;
        }

        return uploadFile(
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
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Upload avatar
router.post('/upload/avatar', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'File must be an image' });
    }

    const { buffer, originalname, mimetype } = req.file;

    // Process avatar into multiple sizes
    const avatarSizes = await processAvatar(buffer);
    const results: Record<string, any> = {};

    for (const [sizeName, processed] of avatarSizes) {
      const result = await uploadFile(
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
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Upload cover photo
router.post('/upload/cover', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'File must be an image' });
    }

    const { buffer, originalname, mimetype } = req.file;

    // Process cover photo into multiple sizes
    const coverSizes = await processCoverPhoto(buffer);
    const results: Record<string, any> = {};

    for (const [sizeName, processed] of coverSizes) {
      const result = await uploadFile(
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
    res.status(500).json({ error: 'Failed to upload cover photo' });
  }
});

// Get pre-signed upload URL
router.post('/presigned-url', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { fileName, mimeType } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!fileName || !mimeType) {
      return res.status(400).json({ error: 'fileName and mimeType required' });
    }

    const presignedData = await getPresignedUploadUrl(userId, fileName, mimeType);

    res.json(presignedData);
  } catch (error) {
    console.error('Presigned URL error:', error);
    res.status(500).json({ error: 'Failed to generate presigned URL' });
  }
});

// Delete file
router.delete('/:key(*)', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { key } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify the key belongs to the user
    if (!key.includes(userId)) {
      return res.status(403).json({ error: 'Not authorized to delete this file' });
    }

    await deleteFile(key);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get image metadata
router.post('/metadata', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'File must be an image' });
    }

    const metadata = await getImageMetadata(req.file.buffer);
    const blurPlaceholder = await createBlurPlaceholder(req.file.buffer);

    res.json({
      ...metadata,
      blurPlaceholder,
    });
  } catch (error) {
    console.error('Metadata error:', error);
    res.status(500).json({ error: 'Failed to get metadata' });
  }
});

export default router;
