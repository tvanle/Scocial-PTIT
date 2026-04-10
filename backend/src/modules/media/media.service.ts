import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/database';
import { config } from '../../config';
import { AppError } from '../../middleware';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../shared/constants';
import { MediaType } from '@prisma/client';
import { uploadToStorage, deleteFromStorage, parseStorageUrl } from '../../services/storage.service';

export class MediaService {
  private getMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    if (mimeType.startsWith('audio/')) return 'AUDIO';
    return 'DOCUMENT';
  }

  async uploadFile(file: Express.Multer.File, postId?: string) {
    const bucket = config.minio.buckets.posts;
    const isImage = file.mimetype.startsWith('image/');

    let width: number | undefined;
    let height: number | undefined;
    let buffer = file.buffer;
    let mimeType = file.mimetype;
    let filename: string;

    if (isImage) {
      const image = sharp(file.buffer);
      const metadata = await image.metadata();
      width = metadata.width;
      height = metadata.height;

      buffer = await image
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      filename = `${uuidv4()}.jpg`;
      mimeType = 'image/jpeg';
    } else {
      filename = `${uuidv4()}${path.extname(file.originalname)}`;
    }

    const url = await uploadToStorage(bucket, filename, buffer, mimeType);

    const media = await prisma.media.create({
      data: {
        url,
        type: this.getMediaType(file.mimetype),
        filename,
        mimeType,
        size: buffer.length,
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

    // Delete file from MinIO
    const parsed = parseStorageUrl(media.url);
    if (parsed) {
      try {
        await deleteFromStorage(parsed.bucket, parsed.key);
      } catch (err) {
        console.warn('Failed to delete storage object:', parsed, err);
      }
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
