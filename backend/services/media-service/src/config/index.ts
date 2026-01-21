import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3006', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Storage
  useS3: process.env.USE_S3 === 'true',
  localUploadDir: process.env.LOCAL_UPLOAD_DIR || './uploads',

  // AWS S3
  aws: {
    region: process.env.AWS_REGION || 'ap-southeast-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3Bucket: process.env.AWS_S3_BUCKET || 'ptit-social-media',
    cdnUrl: process.env.CDN_URL || `https://${process.env.AWS_S3_BUCKET || 'ptit-social-media'}.s3.amazonaws.com`,
  },

  // Upload limits
  upload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 10,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },

  // Image processing
  image: {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 85,
  },

  // Presigned URL expiration
  presignedUrlExpiry: 3600, // 1 hour
} as const;

export type Config = typeof config;
