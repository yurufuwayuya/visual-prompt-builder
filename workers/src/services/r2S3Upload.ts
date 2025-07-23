/**
 * R2 S3 API Upload Service
 * S3互換APIを使用したCloudflare R2への画像アップロード
 */

import { AwsClient } from 'aws4fetch';
import type { Bindings } from '../types';

interface R2S3UploadResult {
  key: string;
  url: string;
  etag: string;
  uploadedAt: string;
}

interface S3UploadOptions {
  keyPrefix?: string;
  contentType?: string;
  expiresIn?: number; // seconds
}

/**
 * Convert data URL to Uint8Array
 */
function dataURLToUint8Array(dataURL: string): Uint8Array {
  if (!dataURL.includes(',')) {
    throw new Error('Invalid data URL format');
  }
  const base64 = dataURL.split(',')[1];
  if (!base64) {
    throw new Error('No base64 data found in data URL');
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
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
 * Get S3 endpoint based on environment
 */
function getS3Endpoint(env: Bindings): string {
  const isProduction = env.ENVIRONMENT === 'production';
  const endpoint = isProduction ? env.R2_S3_API_PROD : env.R2_S3_API_DEV;

  if (!endpoint) {
    throw new Error('R2 S3 API endpoint is not configured');
  }

  return endpoint;
}

/**
 * Create R2 client with validated credentials and parsed endpoint
 */
function createR2Client(env: Bindings): {
  client: AwsClient;
  baseUrl: string;
  bucketName: string;
} {
  // Validate credentials
  if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 credentials are not configured');
  }

  // Get and parse endpoint
  const endpoint = getS3Endpoint(env);
  const urlParts = endpoint.split('/');

  if (urlParts.length < 4) {
    throw new Error(
      'Invalid R2 S3 API endpoint format. Expected: https://<account-id>.r2.cloudflarestorage.com/<bucket-name>'
    );
  }

  const bucketName = urlParts[urlParts.length - 1];
  if (!bucketName) {
    throw new Error('Bucket name not found in endpoint URL');
  }

  const baseUrl = urlParts.slice(0, -1).join('/');

  // Create AWS client
  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    region: 'auto',
    service: 's3',
  });

  return { client, baseUrl, bucketName };
}

/**
 * Upload image to R2 using S3-compatible API
 */
export async function uploadToR2S3(
  dataURL: string,
  env: Bindings,
  options: S3UploadOptions = {}
): Promise<R2S3UploadResult> {
  const { keyPrefix = 'temp', expiresIn = 86400 } = options; // 24 hours default

  // Create R2 client with validated credentials and parsed endpoint
  const { client, baseUrl, bucketName } = createR2Client(env);

  // Convert data URL and get metadata
  const data = dataURLToUint8Array(dataURL);
  const contentType = options.contentType || getContentTypeFromDataURL(dataURL);
  const key = generateObjectKey(keyPrefix, contentType);

  console.log('[DEBUG] R2 S3 Upload attempt:', {
    endpoint: getS3Endpoint(env),
    bucketName,
    key,
    contentType,
    dataSize: data.length,
  });

  // Upload to R2
  const url = `${baseUrl}/${bucketName}/${key}`;
  const response = await client.fetch(url, {
    method: 'PUT',
    body: data,
    headers: {
      'Content-Type': contentType,
      'x-amz-meta-uploaded-at': new Date().toISOString(),
      'x-amz-meta-expires-at': new Date(Date.now() + expiresIn * 1000).toISOString(),
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[ERROR] R2 S3 upload failed:', {
      status: response.status,
      error,
    });
    throw new Error(`Failed to upload to R2: ${response.status} - ${error}`);
  }

  const etag = response.headers.get('etag') || '';

  console.log('[DEBUG] R2 S3 upload successful:', {
    key,
    etag,
    status: response.status,
  });

  // Generate public URL
  // Use custom domain if available
  let publicUrl: string;
  if (env.R2_CUSTOM_DOMAIN) {
    const domain = env.R2_CUSTOM_DOMAIN.endsWith('/')
      ? env.R2_CUSTOM_DOMAIN.slice(0, -1)
      : env.R2_CUSTOM_DOMAIN;
    publicUrl = `${domain}/${key}`;
  } else {
    // Use S3 API endpoint as fallback
    publicUrl = `${baseUrl}/${bucketName}/${key}`;
  }

  return {
    key,
    url: publicUrl,
    etag: etag.replace(/"/g, ''), // Remove quotes from etag
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Delete image from R2 using S3-compatible API
 */
export async function deleteFromR2S3(key: string, env: Bindings): Promise<void> {
  // Create R2 client with validated credentials and parsed endpoint
  const { client, baseUrl, bucketName } = createR2Client(env);

  const url = `${baseUrl}/${bucketName}/${key}`;
  const response = await client.fetch(url, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    console.error('[ERROR] R2 S3 delete failed:', {
      status: response.status,
      error,
    });
    throw new Error(`Failed to delete from R2: ${response.status} - ${error}`);
  }
}

/**
 * Get pre-signed URL for temporary access
 */
export async function getPresignedUrl(
  key: string,
  env: Bindings,
  expiresIn: number = 3600
): Promise<string> {
  // Create R2 client with validated credentials and parsed endpoint
  const { client, baseUrl, bucketName } = createR2Client(env);

  const url = new URL(`${baseUrl}/${bucketName}/${key}`);
  url.searchParams.set('X-Amz-Expires', expiresIn.toString());

  const presignedUrl = await client.sign(
    new Request(url.toString(), {
      method: 'GET',
    }),
    {
      aws: {
        signQuery: true,
      },
    }
  );

  return presignedUrl.url;
}
