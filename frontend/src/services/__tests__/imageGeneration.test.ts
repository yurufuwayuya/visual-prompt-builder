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
      image: 'data:image/png;base64,generated...',
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await generateImage({
      referenceImage: 'data:image/png;base64,test...',
      prompt: 'A beautiful landscape',
      model: 'flux-variations',
      strength: 0.7,
    });

    expect(result.image).toBe(mockResponse.image);
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
            model: 'flux-variations',
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
      model: 'flux-variations',
      strength: 0.7,
    });

    expect(result.image).toBeUndefined();
    expect(result.success).toBe(false);
    expect(result.error).toBe('API key not found (undefined)');
  });

  it('ネットワークエラーを処理する', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const result = await generateImage({
      referenceImage: 'data:image/png;base64,test...',
      prompt: 'A beautiful landscape',
      model: 'flux-variations',
      strength: 0.7,
    });

    expect(result.image).toBeUndefined();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('レスポンスがJSONでない場合を処理する', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Invalid JSON');
      },
      text: async () => 'Internal Server Error',
    });

    const result = await generateImage({
      referenceImage: 'data:image/png;base64,test...',
      prompt: 'A beautiful landscape',
      model: 'flux-variations',
      strength: 0.7,
    });

    expect(result.image).toBeUndefined();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unknown error (500)');
  });

  it('空のプロンプトでも生成できる', async () => {
    const mockResponse = {
      image: 'data:image/png;base64,generated...',
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await generateImage({
      referenceImage: 'data:image/png;base64,test...',
      prompt: '',
      model: 'flux-variations',
      strength: 0.7,
    });

    expect(result.image).toBe(mockResponse.image);
    expect(result.success).toBe(true);
  });

  it('すべてのモデルタイプをサポートする', async () => {
    const models = ['flux-variations', 'flux-fill', 'flux-canny'];
    const mockResponse = {
      image: 'data:image/png;base64,generated...',
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

      expect(result.image).toBe(mockResponse.image);
      expect(result.success).toBe(true);
    }
  });

  it('異なる強度値を処理する', async () => {
    const strengths = [0, 0.5, 1];
    const mockResponse = {
      image: 'data:image/png;base64,generated...',
    };

    for (const strength of strengths) {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateImage({
        referenceImage: 'data:image/png;base64,test...',
        prompt: 'Test prompt',
        model: 'flux-variations',
        strength,
      });

      expect(result.image).toBe(mockResponse.image);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining(`"strength":${strength}`),
        })
      );
    }
  });
});
