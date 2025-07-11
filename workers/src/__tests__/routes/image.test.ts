import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { imageRoute } from '../../routes/image';
import type { Bindings } from '../../types';

// モックの設定
vi.mock('../../services/imageProviders/replicate', () => ({
  generateWithReplicate: vi.fn(),
  getAvailableReplicateModels: vi.fn(() => [
    {
      id: 'flux-fill',
      name: 'FLUX Fill',
      description: 'Professional inpainting and outpainting model',
      version: 'test-version',
    },
  ]),
}));

describe('Image API Routes', () => {
  let app: Hono<{ Bindings: Bindings }>;
  let mockEnv: Bindings;
  
  // テスト用の1x1 PNG画像（Base64エンコード）
  const TEST_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  beforeEach(() => {
    app = new Hono<{ Bindings: Bindings }>();
    app.route('/api/v1/image', imageRoute);

    // モック環境の設定
    mockEnv = {
      ENVIRONMENT: 'development',
      IMAGE_API_KEY: 'test-api-key',
      IMAGE_PROVIDER: 'replicate',
      CACHE: {} as KVNamespace,
      SESSION: {} as KVNamespace,
      RATE_LIMIT_KV: {} as KVNamespace,
      IMAGE_CACHE: {
        get: vi.fn(),
        put: vi.fn(),
      } as unknown as KVNamespace,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/image/generate', () => {
    it('should validate request body', async () => {
      const response = await app.request(
        '/api/v1/image/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // 必須フィールドを欠いたリクエスト
            prompt: 'test prompt',
          }),
        },
        mockEnv
      );

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
    });

    it('should generate image with valid request', async () => {
      // モックの設定
      const { generateWithReplicate } = await import('../../services/imageProviders/replicate');
      vi.mocked(generateWithReplicate).mockResolvedValueOnce({
        image: 'generated-base64-image',
        generationTime: 5000,
        model: 'replicate/flux-fill',
        cost: {
          amount: 0.05,
          currency: 'USD',
        },
      });


      const response = await app.request(
        '/api/v1/image/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            baseImage: TEST_IMAGE,
            prompt: 'A beautiful landscape',
            options: {
              width: 512,
              height: 512,
              strength: 0.75,
              steps: 30,
              guidanceScale: 7.5,
              outputFormat: 'png',
            },
          }),
        },
        mockEnv
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('image');
      expect(result.data).toHaveProperty('generationTime');
      expect(result.data).toHaveProperty('model');
      expect(result.data).toHaveProperty('cost');
    });

    it('should handle API key missing error', async () => {
      // API キーなしの環境
      const envWithoutKey = { ...mockEnv, IMAGE_API_KEY: undefined };


      const response = await app.request(
        '/api/v1/image/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            baseImage: TEST_IMAGE,
            prompt: 'test prompt',
          }),
        },
        envWithoutKey
      );

      expect(response.status).toBe(500);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('画像生成APIキーが設定されていません');
    });

    it('should use cache when available', async () => {
      // キャッシュのモック設定
      vi.mocked(mockEnv.IMAGE_CACHE!.get).mockResolvedValueOnce(
        JSON.stringify({
          image: 'cached-image',
          generationTime: 1000,
          model: 'replicate/flux-fill',
        })
      );


      const response = await app.request(
        '/api/v1/image/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            baseImage: TEST_IMAGE,
            prompt: 'test prompt',
          }),
        },
        mockEnv
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.data.image).toBe('cached-image');
      expect(mockEnv.IMAGE_CACHE!.get).toHaveBeenCalled();
    });

    it('should handle different providers', async () => {
      const openaiEnv = { ...mockEnv, IMAGE_PROVIDER: 'openai' };

      const response = await app.request(
        '/api/v1/image/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            baseImage: TEST_IMAGE,
            prompt: 'test prompt',
          }),
        },
        openaiEnv
      );

      expect(response.status).toBe(500);
      const result = await response.json();
      expect(result.error).toContain('OpenAI API実装は準備中です');
    });

    it('should handle unsupported provider', async () => {
      const unknownEnv = { ...mockEnv, IMAGE_PROVIDER: 'unknown' };

      const response = await app.request(
        '/api/v1/image/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            baseImage: TEST_IMAGE,
            prompt: 'test prompt',
          }),
        },
        unknownEnv
      );

      expect(response.status).toBe(500);
      const result = await response.json();
      expect(result.error).toContain('サポートされていないプロバイダー');
    });

    it('should validate image format', async () => {
      const response = await app.request(
        '/api/v1/image/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            baseImage: 'invalid-image-data',
            prompt: 'test prompt',
          }),
        },
        mockEnv
      );

      // Still should handle the request but might fail in processing
      expect(response.status).toBe(500);
    });

    it('should handle request with custom options', async () => {
      const { generateWithReplicate } = await import('../../services/imageProviders/replicate');
      vi.mocked(generateWithReplicate).mockResolvedValueOnce({
        image: 'generated-image',
        generationTime: 3000,
        model: 'replicate/flux-variations',
        cost: { amount: 0.03, currency: 'USD' },
      });

      const response = await app.request(
        '/api/v1/image/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            baseImage: TEST_IMAGE,
            prompt: 'test prompt',
            options: {
              width: 1024,
              height: 1024,
              strength: 0.8,
              steps: 40,
              guidanceScale: 8.0,
              negativePrompt: 'ugly, blurry',
              outputFormat: 'jpeg',
            },
          }),
        },
        mockEnv
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(generateWithReplicate).toHaveBeenCalledWith(
        TEST_IMAGE,
        'test prompt',
        expect.objectContaining({
          width: 1024,
          height: 1024,
          strength: 0.8,
          steps: 40,
          guidanceScale: 8.0,
          negativePrompt: 'ugly, blurry',
          outputFormat: 'jpeg',
        }),
        'test-api-key',
        'flux-fill'
      );
    });
  });

  describe('GET /api/v1/image/models', () => {
    it('should return available models', async () => {
      const response = await app.request(
        '/api/v1/image/models',
        {
          method: 'GET',
        },
        mockEnv
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('provider', 'replicate');
      expect(result.data).toHaveProperty('models');
      expect(Array.isArray(result.data.models)).toBe(true);
    });
  });
});
