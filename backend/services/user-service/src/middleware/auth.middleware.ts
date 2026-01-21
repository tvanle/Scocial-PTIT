import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ERROR_MESSAGES } from '../constants';

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    res.status(401).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
    return;
  }

  req.userId = userId;
  next();
};

// Optional auth - doesn't require but extracts userId if present
export const optionalAuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    req.userId = userId;
  }
  next();
};
