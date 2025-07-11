import { describe, it, expect } from 'vitest';
import {
  getImageMetadata,
  cleanBase64,
  base64ToArrayBuffer,
  arrayBufferToBase64,
  validateImageSize,
  createDataUrl,
  isValidImageFormat,
  formatImageError,
} from '../../utils/imageProcessing';

describe('Image Processing Utilities', () => {
  const sampleBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const sampleDataUrl = `data:image/png;base64,${sampleBase64}`;

  describe('getImageMetadata', () => {
    it('should extract metadata from data URL', () => {
      const metadata = getImageMetadata(sampleDataUrl);
      expect(metadata.mimeType).toBe('image/png');
      expect(metadata.extension).toBe('png');
    });

    it('should handle JPEG format', () => {
      const jpegDataUrl = `data:image/jpeg;base64,${sampleBase64}`;
      const metadata = getImageMetadata(jpegDataUrl);
      expect(metadata.mimeType).toBe('image/jpeg');
      expect(metadata.extension).toBe('jpg');
    });

    it('should return PNG as default for plain base64', () => {
      const metadata = getImageMetadata(sampleBase64);
      expect(metadata.mimeType).toBe('image/png');
      expect(metadata.extension).toBe('png');
    });
  });

  describe('cleanBase64', () => {
    it('should remove data URL prefix', () => {
      const cleaned = cleanBase64(sampleDataUrl);
      expect(cleaned).toBe(sampleBase64);
    });

    it('should return unchanged for plain base64', () => {
      const cleaned = cleanBase64(sampleBase64);
      expect(cleaned).toBe(sampleBase64);
    });

    it('should handle malformed data URLs', () => {
      const malformed = 'data:image/png;base64';
      const cleaned = cleanBase64(malformed);
      expect(cleaned).toBe(malformed);
    });
  });

  describe('base64ToArrayBuffer and arrayBufferToBase64', () => {
    it('should convert between base64 and ArrayBuffer', () => {
      const buffer = base64ToArrayBuffer(sampleBase64);
      expect(buffer).toBeInstanceOf(ArrayBuffer);

      const convertedBack = arrayBufferToBase64(buffer);
      expect(convertedBack).toBe(sampleBase64);
    });

    it('should handle data URLs in conversion', () => {
      const buffer = base64ToArrayBuffer(sampleDataUrl);
      const convertedBack = arrayBufferToBase64(buffer);
      expect(convertedBack).toBe(sampleBase64);
    });
  });

  describe('validateImageSize', () => {
    it('should validate image size under limit', () => {
      const smallImage = 'SGVsbG8gV29ybGQ='; // Small base64
      expect(validateImageSize(smallImage, 1)).toBe(true);
    });

    it('should reject images over size limit', () => {
      // Create a large base64 string (> 1KB)
      const largeImage = 'A'.repeat(2000);
      expect(validateImageSize(largeImage, 0.001)).toBe(false);
    });

    it('should handle data URLs in size validation', () => {
      expect(validateImageSize(sampleDataUrl, 1)).toBe(true);
    });
  });

  describe('createDataUrl', () => {
    it('should create data URL from base64', () => {
      const dataUrl = createDataUrl(sampleBase64, 'image/png');
      expect(dataUrl).toBe(sampleDataUrl);
    });

    it('should handle already prefixed base64', () => {
      const dataUrl = createDataUrl(sampleDataUrl, 'image/png');
      expect(dataUrl).toBe(sampleDataUrl);
    });
  });

  describe('isValidImageFormat', () => {
    it('should accept valid image formats', () => {
      expect(isValidImageFormat('image/jpeg')).toBe(true);
      expect(isValidImageFormat('image/jpg')).toBe(true);
      expect(isValidImageFormat('image/png')).toBe(true);
      expect(isValidImageFormat('image/webp')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidImageFormat('image/gif')).toBe(false);
      expect(isValidImageFormat('text/plain')).toBe(false);
      expect(isValidImageFormat('image/svg+xml')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isValidImageFormat('IMAGE/PNG')).toBe(true);
      expect(isValidImageFormat('Image/Jpeg')).toBe(true);
    });
  });

  describe('formatImageError', () => {
    it('should format Error objects', () => {
      const error = new Error('Test error');
      const formatted = formatImageError(error);
      expect(formatted).toBe('画像処理エラー: Test error');
    });

    it('should handle non-Error objects', () => {
      const formatted = formatImageError('string error');
      expect(formatted).toBe('画像処理中に予期しないエラーが発生しました');
    });

    it('should handle null/undefined', () => {
      const formatted = formatImageError(null);
      expect(formatted).toBe('画像処理中に予期しないエラーが発生しました');
    });
  });
});
