/**
 * Cloudflare R2 Storage Service
 * Handles temporary image storage for Replicate API
 */

import { createLogger } from '../utils/logger';

interface R2UploadResult {
  key: string;
  url: string;
  etag: string;
  uploadedAt: string;
}

/**
 * Convert data URL to ArrayBuffer
 */
function dataURLToArrayBuffer(dataURL: string): ArrayBuffer {
  const base64 = dataURL.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Get content type from data URL
 */
function getContentTypeFromDataURL(dataURL: string): string {
  const match = dataURL.match(/^data:([^;]+);/);
  return match ? match[1] : 'application/octet-stream';
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return extensions[mimeType] || 'png';
}

/**
 * Generate unique object key
 */
function generateObjectKey(prefix: string = 'temp', mimeType?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = mimeType ? getExtensionFromMimeType(mimeType) : 'png';
  return `${prefix}/${timestamp}-${random}.${extension}`;
}

/**
 * Upload image to R2 bucket
 */
export async function uploadToR2(
  bucket: R2Bucket,
  dataURL: string,
  options: {
    keyPrefix?: string;
    expiresIn?: number; // seconds
    customDomain?: string;
    env?: unknown; // For logger environment context
  } = {}
): Promise<R2UploadResult> {
  const logger = createLogger({
    prefix: 'R2Storage',
    env: options.env as { ENVIRONMENT?: string },
  });
  const { keyPrefix = 'temp', expiresIn = 86400, customDomain } = options; // 24 hours default

  // Convert data URL to ArrayBuffer and get content type
  const arrayBuffer = dataURLToArrayBuffer(dataURL);
  const contentType = getContentTypeFromDataURL(dataURL);

  // Generate unique key with proper extension
  const key = generateObjectKey(keyPrefix, contentType);

  logger.debug('R2 Upload attempt:', {
    key,
    contentType,
    dataSize: arrayBuffer.byteLength,
    bucketAvailable: !!bucket,
  });

  // Upload to R2
  const object = await bucket.put(key, arrayBuffer, {
    httpMetadata: {
      contentType,
    },
    customMetadata: {
      uploadedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    },
  });

  logger.debug('R2 put() result:', {
    success: !!object,
    key: object?.key,
    httpEtag: object?.httpEtag,
    uploaded: object?.uploaded,
  });

  if (!object) {
    throw new Error('Failed to upload image to R2');
  }

  // Generate public URL
  let url: string;
  if (customDomain) {
    // Ensure custom domain has trailing slash removed
    const domain = customDomain.endsWith('/') ? customDomain.slice(0, -1) : customDomain;
    url = `${domain}/${key}`;
  } else {
    // Use R2 public URL format
    // This requires the bucket to have public access enabled
    // Format: https://pub-<hash>.r2.dev/<key>
    // Note: In production, you should use a custom domain
    throw new Error(
      'Custom domain is required for public access. Please configure R2 custom domain.'
    );
  }

  return {
    key,
    url,
    etag: object.etag,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Delete image from R2 bucket
 */
export async function deleteFromR2(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key);
}

/**
 * Clean up expired images with pagination support
 */
export async function cleanupExpiredImages(bucket: R2Bucket): Promise<number> {
  let deletedCount = 0;
  const now = new Date();
  let cursor: string | undefined;

  do {
    // List objects with temp prefix and pagination
    const listed = await bucket.list({
      prefix: 'temp/',
      limit: 1000,
      cursor,
    });

    for (const object of listed.objects) {
      // Check if object has expiration metadata
      const headResult = await bucket.head(object.key);
      if (headResult?.customMetadata?.expiresAt) {
        const expiresAt = new Date(headResult.customMetadata.expiresAt);
        if (expiresAt < now) {
          await bucket.delete(object.key);
          deletedCount++;
        }
      }
    }

    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  return deletedCount;
}

/**
 * Get signed URL for private bucket access
 * Note: This requires Cloudflare Workers to have the appropriate permissions
 */
export async function getSignedUrl(
  _bucket: R2Bucket,
  _key: string,
  _expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  // R2 doesn't support signed URLs in the same way as S3
  // You need to implement your own signing mechanism or use Cloudflare Access
  throw new Error(
    'Signed URLs not implemented. Use public bucket with custom domain or implement custom auth.'
  );
}
