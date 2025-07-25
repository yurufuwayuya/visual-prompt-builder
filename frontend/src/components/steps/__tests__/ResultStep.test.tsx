import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ResultStep } from '../ResultStep';
import { usePromptStore } from '@/stores/promptStore';
import { useToastStore } from '@/stores/toastStore';

// モック
vi.mock('@/stores/promptStore');
vi.mock('@/stores/toastStore');

// Fetch APIのモック
const mockFetch = vi.fn();

// クリップボードAPIのモック
const mockWriteText = vi.fn();
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
  },
  configurable: true,
});

describe('ResultStep', () => {
  const mockOnNew = vi.fn();
  const mockSetGeneratedPrompt = vi.fn();
  const mockSaveToHistory = vi.fn();
  const mockAddToast = vi.fn();

  const mockCurrentPrompt = {
    category: {
      predefinedId: 'portrait',
      name: 'ポートレート',
      customText: null,
    },
    details: [
      { predefinedId: 'smile', name: '笑顔' },
      { predefinedId: 'casual', name: 'カジュアル' },
    ],
    colors: [
      { predefinedId: 'blue', name: '青', hex: '#0000ff' },
      { predefinedId: 'white', name: '白', hex: '#ffffff' },
    ],
    style: {
      predefinedId: 'realistic',
      name: 'リアリスティック',
    },
    mood: {
      predefinedId: 'happy',
      name: '楽しい',
    },
    lighting: {
      predefinedId: 'natural',
      name: '自然光',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // fetchモックをグローバルに設定
    global.fetch = mockFetch;

    // ストアのモック設定
    (usePromptStore as any).mockReturnValue({
      currentPrompt: mockCurrentPrompt,
      setGeneratedPrompt: mockSetGeneratedPrompt,
      saveToHistory: mockSaveToHistory,
    });

    (useToastStore as any).mockReturnValue({
      addToast: mockAddToast,
    });

    // クリップボードAPIのモックをリセット
    mockWriteText.mockClear();
    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初期表示', () => {
    it('自動的にプロンプトを生成する', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            prompt: 'テストプロンプト',
          },
        }),
      });

      render(<ResultStep onNew={mockOnNew} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('http://localhost:8787/api/v1/prompt/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('portrait'),
        });
      });
    });

    it('生成成功後に結果を表示する', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            prompt: 'テストプロンプト',
          },
        }),
      });

      render(<ResultStep onNew={mockOnNew} />);

      await waitFor(() => {
        // プロンプトが表示されるエリアを確認
        const promptArea = screen.getByRole('region', { name: '生成プロンプト' });
        expect(promptArea).toHaveTextContent('テストプロンプト');
      });
    });

    it('カテゴリが選択されていない場合は何も表示しない', () => {
      // カテゴリなしのcurrentPromptをモック
      (usePromptStore as any).mockReturnValue({
        currentPrompt: {
          category: null,
          details: [],
          colors: [],
          style: null,
          mood: null,
          lighting: null,
        },
        setGeneratedPrompt: mockSetGeneratedPrompt,
        saveToHistory: mockSaveToHistory,
      });

      const { container } = render(<ResultStep onNew={mockOnNew} />);

      // 何も表示されないことを確認
      expect(container.firstChild).toBeNull();
    });
  });

  describe('プロンプト生成', () => {
    it('自動的にAPIリクエストを送信する', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            prompt: 'realistic portrait, smile, casual, blue, white colors',
          },
        }),
      });

      render(<ResultStep onNew={mockOnNew} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('http://localhost:8787/api/v1/prompt/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('portrait'),
        });
      });
    });

    it('生成中の状態を表示する', async () => {
      // 永遠に待機するPromiseを返すことで、生成中の状態を維持
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            // 解決しないPromise
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ data: { prompt: 'test' } }),
              });
            }, 10000); // 10秒後（テストは終了している）
          })
      );

      render(<ResultStep onNew={mockOnNew} />);

      expect(screen.getByText('プロンプトを生成中...')).toBeInTheDocument();
    });

    it('生成成功後に結果を表示する', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            prompt: 'テストプロンプト',
          },
        }),
      });

      render(<ResultStep onNew={mockOnNew} />);

      await waitFor(() => {
        // プロンプトが表示されるエリアを確認
        const promptArea = screen.getByRole('region', { name: '生成プロンプト' });
        expect(promptArea).toHaveTextContent('テストプロンプト');
      });
    });
  });

  describe('カスタム項目の処理', () => {
    it('カスタム項目を含むプロンプトが正しく生成される', async () => {
      // カスタム項目を含むプロンプトデータ
      const mockCustomPrompt = {
        category: {
          predefinedId: 'portrait',
          name: 'ポートレート',
          customText: null,
        },
        details: [
          { predefinedId: 'smile', name: '笑顔' },
          { predefinedId: 'custom-1234567890', name: '赤いドレスを着た女性' },
          { predefinedId: 'custom-0987654321', name: '花束を持っている' },
        ],
        colors: [{ predefinedId: 'red', name: '赤', hex: '#ff0000' }],
        style: {
          predefinedId: 'realistic',
          name: 'リアリスティック',
        },
        mood: null,
        lighting: null,
      };

      (usePromptStore as any).mockReturnValue({
        currentPrompt: mockCustomPrompt,
        setGeneratedPrompt: mockSetGeneratedPrompt,
        saveToHistory: mockSaveToHistory,
      });

      // APIレスポンスをモック
      mockFetch.mockImplementation((url: string) => {
        // 翻訳APIのモック
        if (url.includes('/api/v1/translation/trans')) {
          return Promise.resolve({
            ok: true,
            json: async () => 'translated text',
          });
        }

        // プロンプト生成APIのモック
        if (url.includes('/prompt/generate')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              data: {
                prompt:
                  'realistic portrait, smile, woman in red dress, holding bouquet, red colors',
              },
            }),
          });
        }

        return Promise.reject(new Error('Unknown API endpoint'));
      });

      render(<ResultStep onNew={mockOnNew} />);

      // プロンプトが表示されることを確認
      await waitFor(() => {
        const promptArea = screen.getByRole('region', { name: '生成プロンプト' });
        expect(promptArea).toHaveTextContent(
          'realistic portrait, smile, woman in red dress, holding bouquet, red colors'
        );
      });
    });

    it('すべての項目がカスタムの場合も正しく処理される', async () => {
      const mockAllCustomPrompt = {
        category: {
          predefinedId: 'custom-category',
          name: 'ファンタジーイラスト',
          customText: null,
        },
        details: [
          { predefinedId: 'custom-1', name: '魔法使いの少女' },
          { predefinedId: 'custom-2', name: '光る杖を持っている' },
        ],
        colors: [{ predefinedId: 'custom-color-1', name: '虹色' }],
        style: {
          predefinedId: 'custom-style',
          name: 'アニメ風',
        },
        mood: {
          predefinedId: 'custom-mood',
          name: '神秘的',
        },
        lighting: {
          predefinedId: 'custom-lighting',
          name: '魔法の光',
        },
      };

      (usePromptStore as any).mockReturnValue({
        currentPrompt: mockAllCustomPrompt,
        setGeneratedPrompt: mockSetGeneratedPrompt,
        saveToHistory: mockSaveToHistory,
      });

      // すべてのfetch呼び出しに対応するモック設定
      mockFetch.mockImplementation((url: string) => {
        // 翻訳APIのモック
        if (url.includes('/api/v1/translation/trans')) {
          return Promise.resolve({
            ok: true,
            json: async () => 'translated text',
          });
        }

        // プロンプト生成APIのモック
        if (url.includes('/prompt/generate')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              data: {
                prompt:
                  'fantasy illustration, magical girl, holding glowing staff, rainbow colors, anime style, mystical mood, magical lighting',
              },
            }),
          });
        }

        return Promise.reject(new Error('Unknown API endpoint'));
      });

      render(<ResultStep onNew={mockOnNew} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/prompt/generate'),
          expect.any(Object)
        );
      });
    });
  });

  describe('カスタムテキストの翻訳', () => {
    it('カスタムテキストの日本語を検出して翻訳する', async () => {
      const mockJapaneseCustomPrompt = {
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

      (usePromptStore as any).mockReturnValue({
        currentPrompt: mockJapaneseCustomPrompt,
        setGeneratedPrompt: mockSetGeneratedPrompt,
        saveToHistory: mockSaveToHistory,
      });

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

      render(<ResultStep onNew={mockOnNew} />);

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

      (usePromptStore as any).mockReturnValue({
        currentPrompt: englishPrompt,
        setGeneratedPrompt: mockSetGeneratedPrompt,
        saveToHistory: mockSaveToHistory,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            prompt: 'generated prompt',
          },
        }),
      });

      render(<ResultStep onNew={mockOnNew} />);

      await waitFor(() => {
        const generateCalls = mockFetch.mock.calls.filter((call) =>
          call[0].includes('/prompt/generate')
        );
        expect(generateCalls).toHaveLength(1);
      });
    });

    it('翻訳APIがエラーになった場合は元のテキストを使用する', async () => {
      const mockCustomPrompt = {
        ...mockCurrentPrompt,
        category: {
          predefinedId: 'custom-1',
          name: '美しい風景',
          customText: null,
        },
      };

      (usePromptStore as any).mockReturnValue({
        currentPrompt: mockCustomPrompt,
        setGeneratedPrompt: mockSetGeneratedPrompt,
        saveToHistory: mockSaveToHistory,
      });

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

      render(<ResultStep onNew={mockOnNew} />);

      // プロンプト生成が完了するまで待つ
      await waitFor(() => {
        expect(mockSetGeneratedPrompt).toHaveBeenCalled();
      });
    });
  });
});
