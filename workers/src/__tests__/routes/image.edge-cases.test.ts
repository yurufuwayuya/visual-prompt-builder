import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../../index';

// Miniflare環境のモック
const env = {
  CACHE: {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  ALLOWED_ORIGINS: 'http://localhost:5173',
  REPLICATE_API_TOKEN: 'test-token',
};

// fetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe.skip('Image API Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    env.CACHE.get.mockResolvedValue(null);

    // Replicate APIのモックレスポンス
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'test-prediction-id',
        status: 'succeeded',
        output: ['https://example.com/generated-image.png'],
      }),
    });
  });

  describe('入力検証のエッジケース', () => {
    it('非常に長いプロンプトを処理できる', async () => {
      const longPrompt = 'a'.repeat(5000); // 5000文字のプロンプト
      const response = await app.request(
        '/api/v1/image/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: 'data:image/png;base64,iVBORw0KGgo=',
            prompt: longPrompt,
            model: 'variations',
            strength: 0.7,
          }),
        },
        env
      );

      expect(response.status).toBe(200);
    });

    it('境界値の強度を処理できる', async () => {
      const strengths = [0, 0.001, 0.999, 1];

      for (const strength of strengths) {
        const response = await app.request(
          '/api/v1/image/generate',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: 'data:image/png;base64,iVBORw0KGgo=',
              prompt: 'test',
              model: 'variations',
              strength,
            }),
          },
          env
        );

        expect(response.status).toBe(200);
      }
    });

    it('無効な強度値を拒否する', async () => {
      const invalidStrengths = [-0.1, 1.1, NaN, Infinity, 'invalid'];

      for (const strength of invalidStrengths) {
        const response = await app.request(
          '/api/v1/image/generate',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: 'data:image/png;base64,iVBORw0KGgo=',
              prompt: 'test',
              model: 'variations',
              strength,
            }),
          },
          env
        );

        expect(response.status).toBe(400);
        const data = (await response.json()) as { error: string };
        expect(data.error).toContain('strength');
      }
    });

    it('非常に大きなBase64画像を拒否する', async () => {
      // 11MB以上の画像データ
      const largeImage = 'data:image/png;base64,' + 'A'.repeat(15 * 1024 * 1024);

      const response = await app.request(
        '/api/v1/image/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: largeImage,
            prompt: 'test',
            model: 'variations',
            strength: 0.7,
          }),
        },
        env
      );

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toContain('too large');
    });

    it('無効なBase64データを拒否する', async () => {
      const invalidImages = [
        'data:image/png;base64,invalid!@#$%',
        'data:image/png;base64,',
        'not-a-data-url',
        'data:text/plain;base64,dGVzdA==',
        '',
      ];

      for (const image of invalidImages) {
        const response = await app.request(
          '/api/v1/image/generate',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image,
              prompt: 'test',
              model: 'variations',
              strength: 0.7,
            }),
          },
          env
        );

        expect(response.status).toBe(400);
      }
    });

    it('特殊文字を含むプロンプトを処理できる', async () => {
      const specialPrompts = [
        '日本語のプロンプト',
        'Emoji 🎨 🖼️ 🎭',
        'Special chars: <>&"\'',
        'Line\nbreaks\tand\ttabs',
        'Unicode: ∀x∈ℝ',
      ];

      for (const prompt of specialPrompts) {
        const response = await app.request(
          '/api/v1/image/generate',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: 'data:image/png;base64,iVBORw0KGgo=',
              prompt,
              model: 'variations',
              strength: 0.7,
            }),
          },
          env
        );

        expect(response.status).toBe(200);
      }
    });
  });

  describe('並行リクエストの処理', () => {
    it('同時に複数のリクエストを処理できる', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        app.request(
          '/api/v1/image/generate',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: 'data:image/png;base64,iVBORw0KGgo=',
              prompt: `test ${i}`,
              model: 'variations',
              strength: 0.7,
            }),
          },
          env
        )
      );

      const responses = await Promise.all(requests);
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('キャッシュの動作', () => {
    it('同じパラメータでのリクエストはキャッシュされる', async () => {
      const params = {
        image: 'data:image/png;base64,iVBORw0KGgo=',
        prompt: 'cached test',
        model: 'variations' as const,
        strength: 0.7,
      };

      // 初回リクエスト
      const response1 = await app.request(
        '/api/v1/image/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        },
        env
      );

      // 2回目のリクエスト（キャッシュから）
      const response2 = await app.request(
        '/api/v1/image/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        },
        env
      );

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      const data1 = (await response1.json()) as { generatedImage: string };
      const data2 = (await response2.json()) as { generatedImage: string };

      // キャッシュから同じ結果が返される
      expect(data1.generatedImage).toBe(data2.generatedImage);
    });

    it('異なるパラメータでは新しい生成が行われる', async () => {
      const params1 = {
        image: 'data:image/png;base64,iVBORw0KGgo=',
        prompt: 'test 1',
        model: 'variations' as const,
        strength: 0.7,
      };

      const params2 = {
        ...params1,
        prompt: 'test 2',
      };

      const response1 = await app.request(
        '/api/v1/image/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params1),
        },
        env
      );

      const response2 = await app.request(
        '/api/v1/image/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params2),
        },
        env
      );

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      const data1 = (await response1.json()) as { generatedImage: string };
      const data2 = (await response2.json()) as { generatedImage: string };

      // 異なる結果が生成される
      expect(data1.generatedImage).not.toBe(data2.generatedImage);
    });
  });

  describe('エラーリカバリー', () => {
    it('プロバイダーエラー後も次のリクエストを処理できる', async () => {
      // エラーを発生させるリクエスト
      const errorResponse = await app.request(
        '/api/v1/image/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: 'data:image/png;base64,FORCE_ERROR',
            prompt: 'error test',
            model: 'variations',
            strength: 0.7,
          }),
        },
        env
      );

      expect(errorResponse.status).toBe(500);

      // 正常なリクエスト
      const successResponse = await app.request(
        '/api/v1/image/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: 'data:image/png;base64,iVBORw0KGgo=',
            prompt: 'success test',
            model: 'variations',
            strength: 0.7,
          }),
        },
        env
      );

      expect(successResponse.status).toBe(200);
    });
  });

  describe('セキュリティ', () => {
    it('XSS攻撃を防ぐ', async () => {
      const xssPrompt = '<script>alert("XSS")</script>';

      const response = await app.request(
        '/api/v1/image/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: 'data:image/png;base64,iVBORw0KGgo=',
            prompt: xssPrompt,
            model: 'variations',
            strength: 0.7,
          }),
        },
        env
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      // レスポンスにスクリプトタグが含まれていないことを確認
      expect(JSON.stringify(data)).not.toContain('<script>');
    });

    it('SQLインジェクション風の入力を安全に処理する', async () => {
      const sqlPrompt = "'; DROP TABLE users; --";

      const response = await app.request(
        '/api/v1/image/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: 'data:image/png;base64,iVBORw0KGgo=',
            prompt: sqlPrompt,
            model: 'variations',
            strength: 0.7,
          }),
        },
        env
      );

      expect(response.status).toBe(200);
    });
  });
});
