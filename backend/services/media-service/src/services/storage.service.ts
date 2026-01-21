import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { MediaType, UploadResult, PresignedUrlResponse } from '../types';

class StorageService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
  }

  // Determine media type from mime type
  getMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  // Generate unique file key
  generateFileKey(userId: string, originalName: string, type: MediaType): string {
    const ext = path.extname(originalName).toLowerCase();
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    return `${type}s/${userId}/${timestamp}-${uniqueId}${ext}`;
  }

  // Upload to S3
  private async uploadToS3(buffer: Buffer, key: string, mimeType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: config.aws.s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: 'public-read',
    });

    await this.s3Client.send(command);
    return `${config.aws.cdnUrl}/${key}`;
  }

  // Delete from S3
  private async deleteFromS3(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: config.aws.s3Bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  // Upload to local storage
  private async uploadToLocal(buffer: Buffer, key: string): Promise<string> {
    const filePath = path.join(config.localUploadDir, key);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, buffer);
    return `/uploads/${key}`;
  }

  // Delete from local storage
  private async deleteFromLocal(key: string): Promise<void> {
    const filePath = path.join(config.localUploadDir, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Unified upload function
  async uploadFile(
    buffer: Buffer,
    userId: string,
    originalName: string,
    mimeType: string,
    size: number
  ): Promise<UploadResult> {
    const type = this.getMediaType(mimeType);
    const key = this.generateFileKey(userId, originalName, type);

    const url = config.useS3
      ? await this.uploadToS3(buffer, key, mimeType)
      : await this.uploadToLocal(buffer, key);

    return {
      url,
      key,
      type,
      size,
      mimeType,
    };
  }

  // Unified delete function
  async deleteFile(key: string): Promise<void> {
    if (config.useS3) {
      await this.deleteFromS3(key);
    } else {
      await this.deleteFromLocal(key);
    }
  }

  // Get pre-signed URL for upload
  async getPresignedUploadUrl(
    userId: string,
    fileName: string,
    mimeType: string
  ): Promise<PresignedUrlResponse> {
    const type = this.getMediaType(mimeType);
    const key = this.generateFileKey(userId, fileName, type);

    const command = new PutObjectCommand({
      Bucket: config.aws.s3Bucket,
      Key: key,
      ContentType: mimeType,
      ACL: 'public-read',
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: config.presignedUrlExpiry,
    });

    return {
      uploadUrl,
      key,
      publicUrl: `${config.aws.cdnUrl}/${key}`,
    };
  }

  // Get pre-signed URL for download
  async getPresignedDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: config.aws.s3Bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: config.presignedUrlExpiry,
    });
  }
}

export const storageService = new StorageService();
