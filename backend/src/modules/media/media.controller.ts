import { Response, NextFunction } from 'express';
import { mediaService } from './media.service';
import { AuthRequest } from '../../shared/types';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../shared/constants';
import { sendSuccess } from '../../shared/utils';

export class MediaController {
  async uploadSingle(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return sendSuccess(res, null, 'No file uploaded', HTTP_STATUS.BAD_REQUEST);
      }
      const media = await mediaService.uploadFile(req.file);
      sendSuccess(res, media, SUCCESS_MESSAGES.UPLOAD_SUCCESS, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async uploadMultiple(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return sendSuccess(res, null, 'No files uploaded', HTTP_STATUS.BAD_REQUEST);
      }
      const media = await mediaService.uploadMultiple(files);
      sendSuccess(res, media, SUCCESS_MESSAGES.UPLOAD_SUCCESS, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async deleteMedia(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const mediaId = req.params.mediaId as string;
      await mediaService.deleteMedia(mediaId, req.user!.userId);
      sendSuccess(res, null, SUCCESS_MESSAGES.DELETE_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async getMedia(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const mediaId = req.params.mediaId as string;
      const media = await mediaService.getMedia(mediaId);
      sendSuccess(res, media);
    } catch (error) {
      next(error);
    }
  }
}

export const mediaController = new MediaController();
