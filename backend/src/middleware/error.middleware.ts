import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { HTTP_STATUS, ERROR_MESSAGES } from '../shared/constants';
import { config } from '../config';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Zod validation error (check before logging to avoid inspect crash)
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: ERROR_MESSAGES.VALIDATION_ERROR,
      details: errors,
    });
    return;
  }

  // Log error in development (after Zod check)
  if (config.isDev) {
    console.error('Error:', err.message);
  }

  // App error (our custom errors)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: 'Database operation failed',
    });
    return;
  }

  // Default error
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: config.isDev ? err.message : ERROR_MESSAGES.INTERNAL_ERROR,
  });
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
};
