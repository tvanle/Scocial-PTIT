import { Request, Response, NextFunction } from 'express';
import { ERROR_MESSAGES } from '../constants';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(401).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
  }

  // Attach userId to request for later use
  (req as any).userId = userId;

  next();
};
