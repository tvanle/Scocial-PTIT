import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';
const MINIO_INTERNAL_URL = process.env.MINIO_INTERNAL_URL || 'http://localhost:9002';
const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL || 'http://localhost:9002';
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const BUCKETS = {
  avatars: 'avatars',
  posts: 'posts',
  dating: 'dating',
};

const s3Client = new S3Client({
  endpoint: MINIO_INTERNAL_URL,
  region: 'us-east-1',
  credentials: {
    accessKeyId: MINIO_ACCESS_KEY,
    secretAccessKey: MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

async function ensureBucket(bucket: string): Promise<void> {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`✅ Bucket ${bucket} exists`);
  } catch (err: any) {
    const status = err.$metadata?.httpStatusCode;
    if (status && status !== 404 && status !== 403) throw err;

    await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(`✅ Created bucket: ${bucket}`);

    // Set public-read policy
    const policy = {
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      }],
    };
    await s3Client.send(new PutBucketPolicyCommand({
      Bucket: bucket,
      Policy: JSON.stringify(policy),
    }));
    console.log(`✅ Set public policy for: ${bucket}`);
  }
}

async function uploadToMinio(bucket: string, key: string, filePath: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
  };

  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeTypes[ext] || 'application/octet-stream',
  }));

  return `${MINIO_PUBLIC_URL}/${bucket}/${key}`;
}

function extractFilename(url: string): string | null {
  // Extract filename from URL like http://localhost:3001/uploads/filename.jpg
  const match = url.match(/\/uploads\/([^\/]+)$/);
  return match ? match[1] : null;
}

async function migrateAvatars() {
  console.log('\n📷 Migrating User Avatars...');

  const users = await prisma.user.findMany({
    where: {
      avatar: {
        contains: 'localhost:3001/uploads',
      },
    },
    select: { id: true, avatar: true },
  });

  console.log(`Found ${users.length} avatars to migrate`);

  for (const user of users) {
    if (!user.avatar) continue;

    const filename = extractFilename(user.avatar);
    if (!filename) continue;

    const localPath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(localPath)) {
      console.log(`⚠️ File not found: ${filename}`);
      continue;
    }

    try {
      const newUrl = await uploadToMinio(BUCKETS.avatars, filename, localPath);
      await prisma.user.update({
        where: { id: user.id },
        data: { avatar: newUrl },
      });
      console.log(`✅ Migrated avatar: ${filename}`);
    } catch (err) {
      console.error(`❌ Failed to migrate avatar ${filename}:`, err);
    }
  }
}

async function migrateMedia() {
  console.log('\n🖼️ Migrating Media (Posts)...');

  const mediaItems = await prisma.media.findMany({
    where: {
      url: {
        contains: 'localhost:3001/uploads',
      },
    },
    select: { id: true, url: true },
  });

  console.log(`Found ${mediaItems.length} media items to migrate`);

  for (const media of mediaItems) {
    const filename = extractFilename(media.url);
    if (!filename) continue;

    const localPath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(localPath)) {
      console.log(`⚠️ File not found: ${filename}`);
      continue;
    }

    try {
      const newUrl = await uploadToMinio(BUCKETS.posts, filename, localPath);
      await prisma.media.update({
        where: { id: media.id },
        data: { url: newUrl },
      });
      console.log(`✅ Migrated media: ${filename}`);
    } catch (err) {
      console.error(`❌ Failed to migrate media ${filename}:`, err);
    }
  }
}

async function migrateDatingPhotos() {
  console.log('\n💕 Migrating Dating Profile Photos...');

  const photos = await prisma.datingProfilePhoto.findMany({
    where: {
      url: {
        contains: 'localhost:3001/uploads',
      },
    },
    select: { id: true, url: true },
  });

  console.log(`Found ${photos.length} dating photos to migrate`);

  for (const photo of photos) {
    const filename = extractFilename(photo.url);
    if (!filename) continue;

    const localPath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(localPath)) {
      console.log(`⚠️ File not found: ${filename}`);
      continue;
    }

    try {
      const newUrl = await uploadToMinio(BUCKETS.dating, filename, localPath);
      await prisma.datingProfilePhoto.update({
        where: { id: photo.id },
        data: { url: newUrl },
      });
      console.log(`✅ Migrated dating photo: ${filename}`);
    } catch (err) {
      console.error(`❌ Failed to migrate dating photo ${filename}:`, err);
    }
  }
}

async function main() {
  console.log('🚀 Starting MinIO Migration...');
  console.log(`MinIO URL: ${MINIO_INTERNAL_URL}`);
  console.log(`Uploads Dir: ${UPLOADS_DIR}`);

  // Ensure all buckets exist
  console.log('\n📦 Ensuring buckets exist...');
  for (const bucket of Object.values(BUCKETS)) {
    await ensureBucket(bucket);
  }

  // Run migrations
  await migrateAvatars();
  await migrateMedia();
  await migrateDatingPhotos();

  console.log('\n✅ Migration complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
