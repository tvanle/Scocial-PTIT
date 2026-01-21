import { Request, Response, NextFunction } from 'express';
import { ERROR_MESSAGES } from '../constants';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  if (err.message === ERROR_MESSAGES.FILE_TYPE_NOT_ALLOWED) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err.message.includes('File too large')) {
    res.status(400).json({ error: ERROR_MESSAGES.FILE_TOO_LARGE });
    return;
  }

  res.status(500).json({ error: err.message || 'Internal server error' });
};
