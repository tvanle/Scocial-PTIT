import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  if (err instanceof z.ZodError) {
    res.status(400).json({ error: err.errors[0].message });
    return;
  }

  res.status(500).json({ error: err.message || 'Internal server error' });
};
