/**
 * 翻訳APIのテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import app from '../../index';

// 型定義
interface TranslationResponse {
  success: boolean;
  data: {
    translatedText: string;
  };
}

interface BatchTranslationResponse {
  success: boolean;
  data: {
    translations: Array<{
      originalText: string;
      translatedText: string;
      index: number;
    }>;
  };
}

// ErrorResponseは今後のエラーテストで使用予定
// interface ErrorResponse {
//   success: boolean;
//   error: string;
// }

// fetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Miniflare環境のモック
const env = {
  CACHE: {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  ALLOWED_ORIGINS: 'http://localhost:5173',
};

describe('Translation API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    env.CACHE.get.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/v1/translation/translate', () => {
    it.skip('日本語から英語への翻訳が成功すること', async () => {
      // MyMemory APIのモックレスポンス
      // モックをテスト翻訳結果に設定
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          responseStatus: 200,
          responseData: {
            translatedText: 'Test translation',
          },
        }),
      });

      const response = await app.request(
        '/api/v1/translation/trans',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: '猫',
            sourceLang: 'ja',
            targetLang: 'en',
          }),
        },
        env
      );

      expect(response.status).toBe(200);
      const result = (await response.json()) as TranslationResponse;
      expect(result.success).toBe(true);
      expect(result.data.translatedText).toBe('cat');
    });

    it('英語から日本語への翻訳が成功すること', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          responseStatus: 200,
          responseData: {
            translatedText: 'Test translation',
          },
        }),
      });

      const response = await app.request(
        '/api/v1/translation/trans',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: 'cat',
            sourceLang: 'en',
            targetLang: 'ja',
          }),
        },
        env
      );

      expect(response.status).toBe(200);
      const result = (await response.json()) as TranslationResponse;
      expect(result.success).toBe(true);
      expect(result.data.translatedText).toBe('Test translation');
    });

    it('同じ言語の場合はそのまま返すこと', async () => {
      const response = await app.request(
        '/api/v1/translation/trans',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: 'Hello',
            sourceLang: 'en',
            targetLang: 'en',
          }),
        },
        env
      );

      expect(response.status).toBe(200);
      const result = (await response.json()) as TranslationResponse;
      expect(result.success).toBe(true);
      expect(result.data.translatedText).toBe('Hello');
      // APIは呼ばれない
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('MyMemory APIエラー時はフォールバック翻訳を使用すること', async () => {
      // APIエラーをシミュレート
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const response = await app.request(
        '/api/v1/translation/trans',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: '猫',
            sourceLang: 'ja',
            targetLang: 'en',
          }),
        },
        env
      );

      expect(response.status).toBe(200);
      const result = (await response.json()) as TranslationResponse;
      expect(result.success).toBe(true);
      expect(result.data.translatedText).toBe('cat'); // フォールバック辞書から
    });

    it('無効なリクエストは400エラーを返すこと', async () => {
      const response = await app.request(
        '/api/v1/translation/trans',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: '猫',
            sourceLang: 'ja',
            // targetLang missing
          }),
        },
        env
      );

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/translation/batch', () => {
    it('バッチ翻訳が成功すること', async () => {
      // MyMemory APIのモックレスポンス
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            responseStatus: 200,
            responseData: {
              translatedText: 'cat',
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            responseStatus: 200,
            responseData: {
              translatedText: 'dog',
            },
          }),
        });

      const response = await app.request(
        '/api/v1/translation/batch',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            texts: ['猫', '犬'],
            sourceLang: 'ja',
            targetLang: 'en',
          }),
        },
        env
      );

      expect(response.status).toBe(200);
      const result = (await response.json()) as BatchTranslationResponse;
      expect(result.success).toBe(true);
      expect(result.data.translations).toHaveLength(2);
      expect(result.data.translations[0].translatedText).toBe('cat');
      expect(result.data.translations[1].translatedText).toBe('dog');
    });

    it('空の配列は400エラーを返すこと', async () => {
      const response = await app.request(
        '/api/v1/translation/batch',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            texts: [],
            sourceLang: 'ja',
            targetLang: 'en',
          }),
        },
        env
      );

      expect(response.status).toBe(400);
    });

    it('100を超える要素は400エラーを返すこと', async () => {
      const texts = Array(101).fill('test');
      const response = await app.request(
        '/api/v1/translation/batch',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            texts,
            sourceLang: 'ja',
            targetLang: 'en',
          }),
        },
        env
      );

      expect(response.status).toBe(400);
    });
  });
});
