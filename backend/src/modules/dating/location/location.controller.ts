import { Response, NextFunction } from 'express';
import { locationService } from './location.service';
import { AuthRequest } from '../../../shared/types';
import { sendSuccess } from '../../../shared/utils';

export class LocationController {
  async updateLocation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await locationService.updateLocation(userId, req.body);
      sendSuccess(res, result, 'Cập nhật vị trí thành công');
    } catch (error) {
      next(error);
    }
  }

  async getNearbyUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { distance, page, limit } = req.query;
      const maxDistance = distance ? parseFloat(distance as string) : undefined;
      const result = await locationService.findNearbyUsers(
        userId,
        maxDistance,
        page as string,
        limit as string,
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const locationController = new LocationController();
