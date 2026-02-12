import { Response, NextFunction } from 'express';
import { matchService } from './match.service';
import { AuthRequest } from '../../../shared/types';
import { sendSuccess } from '../../../shared/utils';

export class MatchController {
  async getMatches(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { page, limit } = req.query;
      const result = await matchService.getMatches(userId, page as string, limit as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getMatchDetail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const matchId = req.params.id as string;
      const result = await matchService.getMatchDetail(userId, matchId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const matchController = new MatchController();
