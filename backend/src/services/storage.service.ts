import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { config } from '../config';

const s3Client = new S3Client({
  endpoint: config.minio.internalUrl,
  region: 'us-east-1',
  credentials: {
    accessKeyId: config.minio.accessKey,
    secretAccessKey: config.minio.secretKey,
  },
  forcePathStyle: true,
});

const PUBLIC_BUCKETS: string[] = [
  config.minio.buckets.avatars,
  config.minio.buckets.posts,
  config.minio.buckets.dating,
  config.minio.buckets.messages,
];

async function ensureBucket(bucket: string): Promise<void> {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch (err: any) {
    const status = err.$metadata?.httpStatusCode;
    if (status && status !== 404 && status !== 403) throw err;

    await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(`✅ Created MinIO bucket: ${bucket}`);
  }

  // Set public-read policy for non-private buckets
  if (PUBLIC_BUCKETS.includes(bucket)) {
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
  }
}

export async function initBuckets(): Promise<void> {
  const buckets = Object.values(config.minio.buckets);
  await Promise.all(buckets.map(ensureBucket));
  console.log('✅ MinIO buckets ready');
}

export async function uploadToStorage(
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  const publicUrl = config.minio.publicUrl.replace(/\/+$/, '');
  return `${publicUrl}/${bucket}/${key}`;
}

export async function deleteFromStorage(
  bucket: string,
  key: string
): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

export function parseStorageUrl(url: string): { bucket: string; key: string } | null {
  try {
    const publicUrl = config.minio.publicUrl.replace(/\/+$/, '');
    if (!url.startsWith(publicUrl)) return null;

    // Remove publicUrl prefix and leading slash
    const pathPart = url.slice(publicUrl.length).replace(/^\/+/, '');
    const slashIndex = pathPart.indexOf('/');
    if (slashIndex === -1) return null;

    return {
      bucket: pathPart.slice(0, slashIndex),
      key: pathPart.slice(slashIndex + 1),
    };
  } catch {
    return null;
  }
}
