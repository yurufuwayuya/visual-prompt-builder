/**
 * Cloudflare R2 Storage Service
 * Handles temporary image storage for Replicate API
 */

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
 * Generate unique object key
 */
function generateObjectKey(prefix: string = 'temp'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}/${timestamp}-${random}`;
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
  } = {}
): Promise<R2UploadResult> {
  const { keyPrefix = 'temp', expiresIn = 86400, customDomain } = options; // 24 hours default

  // Generate unique key
  const key = `${generateObjectKey(keyPrefix)}.png`;

  // Convert data URL to ArrayBuffer
  const arrayBuffer = dataURLToArrayBuffer(dataURL);
  const contentType = getContentTypeFromDataURL(dataURL);

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

  if (!object) {
    throw new Error('Failed to upload image to R2');
  }

  // Generate public URL
  let url: string;
  if (customDomain) {
    url = `${customDomain}/${key}`;
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
 * Clean up expired images
 */
export async function cleanupExpiredImages(bucket: R2Bucket): Promise<number> {
  let deletedCount = 0;
  const now = new Date();

  // List objects with temp prefix
  const listed = await bucket.list({
    prefix: 'temp/',
    limit: 1000,
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

  return deletedCount;
}

/**
 * Get signed URL for private bucket access
 * Note: This requires Cloudflare Workers to have the appropriate permissions
 */
export async function getSignedUrl(
  bucket: R2Bucket,
  key: string,
  _expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  // R2 doesn't support signed URLs in the same way as S3
  // You need to implement your own signing mechanism or use Cloudflare Access
  throw new Error(
    'Signed URLs not implemented. Use public bucket with custom domain or implement custom auth.'
  );
}
