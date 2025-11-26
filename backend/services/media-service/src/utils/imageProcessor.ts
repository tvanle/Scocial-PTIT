import sharp from 'sharp';

interface ImageSize {
  width: number;
  height: number;
  suffix: string;
}

// Standard image sizes
export const IMAGE_SIZES: Record<string, ImageSize> = {
  thumbnail: { width: 150, height: 150, suffix: '_thumb' },
  small: { width: 320, height: 320, suffix: '_small' },
  medium: { width: 640, height: 640, suffix: '_medium' },
  large: { width: 1280, height: 1280, suffix: '_large' },
};

// Avatar sizes
export const AVATAR_SIZES: Record<string, ImageSize> = {
  small: { width: 50, height: 50, suffix: '_50' },
  medium: { width: 100, height: 100, suffix: '_100' },
  large: { width: 200, height: 200, suffix: '_200' },
};

// Cover photo sizes
export const COVER_SIZES: Record<string, ImageSize> = {
  small: { width: 640, height: 240, suffix: '_small' },
  medium: { width: 1200, height: 450, suffix: '_medium' },
  large: { width: 1920, height: 720, suffix: '_large' },
};

interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  format: string;
}

// Process and optimize image
export async function processImage(
  buffer: Buffer,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  } = {}
): Promise<ProcessedImage> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 85, format = 'jpeg' } = options;

  let image = sharp(buffer);
  const metadata = await image.metadata();

  // Resize if needed
  if (
    (metadata.width && metadata.width > maxWidth) ||
    (metadata.height && metadata.height > maxHeight)
  ) {
    image = image.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Auto-rotate based on EXIF
  image = image.rotate();

  // Convert and compress
  let processedBuffer: Buffer;
  switch (format) {
    case 'webp':
      processedBuffer = await image.webp({ quality }).toBuffer();
      break;
    case 'png':
      processedBuffer = await image.png({ quality, compressionLevel: 9 }).toBuffer();
      break;
    default:
      processedBuffer = await image.jpeg({ quality, progressive: true }).toBuffer();
  }

  const outputMetadata = await sharp(processedBuffer).metadata();

  return {
    buffer: processedBuffer,
    width: outputMetadata.width || 0,
    height: outputMetadata.height || 0,
    size: processedBuffer.length,
    format,
  };
}

// Generate multiple sizes of an image
export async function generateImageSizes(
  buffer: Buffer,
  sizes: Record<string, ImageSize>
): Promise<Map<string, ProcessedImage>> {
  const results = new Map<string, ProcessedImage>();

  for (const [name, size] of Object.entries(sizes)) {
    const processed = await processImage(buffer, {
      maxWidth: size.width,
      maxHeight: size.height,
    });
    results.set(name, processed);
  }

  return results;
}

// Process avatar (circular crop + multiple sizes)
export async function processAvatar(buffer: Buffer): Promise<Map<string, ProcessedImage>> {
  // First, make it square by cropping from center
  const metadata = await sharp(buffer).metadata();
  const size = Math.min(metadata.width || 0, metadata.height || 0);

  const squareBuffer = await sharp(buffer)
    .resize(size, size, {
      fit: 'cover',
      position: 'center',
    })
    .toBuffer();

  return generateImageSizes(squareBuffer, AVATAR_SIZES);
}

// Process cover photo
export async function processCoverPhoto(buffer: Buffer): Promise<Map<string, ProcessedImage>> {
  return generateImageSizes(buffer, COVER_SIZES);
}

// Extract image metadata
export async function getImageMetadata(buffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha: boolean;
}> {
  const metadata = await sharp(buffer).metadata();

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: buffer.length,
    hasAlpha: metadata.hasAlpha || false,
  };
}

// Create blur placeholder (LQIP - Low Quality Image Placeholder)
export async function createBlurPlaceholder(buffer: Buffer): Promise<string> {
  const placeholder = await sharp(buffer)
    .resize(20, 20, { fit: 'inside' })
    .blur(10)
    .jpeg({ quality: 50 })
    .toBuffer();

  return `data:image/jpeg;base64,${placeholder.toString('base64')}`;
}

// Extract dominant color
export async function getDominantColor(buffer: Buffer): Promise<string> {
  const { dominant } = await sharp(buffer).stats();
  return `rgb(${dominant.r}, ${dominant.g}, ${dominant.b})`;
}
