import { Request, Response, NextFunction } from 'express';
import { ERROR_MESSAGES } from '../constants';

export const validateCreateNotification = (req: Request, res: Response, next: NextFunction) => {
  const { userId, type, title, body } = req.body;

  if (!userId || !type || !title || !body) {
    return res.status(400).json({ error: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS });
  }

  const validTypes = [
    'LIKE_POST',
    'COMMENT_POST',
    'SHARE_POST',
    'FOLLOW',
    'FRIEND_REQUEST',
    'FRIEND_ACCEPT',
    'MENTION',
    'GROUP_INVITE',
    'GROUP_JOIN_REQUEST',
    'GROUP_POST',
    'MESSAGE',
    'SYSTEM',
  ];

  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid notification type' });
  }

  next();
};

export const validateRegisterDeviceToken = (req: Request, res: Response, next: NextFunction) => {
  const { token, platform } = req.body;

  if (!token || !platform) {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_TOKEN_OR_PLATFORM });
  }

  const validPlatforms = ['ios', 'android', 'web'];
  if (!validPlatforms.includes(platform)) {
    return res.status(400).json({ error: 'Invalid platform' });
  }

  next();
};

export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const { page, limit } = req.query;

  if (page) {
    const pageNum = parseInt(page as string, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_PAGE_OR_LIMIT });
    }
  }

  if (limit) {
    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_PAGE_OR_LIMIT });
    }
  }

  next();
};

export const validateNotificationId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!id || id.length !== 24) {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_NOTIFICATION_ID });
  }

  next();
};

export const validateUpdateSettings = (req: Request, res: Response, next: NextFunction) => {
  const validFields = [
    'pushEnabled',
    'emailEnabled',
    'likePosts',
    'comments',
    'shares',
    'follows',
    'friendRequests',
    'groupActivity',
    'mentions',
    'messages',
    'quietHoursEnabled',
    'quietHoursStart',
    'quietHoursEnd',
  ];

  const bodyKeys = Object.keys(req.body);
  const invalidFields = bodyKeys.filter((key) => !validFields.includes(key));

  if (invalidFields.length > 0) {
    return res.status(400).json({
      error: `Invalid fields: ${invalidFields.join(', ')}`,
    });
  }

  // Validate time format for quiet hours
  if (req.body.quietHoursStart || req.body.quietHoursEnd) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (req.body.quietHoursStart && !timeRegex.test(req.body.quietHoursStart)) {
      return res.status(400).json({
        error: 'Invalid quietHoursStart format. Use HH:mm format',
      });
    }

    if (req.body.quietHoursEnd && !timeRegex.test(req.body.quietHoursEnd)) {
      return res.status(400).json({
        error: 'Invalid quietHoursEnd format. Use HH:mm format',
      });
    }
  }

  next();
};
