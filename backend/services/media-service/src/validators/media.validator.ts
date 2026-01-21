import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ERROR_MESSAGES } from '../constants';

export const validateFileExists = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.file) {
    res.status(400).json({ error: ERROR_MESSAGES.NO_FILE_PROVIDED });
    return;
  }
  next();
};

export const validateFilesExist = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    res.status(400).json({ error: ERROR_MESSAGES.NO_FILE_PROVIDED });
    return;
  }
  next();
};

export const validateImageFile = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.file) {
    res.status(400).json({ error: ERROR_MESSAGES.NO_FILE_PROVIDED });
    return;
  }

  if (!req.file.mimetype.startsWith('image/')) {
    res.status(400).json({ error: ERROR_MESSAGES.FILE_MUST_BE_IMAGE });
    return;
  }
  next();
};

export const validatePresignedUrlParams = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const { fileName, mimeType } = req.body;

  if (!fileName || !mimeType) {
    res.status(400).json({ error: ERROR_MESSAGES.MISSING_PARAMS });
    return;
  }
  next();
};

export const validateDeletePermission = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const { key } = req.params;
  const userId = req.userId;

  if (!key.includes(userId!)) {
    res.status(403).json({ error: ERROR_MESSAGES.NOT_AUTHORIZED_DELETE });
    return;
  }
  next();
};
