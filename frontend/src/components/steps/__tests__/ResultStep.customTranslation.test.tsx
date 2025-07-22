import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { ResultStep } from '../ResultStep';
import { usePromptStore } from '@/stores/promptStore';
import { useToastStore } from '@/stores/toastStore';

// モックの設定
vi.mock('@/stores/promptStore');
vi.mock('@/stores/toastStore');

// fetch モック
const mockFetch = vi.fn();

describe.skip('ResultStep - カスタムテキストの翻訳', () => {
  const mockCurrentPrompt = {
    category: {
      id: 'custom-1',
      predefinedId: 'custom-1',
      name: '美しい風景',
    } as any,
    details: [
      {
        id: 'custom-2',
        predefinedId: 'custom-2',
        name: '山と湖',
        nameEn: '',
      },
    ],
    colors: [
      {
        id: 'custom-3',
        predefinedId: 'custom-3',
        name: '青い空',
        nameEn: '',
        hex: '#0000FF',
      },
    ],
    style: {
      id: 'custom-4',
      predefinedId: 'custom-4',
      name: '水彩画風',
      nameEn: '',
    },
    mood: {
      id: 'custom-5',
      predefinedId: 'custom-5',
      name: '穏やかな',
      nameEn: '',
    },
    lighting: {
      id: 'custom-6',
      predefinedId: 'custom-6',
      name: '夕日の光',
      nameEn: '',
    },
  };

  const mockSetGeneratedPrompt = vi.fn();
  const mockSaveToHistory = vi.fn();
  const mockAddToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // console.errorをモック
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // fetchモックをグローバルに設定
    global.fetch = mockFetch;

    // ストアのモック
    vi.mocked(usePromptStore).mockReturnValue({
      currentPrompt: mockCurrentPrompt,
      setGeneratedPrompt: mockSetGeneratedPrompt,
      saveToHistory: mockSaveToHistory,
    } as any);

    vi.mocked(useToastStore).mockReturnValue({
      addToast: mockAddToast,
    } as any);

    // fetch モックのレスポンス設定
    mockFetch.mockImplementation((url: string, options: any) => {
      const body = JSON.parse(options.body);

      // 翻訳APIのモック
      if (url.includes('/translation/trans')) {
        const translationMap: Record<string, string> = {
          美しい風景: 'beautiful landscape',
          山と湖: 'mountains and lake',
          青い空: 'blue sky',
          水彩画風: 'watercolor style',
          穏やかな: 'peaceful',
          夕日の光: 'sunset light',
        };

        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              translatedText: translationMap[body.text] || body.text,
            }),
        });
      }

      // プロンプト生成APIのモック
      if (url.includes('/prompt/generate')) {
        // 翻訳されたカスタムテキストを受け取っているか確認
        const expectedTranslations = {
          category: 'beautiful landscape',
          details: ['mountains and lake'],
          colors: ['blue sky'],
          style: 'watercolor style',
          mood: 'peaceful',
          lighting: 'sunset light',
        };

        // リクエストボディに翻訳されたテキストが含まれているか検証
        expect(body.promptData.category.customText).toBe(expectedTranslations.category);
        expect(body.promptData.details[0].customText).toBe(expectedTranslations.details[0]);
        expect(body.promptData.colors[0].customText).toBe(expectedTranslations.colors[0]);
        expect(body.promptData.style.customText).toBe(expectedTranslations.style);
        expect(body.promptData.mood.customText).toBe(expectedTranslations.mood);
        expect(body.promptData.lighting.customText).toBe(expectedTranslations.lighting);

        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                prompt:
                  'beautiful landscape, mountains and lake, watercolor style, blue sky, peaceful, sunset light, high quality, detailed, masterpiece',
              },
            }),
        });
      }

      return Promise.reject(new Error('Unknown API endpoint'));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('カスタムテキストの日本語を検出して翻訳する', async () => {
    render(<ResultStep onNew={vi.fn()} />);

    // プロンプト生成が自動的に開始される
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/translation/trans'),
        expect.any(Object)
      );
    });

    // 翻訳APIが各カスタムテキストに対して呼ばれていることを確認
    const translationCalls = mockFetch.mock.calls.filter((call) =>
      call[0].includes('/translation/trans')
    );

    expect(translationCalls).toHaveLength(6); // 6つのカスタムフィールド

    // 各翻訳リクエストの内容を確認
    const translationRequests = translationCalls.map((call) => JSON.parse(call[1].body));
    const expectedTexts = ['美しい風景', '山と湖', '青い空', '水彩画風', '穏やかな', '夕日の光'];

    expectedTexts.forEach((text) => {
      expect(translationRequests.some((req) => req.text === text)).toBe(true);
    });

    // プロンプト生成APIに翻訳されたテキストが送信されることを確認
    await waitFor(() => {
      const generateCalls = mockFetch.mock.calls.filter((call) =>
        call[0].includes('/prompt/generate')
      );
      expect(generateCalls).toHaveLength(1);
    });
  });

  it('英語のカスタムテキストは翻訳しない', async () => {
    // 英語のカスタムテキストを含むプロンプト
    const englishPrompt = {
      ...mockCurrentPrompt,
      category: {
        id: 'custom-1',
        predefinedId: 'custom-1',
        name: 'beautiful landscape', // 英語
      } as any,
    };

    vi.mocked(usePromptStore).mockReturnValue({
      currentPrompt: englishPrompt,
      setGeneratedPrompt: mockSetGeneratedPrompt,
      saveToHistory: mockSaveToHistory,
    } as any);

    render(<ResultStep onNew={vi.fn()} />);

    await waitFor(() => {
      const generateCalls = mockFetch.mock.calls.filter((call) =>
        call[0].includes('/prompt/generate')
      );
      expect(generateCalls).toHaveLength(1);
    });

    // カテゴリの翻訳APIが呼ばれていないことを確認
    const translationCalls = mockFetch.mock.calls.filter((call) =>
      call[0].includes('/translation/trans')
    );

    // カテゴリ以外の5つのフィールドのみ翻訳される
    expect(translationCalls).toHaveLength(5);
  });

  it('翻訳APIがエラーになった場合は元のテキストを使用する', async () => {
    // 翻訳APIをエラーにする
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/translation/translate')) {
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      }

      // プロンプト生成APIは成功
      if (url.includes('/prompt/generate')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                prompt:
                  '美しい風景, 山と湖, 水彩画風, 青い空, 穏やかな, 夕日の光, high quality, detailed, masterpiece',
              },
            }),
        });
      }

      return Promise.reject(new Error('Unknown API endpoint'));
    });

    render(<ResultStep onNew={vi.fn()} />);

    // プロンプト生成が完了するまで待つ
    await waitFor(() => {
      expect(mockSetGeneratedPrompt).toHaveBeenCalled();
    });

    // 元の日本語テキストがそのまま使用されることを確認
    const generateCall = mockFetch.mock.calls.find((call) => call[0].includes('/prompt/generate'));
    expect(generateCall).toBeDefined();
    const requestBody = JSON.parse(generateCall![1].body);

    expect(requestBody.promptData.category.customText).toBe('美しい風景');
  });
});
