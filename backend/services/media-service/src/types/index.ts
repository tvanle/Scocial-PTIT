import { Request } from 'express';

// Media types
export type MediaType = 'image' | 'video' | 'audio' | 'document';

// Upload result
export interface UploadResult {
  url: string;
  key: string;
  type: MediaType;
  size: number;
  mimeType: string;
}

// Image metadata
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha?: boolean;
  blurPlaceholder?: string;
}

// Processed image
export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  format: string;
}

// Image size configuration
export interface ImageSizeConfig {
  width: number;
  height: number;
  suffix: string;
}

// Presigned URL response
export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

// Avatar upload response
export interface AvatarUploadResponse {
  avatars: Record<string, UploadResult>;
  default: string;
}

// Cover upload response
export interface CoverUploadResponse {
  covers: Record<string, UploadResult>;
  default: string;
}

// Extended request with user info
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Upload options
export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

// Error response
export interface ErrorResponse {
  error: string;
  details?: string;
}
