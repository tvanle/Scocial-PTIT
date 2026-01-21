import { Request, Response, NextFunction } from 'express';
import { ERROR_MESSAGES } from '../constants';

export interface AuthRequest extends Request {
  userId?: string;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    res.status(401).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
    return;
  }

  req.userId = userId;
  next();
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const userId = req.headers['x-user-id'] as string;

  if (userId) {
    req.userId = userId;
  }

  next();
};
