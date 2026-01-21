import { ImageSizeConfig } from '../types';

// Standard image sizes
export const IMAGE_SIZES: Record<string, ImageSizeConfig> = {
  thumbnail: { width: 150, height: 150, suffix: '_thumb' },
  small: { width: 320, height: 320, suffix: '_small' },
  medium: { width: 640, height: 640, suffix: '_medium' },
  large: { width: 1280, height: 1280, suffix: '_large' },
};

// Avatar sizes
export const AVATAR_SIZES: Record<string, ImageSizeConfig> = {
  small: { width: 50, height: 50, suffix: '_50' },
  medium: { width: 100, height: 100, suffix: '_100' },
  large: { width: 200, height: 200, suffix: '_200' },
};

// Cover photo sizes
export const COVER_SIZES: Record<string, ImageSizeConfig> = {
  small: { width: 640, height: 240, suffix: '_small' },
  medium: { width: 1200, height: 450, suffix: '_medium' },
  large: { width: 1920, height: 720, suffix: '_large' },
};

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized',
  NO_FILE_PROVIDED: 'No file provided',
  FILE_MUST_BE_IMAGE: 'File must be an image',
  FILE_TYPE_NOT_ALLOWED: 'File type not allowed',
  FILE_TOO_LARGE: 'File size exceeds limit',
  UPLOAD_FAILED: 'Failed to upload file',
  DELETE_FAILED: 'Failed to delete file',
  NOT_AUTHORIZED_DELETE: 'Not authorized to delete this file',
  MISSING_PARAMS: 'fileName and mimeType required',
  PRESIGNED_URL_FAILED: 'Failed to generate presigned URL',
  METADATA_FAILED: 'Failed to get metadata',
} as const;
