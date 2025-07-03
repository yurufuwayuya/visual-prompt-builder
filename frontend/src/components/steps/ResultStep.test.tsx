import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultStep } from './ResultStep';
import { usePromptStore } from '@/stores/promptStore';
import { useToastStore } from '@/stores/toastStore';

// モック
vi.mock('@/stores/promptStore');
vi.mock('@/stores/toastStore');

// Fetch APIのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

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
            negativePrompt: 'ネガティブプロンプト',
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
            negativePrompt: 'ネガティブプロンプト',
          },
        }),
      });

      render(<ResultStep onNew={mockOnNew} />);

      await waitFor(() => {
        // 統合表示されたプロンプトを取得
        const promptElement = screen.getByText((_content, element) => {
          const text = element?.textContent || '';
          return text.includes('テストプロンプト') && text.includes('ネガティブプロンプト');
        });
        expect(promptElement).toBeInTheDocument();
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
            negativePrompt: 'low quality, blurry',
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
            negativePrompt: 'ネガティブプロンプト',
          },
        }),
      });

      render(<ResultStep onNew={mockOnNew} />);

      await waitFor(() => {
        // 統合表示されたプロンプトを取得
        const promptElement = screen.getByText((_content, element) => {
          const text = element?.textContent || '';
          return text.includes('テストプロンプト') && text.includes('ネガティブプロンプト');
        });
        expect(promptElement).toBeInTheDocument();
      });
    });
  });

  describe('リトライ機能', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('エラー時に最大3回リトライする', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<ResultStep onNew={mockOnNew} />);

      // 最初の試行
      await vi.advanceTimersByTimeAsync(100);
      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

      // 1回目のリトライ
      await vi.advanceTimersByTimeAsync(1000);
      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));

      // 2回目のリトライ
      await vi.advanceTimersByTimeAsync(2000);
      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3));

      // 3回目のリトライ
      await vi.advanceTimersByTimeAsync(4000);
      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(4));

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: expect.stringContaining('最大リトライ回数(3回)に達しました'),
          })
        );
      });
    });

    it('リトライ中に進捗を表示する', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockImplementation(() => new Promise(() => {}));

      render(<ResultStep onNew={mockOnNew} />);

      // 最初のエラー後にリトライ開始
      await vi.advanceTimersByTimeAsync(100);
      await vi.advanceTimersByTimeAsync(1000);

      await waitFor(() => {
        expect(screen.getByText(/再試行中/)).toBeInTheDocument();
      });
    });

    it('エラー画面から手動で再試行できる', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<ResultStep onNew={mockOnNew} />);

      // エラーが発生するまで待機
      await vi.advanceTimersByTimeAsync(100);
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);

      await waitFor(() => {
        expect(screen.getByText('プロンプト生成エラー')).toBeInTheDocument();
      });

      // リセット
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            prompt: 'リトライ後のプロンプト',
            negativePrompt: '',
          },
        }),
      });

      const retryButton = screen.getByRole('button', { name: '再試行' });
      await user.click(retryButton);

      await waitFor(() => {
        const promptElement = screen.getByText((_content, element) => {
          const text = element?.textContent || '';
          return text.includes('リトライ後のプロンプト');
        });
        expect(promptElement).toBeInTheDocument();
      });
    });
  });

  describe('コピー機能', () => {
    it('プロンプトをクリップボードにコピーできる', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            prompt: 'コピーするプロンプト',
            negativePrompt: '',
          },
        }),
      });

      render(<ResultStep onNew={mockOnNew} />);

      await waitFor(() => {
        const promptElement = screen.getByText((_content, element) => {
          const text = element?.textContent || '';
          return text.includes('コピーするプロンプト');
        });
        expect(promptElement).toBeInTheDocument();
      });

      // ボタンがクリック可能になるのを待つ
      await waitFor(() => {
        const copyButton = screen.getAllByRole('button', { name: /コピー/ })[0];
        expect(copyButton).not.toBeDisabled();
      });

      const copyButtons = screen.getAllByRole('button', { name: /コピー/ });
      const promptCopyButton =
        copyButtons.find((button) => button.textContent?.includes('プロンプトをコピー')) ||
        copyButtons[0];
      await user.click(promptCopyButton);

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
            negativePrompt: 'ネガティブプロンプト',
          },
        }),
      });

      render(<ResultStep onNew={mockOnNew} />);

      await waitFor(() => {
        const promptElement = screen.getByText((_content, element) => {
          const text = element?.textContent || '';
          return text.includes('ポジティブプロンプト') && text.includes('ネガティブプロンプト');
        });
        expect(promptElement).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: 'プロンプトをコピー' });
      await user.click(copyButton);

      expect(mockWriteText).toHaveBeenCalledWith('ポジティブプロンプト, ネガティブプロンプト');
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'success',
        message: 'プロンプトをコピーしました',
      });
    });
  });

  describe('リセット機能', () => {
    it('プロンプトストアがリセットされた時にローカルステートもリセットされる', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            prompt: '生成されたプロンプト',
            promptJa: '生成されたプロンプト（日本語）',
            negativePrompt: 'ネガティブプロンプト',
          },
        }),
      });

      const { rerender } = render(<ResultStep onNew={mockOnNew} />);

      await waitFor(() => {
        const promptElement = screen.getByText((_content, element) => {
          const text = element?.textContent || '';
          return text.includes('生成されたプロンプト');
        });
        expect(promptElement).toBeInTheDocument();
      });

      // プロンプトストアをリセット
      (usePromptStore as any).mockReturnValue({
        currentPrompt: {},
        setGeneratedPrompt: mockSetGeneratedPrompt,
        saveToHistory: mockSaveToHistory,
      });

      rerender(<ResultStep onNew={mockOnNew} />);

      // ローカルステートがリセットされ、初期状態に戻る
      expect(screen.queryByText(/生成されたプロンプト/)).not.toBeInTheDocument();
      expect(screen.queryByText(/ネガティブプロンプト/)).not.toBeInTheDocument();
    });
  });

  describe('保存機能', () => {
    it('コピーして履歴に保存できる', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            prompt: 'プロンプト',
            negativePrompt: 'ネガティブ',
          },
        }),
      });

      render(<ResultStep onNew={mockOnNew} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'コピーして履歴に保存' })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: 'コピーして履歴に保存' });
      await user.click(saveButton);

      expect(mockWriteText).toHaveBeenCalledWith('プロンプト, ネガティブ');
      expect(mockSaveToHistory).toHaveBeenCalled();
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'success',
        message: 'コピーして履歴に保存しました',
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
            negativePrompt: '',
          },
        }),
      });

      render(<ResultStep onNew={mockOnNew} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'コピーして履歴に保存' })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: 'コピーして履歴に保存' });
      await user.click(saveButton);

      expect(mockSaveToHistory).toHaveBeenCalled();
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'warning',
        message: 'コピーに失敗しましたが、履歴には保存しました',
      });
    });
  });
});
