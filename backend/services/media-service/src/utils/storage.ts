import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'ptit-social-media';
const CDN_URL = process.env.CDN_URL || `https://${BUCKET_NAME}.s3.amazonaws.com`;

export type MediaType = 'image' | 'video' | 'audio' | 'document';

interface UploadResult {
  url: string;
  key: string;
  type: MediaType;
  size: number;
  mimeType: string;
}

// Determine media type from mime type
export function getMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}

// Generate unique file key
export function generateFileKey(
  userId: string,
  originalName: string,
  type: MediaType
): string {
  const ext = path.extname(originalName).toLowerCase();
  const uniqueId = uuidv4();
  const timestamp = Date.now();
  return `${type}s/${userId}/${timestamp}-${uniqueId}${ext}`;
}

// Upload file to S3
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  mimeType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ACL: 'public-read',
  });

  await s3Client.send(command);
  return `${CDN_URL}/${key}`;
}

// Delete file from S3
export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

// Get pre-signed URL for upload
export async function getPresignedUploadUrl(
  userId: string,
  fileName: string,
  mimeType: string
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const type = getMediaType(mimeType);
  const key = generateFileKey(userId, fileName, type);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: mimeType,
    ACL: 'public-read',
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return {
    uploadUrl,
    key,
    publicUrl: `${CDN_URL}/${key}`,
  };
}

// Get pre-signed URL for download
export async function getPresignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

// Local storage fallback (for development)
import fs from 'fs';

const LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || './uploads';

export async function uploadToLocal(
  buffer: Buffer,
  key: string
): Promise<string> {
  const filePath = path.join(LOCAL_UPLOAD_DIR, key);
  const dir = path.dirname(filePath);

  // Create directory if not exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, buffer);
  return `/uploads/${key}`;
}

export async function deleteFromLocal(key: string): Promise<void> {
  const filePath = path.join(LOCAL_UPLOAD_DIR, key);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// Unified upload function
export async function uploadFile(
  buffer: Buffer,
  userId: string,
  originalName: string,
  mimeType: string,
  size: number
): Promise<UploadResult> {
  const type = getMediaType(mimeType);
  const key = generateFileKey(userId, originalName, type);

  let url: string;

  if (process.env.USE_S3 === 'true') {
    url = await uploadToS3(buffer, key, mimeType);
  } else {
    url = await uploadToLocal(buffer, key);
  }

  return {
    url,
    key,
    type,
    size,
    mimeType,
  };
}

// Unified delete function
export async function deleteFile(key: string): Promise<void> {
  if (process.env.USE_S3 === 'true') {
    await deleteFromS3(key);
  } else {
    await deleteFromLocal(key);
  }
}
