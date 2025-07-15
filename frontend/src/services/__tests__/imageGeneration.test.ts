import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateImage } from '../imageGeneration';

// Mock fetch
global.fetch = vi.fn();

describe('imageGeneration service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('画像生成に成功する', async () => {
    const mockResponse = {
      generatedImage: 'data:image/png;base64,generated...',
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await generateImage({
      referenceImage: 'data:image/png;base64,test...',
      prompt: 'A beautiful landscape',
      model: 'variations',
      strength: 0.7,
    });

    expect(result.image).toBe(mockResponse.generatedImage);
    expect(result.success).toBe(true);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/image/generate'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'A beautiful landscape',
          baseImage: 'data:image/png;base64,test...',
          options: {
            model: 'variations',
            strength: 0.7,
          },
        }),
      })
    );
  });

  it('APIエラーを適切に処理する', async () => {
    const mockError = {
      error: 'API key not found',
    };

    (fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => mockError,
    });

    const result = await generateImage({
      referenceImage: 'data:image/png;base64,test...',
      prompt: 'A beautiful landscape',
      model: 'variations',
      strength: 0.7,
    });

    expect(result.image).toBeUndefined();
    expect(result.success).toBe(false);
    expect(result.error).toBe('API key not found');
  });

  it('ネットワークエラーを処理する', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const result = await generateImage({
      referenceImage: 'data:image/png;base64,test...',
      prompt: 'A beautiful landscape',
      model: 'variations',
      strength: 0.7,
    });

    expect(result.image).toBeUndefined();
    expect(result.success).toBe(false);
    expect(result.error).toBe('画像生成に失敗しました');
  });

  it('レスポンスがJSONでない場合を処理する', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error('Invalid JSON');
      },
      text: async () => 'Internal Server Error',
    });

    const result = await generateImage({
      referenceImage: 'data:image/png;base64,test...',
      prompt: 'A beautiful landscape',
      model: 'variations',
      strength: 0.7,
    });

    expect(result.image).toBeUndefined();
    expect(result.success).toBe(false);
    expect(result.error).toBe('画像生成に失敗しました');
  });

  it('空のプロンプトでも生成できる', async () => {
    const mockResponse = {
      generatedImage: 'data:image/png;base64,generated...',
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await generateImage({
      referenceImage: 'data:image/png;base64,test...',
      prompt: '',
      model: 'variations',
      strength: 0.7,
    });

    expect(result.image).toBe(mockResponse.generatedImage);
    expect(result.success).toBe(true);
  });

  it('すべてのモデルタイプをサポートする', async () => {
    const models = ['variations', 'fill', 'canny'];
    const mockResponse = {
      generatedImage: 'data:image/png;base64,generated...',
    };

    for (const model of models) {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateImage({
        referenceImage: 'data:image/png;base64,test...',
        prompt: 'Test prompt',
        model: model as any,
        strength: 0.5,
      });

      expect(result.image).toBe(mockResponse.generatedImage);
      expect(result.success).toBe(true);
    }
  });

  it('異なる強度値を処理する', async () => {
    const strengths = [0, 0.5, 1];
    const mockResponse = {
      generatedImage: 'data:image/png;base64,generated...',
    };

    for (const strength of strengths) {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateImage({
        referenceImage: 'data:image/png;base64,test...',
        prompt: 'Test prompt',
        model: 'variations',
        strength,
      });

      expect(result.image).toBe(mockResponse.generatedImage);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining(`"strength":${strength}`),
        })
      );
    }
  });

  it('開発環境と本番環境でAPIパスが正しい', async () => {
    const mockResponse = {
      generatedImage: 'data:image/png;base64,generated...',
    };

    // 開発環境
    (window as any).location = { hostname: 'localhost' };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await generateImage({
      image: 'data:image/png;base64,test...',
      prompt: 'Test',
      model: 'variations',
      strength: 0.5,
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8787/api/v1/image/generate',
      expect.any(Object)
    );

    // 本番環境
    (window as any).location = { hostname: 'example.com', protocol: 'https:' };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await generateImage({
      image: 'data:image/png;base64,test...',
      prompt: 'Test',
      model: 'variations',
      strength: 0.5,
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/api/v1/image/generate',
      expect.any(Object)
    );
  });
});
