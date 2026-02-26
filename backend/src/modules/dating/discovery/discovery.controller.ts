import { Response, NextFunction } from 'express';
import { discoveryService } from './discovery.service';
import { AuthRequest } from '../../../shared/types';
import { sendSuccess } from '../../../shared/utils';

export class DiscoveryController {
  async getCandidates(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { page, limit } = req.query;
      const result = await discoveryService.getCandidates(userId, page as string, limit as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const discoveryController = new DiscoveryController();
