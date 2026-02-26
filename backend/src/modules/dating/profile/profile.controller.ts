import { Response, NextFunction } from 'express';
import { profileService } from './profile.service';
import { AuthRequest } from '../../../shared/types';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../../shared/constants';
import { sendSuccess } from '../../../shared/utils';

export class ProfileController {
  async createProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const profile = await profileService.createProfile(userId, req.body);
      sendSuccess(res, profile, SUCCESS_MESSAGES.DATING_PROFILE_CREATED, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const profile = await profileService.updateProfile(userId, req.body);
      sendSuccess(res, profile, SUCCESS_MESSAGES.DATING_PROFILE_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async getProfileByUserId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const targetUserId = req.params.userId as string;
      const profile = await profileService.getProfileByUserId(userId, targetUserId);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  async getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const profile = await profileService.getMyProfile(userId);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  async addPhoto(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const photo = await profileService.addPhoto(userId, req.body);
      sendSuccess(res, photo, SUCCESS_MESSAGES.PHOTO_ADDED, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async deletePhoto(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const photoId = req.params.id as string;
      await profileService.deletePhoto(userId, photoId);
      sendSuccess(res, null, SUCCESS_MESSAGES.PHOTO_DELETED);
    } catch (error) {
      next(error);
    }
  }

  async updatePrompts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const prompts = await profileService.updatePrompts(userId, req.body);
      sendSuccess(res, prompts, SUCCESS_MESSAGES.PROMPTS_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async updateLifestyle(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const lifestyle = await profileService.updateLifestyle(userId, req.body);
      sendSuccess(res, lifestyle, SUCCESS_MESSAGES.LIFESTYLE_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async updatePreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const preferences = await profileService.updatePreferences(userId, req.body);
      sendSuccess(res, preferences, SUCCESS_MESSAGES.PREFERENCES_UPDATED);
    } catch (error) {
      next(error);
    }
  }
}

export const profileController = new ProfileController();
