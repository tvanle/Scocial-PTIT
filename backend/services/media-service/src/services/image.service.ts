import sharp from 'sharp';
import { config } from '../config';
import { AVATAR_SIZES, COVER_SIZES } from '../constants';
import { ProcessedImage, ImageMetadata, ImageSizeConfig, ImageProcessingOptions } from '../types';

class ImageService {
  // Process and optimize image
  async processImage(buffer: Buffer, options: ImageProcessingOptions = {}): Promise<ProcessedImage> {
    const {
      maxWidth = config.image.maxWidth,
      maxHeight = config.image.maxHeight,
      quality = config.image.quality,
      format = 'jpeg',
    } = options;

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
  async generateImageSizes(
    buffer: Buffer,
    sizes: Record<string, ImageSizeConfig>
  ): Promise<Map<string, ProcessedImage>> {
    const results = new Map<string, ProcessedImage>();

    for (const [name, size] of Object.entries(sizes)) {
      const processed = await this.processImage(buffer, {
        maxWidth: size.width,
        maxHeight: size.height,
      });
      results.set(name, processed);
    }

    return results;
  }

  // Process avatar (square crop + multiple sizes)
  async processAvatar(buffer: Buffer): Promise<Map<string, ProcessedImage>> {
    const metadata = await sharp(buffer).metadata();
    const size = Math.min(metadata.width || 0, metadata.height || 0);

    const squareBuffer = await sharp(buffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center',
      })
      .toBuffer();

    return this.generateImageSizes(squareBuffer, AVATAR_SIZES);
  }

  // Process cover photo
  async processCoverPhoto(buffer: Buffer): Promise<Map<string, ProcessedImage>> {
    return this.generateImageSizes(buffer, COVER_SIZES);
  }

  // Extract image metadata
  async getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
    const metadata = await sharp(buffer).metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: buffer.length,
      hasAlpha: metadata.hasAlpha || false,
    };
  }

  // Create blur placeholder (LQIP)
  async createBlurPlaceholder(buffer: Buffer): Promise<string> {
    const placeholder = await sharp(buffer)
      .resize(20, 20, { fit: 'inside' })
      .blur(10)
      .jpeg({ quality: 50 })
      .toBuffer();

    return `data:image/jpeg;base64,${placeholder.toString('base64')}`;
  }

  // Extract dominant color
  async getDominantColor(buffer: Buffer): Promise<string> {
    const { dominant } = await sharp(buffer).stats();
    return `rgb(${dominant.r}, ${dominant.g}, ${dominant.b})`;
  }
}

export const imageService = new ImageService();
