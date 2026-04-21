import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { userService } from './user.service';
import { AuthRequest } from '../../shared/types';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../shared/constants';
import { sendSuccess } from '../../shared/utils';
import { config } from '../../config';
import { uploadToStorage, deleteFromStorage, parseStorageUrl } from '../../services/storage.service';
import { prisma } from '../../config/database';

export class UserController {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const currentUserId = req.user?.userId;
      const user = await userService.getProfile(userId, currentUserId);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateProfile(req.user!.userId, req.body);
      sendSuccess(res, user, SUCCESS_MESSAGES.PROFILE_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, page, limit } = req.query;
      const result = await userService.searchUsers(
        q as string,
        page as string,
        limit as string
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async followUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      await userService.followUser(req.user!.userId, userId);
      sendSuccess(res, null, SUCCESS_MESSAGES.FOLLOW_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async unfollowUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      await userService.unfollowUser(req.user!.userId, userId);
      sendSuccess(res, null, SUCCESS_MESSAGES.UNFOLLOW_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async getFollowers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const { page, limit } = req.query;
      const result = await userService.getFollowers(
        userId,
        page as string,
        limit as string
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getFollowing(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const { page, limit } = req.query;
      const result = await userService.getFollowing(
        userId,
        page as string,
        limit as string
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async uploadAvatar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return sendSuccess(res, null, 'Không có file được tải lên', HTTP_STATUS.BAD_REQUEST);
      }

      const filename = `avatar-${uuidv4()}.jpg`;
      const bucket = config.minio.buckets.avatars;

      const buffer = await sharp(req.file.buffer)
        .resize(512, 512, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Delete old avatar from storage
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { avatar: true },
      });
      if (user?.avatar) {
        const old = parseStorageUrl(user.avatar);
        if (old) {
          try { await deleteFromStorage(old.bucket, old.key); }
          catch (err) { console.warn('Failed to delete old avatar:', err); }
        }
      }

      const avatarUrl = await uploadToStorage(bucket, filename, buffer, 'image/jpeg');
      const result = await userService.updateAvatar(req.user!.userId, avatarUrl);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async uploadCover(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return sendSuccess(res, null, 'Không có file được tải lên', HTTP_STATUS.BAD_REQUEST);
      }

      const filename = `cover-${uuidv4()}.jpg`;
      const bucket = config.minio.buckets.avatars;

      const buffer = await sharp(req.file.buffer)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Delete old cover from storage
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { coverImage: true },
      });
      if (user?.coverImage) {
        const old = parseStorageUrl(user.coverImage);
        if (old) {
          try { await deleteFromStorage(old.bucket, old.key); }
          catch (err) { console.warn('Failed to delete old cover:', err); }
        }
      }

      const coverUrl = await uploadToStorage(bucket, filename, buffer, 'image/jpeg');
      const result = await userService.updateCoverImage(req.user!.userId, coverUrl);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
