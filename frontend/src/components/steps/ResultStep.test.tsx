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
    category: 'portrait',
    details: ['smile', 'casual'],
    colors: ['blue', 'white'],
    style: 'realistic',
    mood: 'happy',
    lighting: 'natural',
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
    it('生成ボタンが表示される', () => {
      render(<ResultStep onNew={mockOnNew} />);
      
      expect(screen.getByText('プロンプトを生成する準備ができました')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /プロンプトを生成/ })).toBeInTheDocument();
    });

    it('設定内容のプレビューが表示される', () => {
      render(<ResultStep onNew={mockOnNew} />);
      
      expect(screen.getByText('カテゴリ:')).toBeInTheDocument();
      expect(screen.getByText('portrait')).toBeInTheDocument();
      expect(screen.getByText('詳細:')).toBeInTheDocument();
      expect(screen.getByText('smile, casual')).toBeInTheDocument();
    });

    it('自動的にAPIリクエストを送信しない', () => {
      render(<ResultStep onNew={mockOnNew} />);
      
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('プロンプト生成', () => {
    it('生成ボタンクリックでAPIリクエストを送信する', async () => {
      const user = userEvent.setup();
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
      
      const generateButton = screen.getByRole('button', { name: /プロンプトを生成/ });
      await user.click(generateButton);

      expect(mockFetch).toHaveBeenCalledWith('/api/prompt/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('portrait'),
      });
    });

    it('生成中の状態を表示する', async () => {
      const user = userEvent.setup();
      mockFetch.mockImplementation(() => new Promise(() => {})); // 永遠に待機

      render(<ResultStep onNew={mockOnNew} />);
      
      const generateButton = screen.getByRole('button', { name: /プロンプトを生成/ });
      await user.click(generateButton);

      expect(screen.getByText('プロンプトを生成中...')).toBeInTheDocument();
    });

    it('生成成功後に結果を表示する', async () => {
      const user = userEvent.setup();
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
      
      const generateButton = screen.getByRole('button', { name: /プロンプトを生成/ });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('テストプロンプト')).toBeInTheDocument();
        expect(screen.getByText('ネガティブプロンプト')).toBeInTheDocument();
      });
    });
  });

  describe('リトライ機能', () => {
    it('エラー時に最大3回リトライする', async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<ResultStep onNew={mockOnNew} />);
      
      const generateButton = screen.getByRole('button', { name: /プロンプトを生成/ });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(3);
        expect(mockAddToast).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: expect.stringContaining('最大リトライ回数(3回)に達しました'),
          })
        );
      });
    });

    it('リトライ中に進捗を表示する', async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
               .mockImplementation(() => new Promise(() => {}));

      render(<ResultStep onNew={mockOnNew} />);
      
      const generateButton = screen.getByRole('button', { name: /プロンプトを生成/ });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/再試行中/)).toBeInTheDocument();
      });
    });

    it('エラー画面から手動で再試行できる', async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<ResultStep onNew={mockOnNew} />);
      
      const generateButton = screen.getByRole('button', { name: /プロンプトを生成/ });
      await user.click(generateButton);

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
        expect(screen.getByText('リトライ後のプロンプト')).toBeInTheDocument();
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
      
      const generateButton = screen.getByRole('button', { name: /プロンプトを生成/ });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('コピーするプロンプト')).toBeInTheDocument();
      });

      const copyButton = screen.getAllByRole('button', { name: /コピー/ })[0];
      await user.click(copyButton);

      expect(mockWriteText).toHaveBeenCalledWith('コピーするプロンプト');
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'success',
        message: '英語プロンプトをコピーしました',
      });
    });
  });

  describe('保存機能', () => {
    it('履歴に保存できる', async () => {
      const user = userEvent.setup();
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
      
      const generateButton = screen.getByRole('button', { name: /プロンプトを生成/ });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /履歴に保存/ })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /履歴に保存/ });
      await user.click(saveButton);

      expect(mockSaveToHistory).toHaveBeenCalled();
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'success',
        message: '履歴に保存しました',
      });
    });
  });
});