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
        // プロンプトが表示されるエリアを確認
        const promptArea = screen.getByRole('region', { name: '生成プロンプト' });
        expect(promptArea).toHaveTextContent('テストプロンプト');
        expect(promptArea).toHaveTextContent('ネガティブプロンプト');
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
        // プロンプトが表示されるエリアを確認
        const promptArea = screen.getByRole('region', { name: '生成プロンプト' });
        expect(promptArea).toHaveTextContent('テストプロンプト');
        expect(promptArea).toHaveTextContent('ネガティブプロンプト');
      });
    });
  });

  describe('リトライ機能', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('エラー時に最大3回リトライする', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<ResultStep onNew={mockOnNew} />);

      // すべてのリトライが完了するまで待つ (1000 + 2000 + 4000 = 7000ms)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(8000);
      });

      // 4回の試行があったことを確認
      expect(mockFetch).toHaveBeenCalledTimes(4);

      // エラーメッセージが表示されたことを確認
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'プロンプト生成に失敗しました。最大リトライ回数(3回)に達しました。',
        })
      );
    }, 10000);

    it('リトライ中に進捗を表示する', async () => {
      // 最初はエラー、次は永久にpending
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockImplementation(() => new Promise(() => {}));

      render(<ResultStep onNew={mockOnNew} />);

      // エラー後のリトライを開始させる
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1100);
      });

      // リトライ中のメッセージを確認
      expect(screen.getByText(/再試行中/)).toBeInTheDocument();
    }, 10000);

    it('エラー画面から手動で再試行できる', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      mockFetch.mockRejectedValue(new Error('Network error'));

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
            negativePrompt: '',
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
        const promptArea = screen.getByRole('region', { name: '生成プロンプト' });
        expect(promptArea).toHaveTextContent('コピーするプロンプト');
      });

      // ボタンがクリック可能になるのを待つ
      await waitFor(() => {
        const copyButton = screen.getAllByRole('button', { name: /コピー/ })[0];
        expect(copyButton).not.toBeDisabled();
      });

      const copyButton = screen.getByRole('button', { name: 'プロンプトをコピー' });
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
            negativePrompt: 'ネガティブプロンプト',
          },
        }),
      });

      render(<ResultStep onNew={mockOnNew} />);

      await waitFor(() => {
        const promptArea = screen.getByRole('region', { name: '生成プロンプト' });
        expect(promptArea).toHaveTextContent('ポジティブプロンプト');
        expect(promptArea).toHaveTextContent('ネガティブプロンプト');
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

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith('プロンプト, ネガティブ');
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
