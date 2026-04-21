import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || '3001'}`,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',

  // Database
  databaseUrl: process.env.DATABASE_URL!,

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // Upload
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/mov,audio/m4a,audio/mp4,audio/mpeg,audio/wav,audio/x-m4a,audio/aac').split(','),
  },

  // MinIO (S3-compatible storage)
  minio: {
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    // Internal URL: used by SDK (inside Docker = http://minio:9000)
    internalUrl: process.env.MINIO_INTERNAL_URL || 'http://localhost:9000',
    // Public URL: used in response URLs (what clients/browsers access)
    publicUrl: process.env.MINIO_PUBLIC_URL || 'http://localhost:9000',
    buckets: {
      avatars: 'avatars',
      posts: 'posts',
      dating: 'dating',
      messages: 'messages',
    },
  },

  // Firebase
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },

  // Email (SMTP)
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'noreply@ptit-social.edu.vn',
  },

  // App
  app: {
    name: 'PTIT Social',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  },

  // Rate Limit
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // requests per windowMs
  },
} as const;
