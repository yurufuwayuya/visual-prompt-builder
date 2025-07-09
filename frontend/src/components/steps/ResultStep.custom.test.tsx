import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ResultStep } from './ResultStep';
import { usePromptStore } from '@/stores/promptStore';
import { useToastStore } from '@/stores/toastStore';

// モック
vi.mock('@/stores/promptStore');
vi.mock('@/stores/toastStore');

// Fetch APIのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ResultStep - カスタム項目の統合テスト', () => {
  const mockOnNew = vi.fn();
  const mockSetGeneratedPrompt = vi.fn();
  const mockSaveToHistory = vi.fn();
  const mockAddToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useToastStore as any).mockReturnValue({
      addToast: mockAddToast,
    });
  });

  it('カスタム詳細項目を含むプロンプトが正しく生成される', async () => {
    // カスタム項目を含むプロンプトデータ
    const mockCurrentPrompt = {
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
      currentPrompt: mockCurrentPrompt,
      setGeneratedPrompt: mockSetGeneratedPrompt,
      saveToHistory: mockSaveToHistory,
    });

    // APIレスポンスをモック
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          prompt: 'realistic portrait, smile, woman in red dress, holding bouquet, red colors',
        },
      }),
    });

    render(<ResultStep onNew={mockOnNew} />);

    // APIが正しいパラメータで呼ばれたことを確認
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8787/api/v1/prompt/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('赤いドレスを着た女性'),
      });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      // カスタム項目が正しく変換されていることを確認
      expect(body.promptData.details).toContainEqual({
        predefinedId: null,
        customText: '赤いドレスを着た女性',
        order: 1,
      });
      expect(body.promptData.details).toContainEqual({
        predefinedId: null,
        customText: '花束を持っている',
        order: 2,
      });
    });

    // プロンプトが表示されることを確認
    await waitFor(() => {
      const promptArea = screen.getByRole('region', { name: '生成プロンプト' });
      expect(promptArea).toHaveTextContent(
        'realistic portrait, smile, woman in red dress, holding bouquet, red colors'
      );
    });
  });

  it('すべての項目がカスタムの場合も正しく処理される', async () => {
    const mockCurrentPrompt = {
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
      currentPrompt: mockCurrentPrompt,
      setGeneratedPrompt: mockSetGeneratedPrompt,
      saveToHistory: mockSaveToHistory,
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          prompt:
            'fantasy illustration, magical girl, holding glowing staff, rainbow colors, anime style, mystical mood, magical lighting',
        },
      }),
    });

    render(<ResultStep onNew={mockOnNew} />);

    await waitFor(() => {
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      // すべてのカスタム項目が正しく処理されていることを確認
      expect(body.promptData.category).toEqual({
        predefinedId: null,
        customText: 'ファンタジーイラスト',
      });

      expect(body.promptData.style).toEqual({
        predefinedId: null,
        customText: 'アニメ風',
      });

      expect(body.promptData.mood).toEqual({
        predefinedId: null,
        customText: '神秘的',
      });

      expect(body.promptData.lighting).toEqual({
        predefinedId: null,
        customText: '魔法の光',
      });
    });
  });

  it('カスタム項目と定義済み項目の混在が正しく処理される', async () => {
    const mockCurrentPrompt = {
      category: {
        predefinedId: 'portrait',
        name: 'ポートレート',
        customText: null,
      },
      details: [
        { predefinedId: 'smile', name: '笑顔' },
        { predefinedId: 'custom-detail', name: 'カスタム詳細' },
        { predefinedId: 'casual', name: 'カジュアル' },
      ],
      colors: [
        { predefinedId: 'blue', name: '青', hex: '#0000ff' },
        { predefinedId: 'custom-color', name: 'カスタム色' },
      ],
      style: {
        predefinedId: 'custom-style',
        name: 'カスタムスタイル',
      },
      mood: {
        predefinedId: 'happy',
        name: '楽しい',
      },
      lighting: {
        predefinedId: 'custom-lighting',
        name: 'カスタム照明',
      },
    };

    (usePromptStore as any).mockReturnValue({
      currentPrompt: mockCurrentPrompt,
      setGeneratedPrompt: mockSetGeneratedPrompt,
      saveToHistory: mockSaveToHistory,
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          prompt: 'mixed custom and predefined prompt',
        },
      }),
    });

    render(<ResultStep onNew={mockOnNew} />);

    await waitFor(() => {
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      // 定義済み項目
      expect(body.promptData.category.predefinedId).toBe('portrait');
      expect(body.promptData.category.customText).toBeNull();

      expect(body.promptData.mood.predefinedId).toBe('happy');
      expect(body.promptData.mood.customText).toBeNull();

      // カスタム項目
      expect(body.promptData.style.predefinedId).toBeNull();
      expect(body.promptData.style.customText).toBe('カスタムスタイル');

      expect(body.promptData.lighting.predefinedId).toBeNull();
      expect(body.promptData.lighting.customText).toBe('カスタム照明');

      // 詳細の混在
      expect(body.promptData.details[0]).toEqual({
        predefinedId: 'smile',
        customText: null,
        order: 0,
      });
      expect(body.promptData.details[1]).toEqual({
        predefinedId: null,
        customText: 'カスタム詳細',
        order: 1,
      });
      expect(body.promptData.details[2]).toEqual({
        predefinedId: 'casual',
        customText: null,
        order: 2,
      });

      // 色の混在
      expect(body.promptData.colors[0]).toEqual({
        predefinedId: 'blue',
        customText: null,
      });
      expect(body.promptData.colors[1]).toEqual({
        predefinedId: null,
        customText: 'カスタム色',
      });
    });
  });
});
