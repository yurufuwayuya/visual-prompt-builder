/**
 * R2 Storage Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadToR2, deleteFromR2, cleanupExpiredImages } from '../../services/r2Storage';

// Mock R2 Bucket
const mockR2Bucket = {
  put: vi.fn(),
  get: vi.fn(),
  head: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
};

describe('R2 Storage Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadToR2', () => {
    it('should upload image and return URL', async () => {
      const mockEtag = 'mock-etag-123';
      mockR2Bucket.put.mockResolvedValue({ etag: mockEtag });

      const dataURL =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const customDomain = 'https://images.example.com';

      const result = await uploadToR2(mockR2Bucket as any, dataURL, {
        keyPrefix: 'test',
        customDomain,
      });

      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('etag', mockEtag);
      expect(result).toHaveProperty('uploadedAt');

      expect(result.key).toMatch(/^test\/\d+-[a-z0-9]+\.png$/);
      expect(result.url).toMatch(new RegExp(`^${customDomain}/test/`));

      expect(mockR2Bucket.put).toHaveBeenCalledTimes(1);
      const [key, arrayBuffer, options] = mockR2Bucket.put.mock.calls[0];
      expect(key).toBe(result.key);
      expect(arrayBuffer).toBeInstanceOf(ArrayBuffer);
      expect(options.httpMetadata.contentType).toBe('image/png');
      expect(options.customMetadata).toHaveProperty('uploadedAt');
      expect(options.customMetadata).toHaveProperty('expiresAt');
    });

    it('should throw error if custom domain is not provided', async () => {
      const dataURL = 'data:image/png;base64,iVBORw0KGgo=';

      await expect(uploadToR2(mockR2Bucket as any, dataURL, {})).rejects.toThrow(
        'Custom domain is required'
      );
    });

    it('should handle different image types', async () => {
      mockR2Bucket.put.mockResolvedValue({ etag: 'mock-etag' });

      const dataURLs = [
        'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        'data:image/webp;base64,UklGRg==',
        'data:image/gif;base64,R0lGODlh',
      ];

      for (const dataURL of dataURLs) {
        await uploadToR2(mockR2Bucket as any, dataURL, {
          customDomain: 'https://images.example.com',
        });
      }

      expect(mockR2Bucket.put).toHaveBeenCalledTimes(3);
      expect(mockR2Bucket.put.mock.calls[0][2].httpMetadata.contentType).toBe('image/jpeg');
      expect(mockR2Bucket.put.mock.calls[1][2].httpMetadata.contentType).toBe('image/webp');
      expect(mockR2Bucket.put.mock.calls[2][2].httpMetadata.contentType).toBe('image/gif');
    });
  });

  describe('deleteFromR2', () => {
    it('should delete object from bucket', async () => {
      const key = 'test/123-abc.png';
      await deleteFromR2(mockR2Bucket as any, key);

      expect(mockR2Bucket.delete).toHaveBeenCalledTimes(1);
      expect(mockR2Bucket.delete).toHaveBeenCalledWith(key);
    });
  });

  describe('cleanupExpiredImages', () => {
    it('should delete expired images', async () => {
      const now = new Date();
      const expiredDate = new Date(now.getTime() - 1000); // 1 second ago
      const futureDate = new Date(now.getTime() + 86400000); // 24 hours from now

      mockR2Bucket.list.mockResolvedValue({
        objects: [
          { key: 'temp/expired-1.png' },
          { key: 'temp/expired-2.png' },
          { key: 'temp/not-expired.png' },
        ],
      });

      mockR2Bucket.head.mockImplementation((key) => {
        if (key === 'temp/expired-1.png' || key === 'temp/expired-2.png') {
          return Promise.resolve({
            customMetadata: { expiresAt: expiredDate.toISOString() },
          });
        }
        if (key === 'temp/not-expired.png') {
          return Promise.resolve({
            customMetadata: { expiresAt: futureDate.toISOString() },
          });
        }
        return Promise.resolve(null);
      });

      mockR2Bucket.delete.mockResolvedValue(undefined);

      const deletedCount = await cleanupExpiredImages(mockR2Bucket as any);

      expect(deletedCount).toBe(2);
      expect(mockR2Bucket.delete).toHaveBeenCalledTimes(2);
      expect(mockR2Bucket.delete).toHaveBeenCalledWith('temp/expired-1.png');
      expect(mockR2Bucket.delete).toHaveBeenCalledWith('temp/expired-2.png');
      expect(mockR2Bucket.delete).not.toHaveBeenCalledWith('temp/not-expired.png');
    });

    it('should handle objects without expiration metadata', async () => {
      mockR2Bucket.list.mockResolvedValue({
        objects: [{ key: 'temp/no-metadata.png' }],
      });

      mockR2Bucket.head.mockResolvedValue({
        customMetadata: {},
      });

      const deletedCount = await cleanupExpiredImages(mockR2Bucket as any);

      expect(deletedCount).toBe(0);
      expect(mockR2Bucket.delete).not.toHaveBeenCalled();
    });
  });
});
