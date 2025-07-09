import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultStep } from './ResultStep';
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

    it('生成中の状態を表示する', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // 永遠に待機

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

  describe.skip('リトライ機能', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('エラー時に最大3回リトライする', async () => {
      // サーバーエラーを返す（500エラーはリトライ対象）
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      render(<ResultStep onNew={mockOnNew} />);

      // 初回の試行を待つ
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // 1回目のリトライ (1000ms後)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1100);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      // 2回目のリトライ (2000ms後)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2100);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(3);
      });

      // 3回目のリトライ (4000ms後)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(4100);
      });

      // 3回のリトライ後は再試行されない
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // エラーメッセージが表示されたことを確認
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'プロンプト生成に失敗しました。最大リトライ回数(3回)に達しました。',
        })
      );
    }, 10000);

    it('リトライ中に進捗を表示する', async () => {
      // 最初はエラー、次は成功
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Server error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              prompt: 'リトライ成功',
            },
          }),
        });

      render(<ResultStep onNew={mockOnNew} />);

      // 初回エラーを待つ
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // エラー後、リトライ中のメッセージを確認
      await waitFor(() => {
        expect(screen.getByText(/再試行中... \(2\/3\)/)).toBeInTheDocument();
      });
    }, 10000);

    it('エラー画面から手動で再試行できる', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      render(<ResultStep onNew={mockOnNew} />);

      // すべてのリトライが失敗するまで待機
      await act(async () => {
        await vi.advanceTimersByTimeAsync(8000);
      });

      // エラー画面が表示されることを確認
      expect(screen.getByText('プロンプト生成エラー')).toBeInTheDocument();

      // リセット
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            prompt: 'リトライ後のプロンプト',
          },
        }),
      });

      const retryButton = screen.getByRole('button', { name: '再試行' });
      await user.click(retryButton);

      await waitFor(() => {
        const promptArea = screen.getByRole('region', { name: '生成プロンプト' });
        expect(promptArea).toHaveTextContent('リトライ後のプロンプト');
      });
    }, 10000);
  });

  describe.skip('コピー機能', () => {
    it('プロンプトをクリップボードにコピーできる', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            prompt: 'コピーするプロンプト',
          },
        }),
      });

      render(<ResultStep onNew={mockOnNew} />);

      await waitFor(() => {
        const promptArea = screen.getByRole('region', { name: '生成プロンプト' });
        expect(promptArea).toHaveTextContent('コピーするプロンプト');
      });

      // ボタンがクリック可能になるのを待つ
      await waitFor(() => {
        const copyButton = screen.getAllByRole('button', { name: /コピー/ })[0];
        expect(copyButton).not.toBeDisabled();
      });

      const copyButton = screen.getByRole('button', { name: /コピー/ });
      await user.click(copyButton);

      expect(mockWriteText).toHaveBeenCalledWith('コピーするプロンプト');
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'success',
        message: 'プロンプトをコピーしました',
      });
    });

    it('ネガティブプロンプトも含めてコピーできる', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            prompt: 'ポジティブプロンプト',
          },
        }),
      });

      render(<ResultStep onNew={mockOnNew} />);

      await waitFor(() => {
        const promptArea = screen.getByRole('region', { name: '生成プロンプト' });
        expect(promptArea).toHaveTextContent('ポジティブプロンプト');
      });

      const copyButton = screen.getByRole('button', { name: /コピー/ });
      await user.click(copyButton);

      expect(mockWriteText).toHaveBeenCalledWith('ポジティブプロンプト');
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'success',
        message: 'プロンプトをコピーしました',
      });
    });
  });

  describe.skip('リセット機能', () => {
    it('プロンプトストアがリセットされた時にローカルステートもリセットされる', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            prompt: '生成されたプロンプト',
            promptJa: '生成されたプロンプト（日本語）',
          },
        }),
      });

      const { rerender } = render(<ResultStep onNew={mockOnNew} />);

      await waitFor(() => {
        const promptArea = screen.getByRole('region', { name: '生成プロンプト' });
        expect(promptArea).toHaveTextContent('生成されたプロンプト');
      });

      // プロンプトストアをリセット
      (usePromptStore as any).mockReturnValue({
        currentPrompt: {},
        setGeneratedPrompt: mockSetGeneratedPrompt,
        saveToHistory: mockSaveToHistory,
      });

      rerender(<ResultStep onNew={mockOnNew} />);

      // ローカルステートがリセットされ、初期状態に戻る
      const promptArea = screen.queryByRole('region', { name: '生成プロンプト' });
      expect(promptArea).not.toBeInTheDocument();
    });
  });

  describe('カスタム項目の処理', () => {
    it('カスタム項目がAPIリクエストに含まれる', async () => {
      // カスタム項目を含むプロンプトをモック
      (usePromptStore as any).mockReturnValue({
        currentPrompt: {
          ...mockCurrentPrompt,
          details: [
            { predefinedId: 'smile', name: '笑顔' },
            { predefinedId: 'custom-123456', name: 'カスタム詳細1' },
            { predefinedId: 'casual', name: 'カジュアル' },
            { predefinedId: 'custom-789012', name: 'カスタム詳細2' },
          ],
        },
        setGeneratedPrompt: mockSetGeneratedPrompt,
        saveToHistory: mockSaveToHistory,
      });

      // すべてのfetch呼び出しに対応するモック設定
      mockFetch.mockImplementation((url: string) => {
        // 翻訳APIのモック
        if (url.includes('/translation/translate')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              translatedText: 'translated text',
            }),
          });
        }

        // プロンプト生成APIのモック
        if (url.includes('/prompt/generate')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              data: {
                prompt: 'portrait with custom details',
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

        // プロンプト生成APIの呼び出しを見つける
        const generateCall = mockFetch.mock.calls.find((call) =>
          call[0].includes('/prompt/generate')
        );
        expect(generateCall).toBeDefined();
        const callArgs = generateCall!;
        const body = JSON.parse(callArgs[1].body);

        // デバッグ情報を出力
        // console.log('Request body:', JSON.stringify(body, null, 2));

        // カスタム項目がcustomTextとして送信されていることを確認
        expect(body.promptData.details).toEqual([
          { predefinedId: 'smile', customText: null, order: 0 },
          { predefinedId: null, customText: 'translated text', order: 1 },
          { predefinedId: 'casual', customText: null, order: 2 },
          { predefinedId: null, customText: 'translated text', order: 3 },
        ]);
      });
    });

    it('カスタムカテゴリがAPIリクエストに含まれる', async () => {
      // カスタムカテゴリを含むプロンプトをモック
      (usePromptStore as any).mockReturnValue({
        currentPrompt: {
          ...mockCurrentPrompt,
          category: {
            predefinedId: 'custom-category-123',
            name: 'カスタムカテゴリ',
            customText: null,
          },
        },
        setGeneratedPrompt: mockSetGeneratedPrompt,
        saveToHistory: mockSaveToHistory,
      });

      // すべてのfetch呼び出しに対応するモック設定
      mockFetch.mockImplementation((url: string) => {
        // 翻訳APIのモック
        if (url.includes('/translation/translate')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              translatedText: 'translated text',
            }),
          });
        }

        // プロンプト生成APIのモック
        if (url.includes('/prompt/generate')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              data: {
                prompt: 'custom category prompt',
              },
            }),
          });
        }

        return Promise.reject(new Error('Unknown API endpoint'));
      });

      render(<ResultStep onNew={mockOnNew} />);

      await waitFor(() => {
        // プロンプト生成APIの呼び出しを見つける
        const generateCall = mockFetch.mock.calls.find((call) =>
          call[0].includes('/prompt/generate')
        );
        expect(generateCall).toBeDefined();
        const body = JSON.parse(generateCall![1].body);

        // カスタムカテゴリがcustomTextとして送信されていることを確認
        expect(body.promptData.category).toEqual({
          predefinedId: null,
          customText: 'translated text',
        });
      });
    });
  });

  describe.skip('保存機能', () => {
    it('コピーして履歴に保存できる', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            prompt: 'プロンプト',
          },
        }),
      });

      render(<ResultStep onNew={mockOnNew} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'コピーして履歴に保存' })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: 'コピーして履歴に保存' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith('プロンプト');
        expect(mockSaveToHistory).toHaveBeenCalled();
        expect(mockAddToast).toHaveBeenCalledWith({
          type: 'success',
          message: 'コピーして履歴に保存しました',
        });
      });
    });

    it('コピーに失敗しても履歴には保存できる', async () => {
      const user = userEvent.setup();
      mockWriteText.mockRejectedValueOnce(new Error('Clipboard error'));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            prompt: 'プロンプト',
          },
        }),
      });

      render(<ResultStep onNew={mockOnNew} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'コピーして履歴に保存' })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: 'コピーして履歴に保存' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockSaveToHistory).toHaveBeenCalled();
        expect(mockAddToast).toHaveBeenCalledWith({
          type: 'warning',
          message: 'コピーに失敗しましたが、履歴には保存しました',
        });
      });
    });
  });
});
