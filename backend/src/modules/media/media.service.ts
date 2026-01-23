import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/database';
import { config } from '../../config';
import { AppError } from '../../middleware';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../shared/constants';
import { MediaType } from '@prisma/client';

export class MediaService {
  private getMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    if (mimeType.startsWith('audio/')) return 'AUDIO';
    return 'DOCUMENT';
  }

  async uploadFile(file: Express.Multer.File, postId?: string) {
    const filename = `${uuidv4()}${path.extname(file.originalname)}`;
    const uploadPath = path.join(config.upload.dir, filename);

    // Ensure upload directory exists
    await fs.mkdir(config.upload.dir, { recursive: true });

    let width: number | undefined;
    let height: number | undefined;

    // Process image with sharp
    if (file.mimetype.startsWith('image/')) {
      const image = sharp(file.buffer);
      const metadata = await image.metadata();
      width = metadata.width;
      height = metadata.height;

      // Resize if too large and save
      await image
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(uploadPath);
    } else {
      // Save other file types directly
      await fs.writeFile(uploadPath, file.buffer);
    }

    // Save to database
    const media = await prisma.media.create({
      data: {
        url: `/uploads/${filename}`,
        type: this.getMediaType(file.mimetype),
        filename,
        mimeType: file.mimetype,
        size: file.size,
        width,
        height,
        postId,
      },
    });

    return media;
  }

  async uploadMultiple(files: Express.Multer.File[], postId?: string) {
    const uploadPromises = files.map((file) => this.uploadFile(file, postId));
    return Promise.all(uploadPromises);
  }

  async deleteMedia(mediaId: string, userId: string) {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        post: {
          select: { authorId: true },
        },
      },
    });

    if (!media) {
      throw new AppError(ERROR_MESSAGES.FILE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Check ownership
    if (media.post && media.post.authorId !== userId) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    // Delete file from disk
    const filePath = path.join(config.upload.dir, media.filename);
    try {
      await fs.unlink(filePath);
    } catch {
      // File might not exist, continue
    }

    // Delete from database
    await prisma.media.delete({
      where: { id: mediaId },
    });
  }

  async getMedia(mediaId: string) {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new AppError(ERROR_MESSAGES.FILE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return media;
  }
}

export const mediaService = new MediaService();
