import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StyleStep } from './StyleStep';
import { usePromptStore } from '@/stores/promptStore';

// モック
vi.mock('@/stores/promptStore');

const mockUsePromptStore = vi.mocked(usePromptStore);
const mockSetColors = vi.fn();
const mockSetStyle = vi.fn();
const mockSetMood = vi.fn();
const mockSetLighting = vi.fn();
const mockOnNext = vi.fn();

describe('StyleStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePromptStore.mockReturnValue({
      currentPrompt: {},
      setColors: mockSetColors,
      setStyle: mockSetStyle,
      setMood: mockSetMood,
      setLighting: mockSetLighting,
      setCategory: vi.fn(),
      addDetail: vi.fn(),
      removeDetail: vi.fn(),
      reorderDetails: vi.fn(),
      setGeneratedPrompt: vi.fn(),
      saveToHistory: vi.fn(),
      reset: vi.fn(),
      clearSelectionsFromDetails: vi.fn(),
      history: [],
    });
  });

  describe('初期表示', () => {
    it('各セクションが表示される', () => {
      render(<StyleStep onNext={mockOnNext} />);

      expect(screen.getByText('画像のスタイルや雰囲気を設定してください')).toBeInTheDocument();
      expect(screen.getByText('色（複数選択可）')).toBeInTheDocument();
      expect(screen.getByText('スタイル')).toBeInTheDocument();
      expect(screen.getByText('雰囲気')).toBeInTheDocument();
      expect(screen.getByText('照明')).toBeInTheDocument();
    });

    it('保存された値が初期選択される', () => {
      mockUsePromptStore.mockReturnValue({
        currentPrompt: {
          colors: [{ predefinedId: 'blue', name: '青', hex: '#0000FF' }],
          style: { predefinedId: 'realistic', name: 'リアル' },
          mood: { predefinedId: 'happy', name: '楽しい' },
          lighting: { predefinedId: 'natural', name: '自然光' },
        },
        setColors: mockSetColors,
        setStyle: mockSetStyle,
        setMood: mockSetMood,
        setLighting: mockSetLighting,
        setCategory: vi.fn(),
        addDetail: vi.fn(),
        removeDetail: vi.fn(),
        reorderDetails: vi.fn(),
        setGeneratedPrompt: vi.fn(),
        saveToHistory: vi.fn(),
        reset: vi.fn(),
        clearSelectionsFromDetails: vi.fn(),
        history: [],
      });

      render(<StyleStep onNext={mockOnNext} />);

      // 色の選択状態
      const blueButton = screen.getByRole('button', { name: /青/ });
      expect(blueButton).toHaveClass('border-primary-600');

      // スタイルの選択状態
      const realisticButton = screen.getByRole('button', { name: /リアル/ });
      expect(realisticButton).toHaveClass('border-primary-600');

      // 雰囲気の選択状態
      const happyButton = screen.getByRole('radio', { name: '楽しい' });
      expect(happyButton).toHaveClass('bg-primary-600');

      // 照明の選択状態
      const naturalButton = screen.getByRole('radio', { name: '自然光' });
      expect(naturalButton).toHaveClass('bg-primary-600');
    });
  });

  describe('選択機能', () => {
    it('色を複数選択できる', async () => {
      const user = userEvent.setup();
      render(<StyleStep onNext={mockOnNext} />);

      const blueButton = screen.getByRole('button', { name: /青/ });
      const redButton = screen.getByRole('button', { name: /赤/ });

      await user.click(blueButton);
      expect(blueButton).toHaveClass('border-primary-600');

      await user.click(redButton);
      expect(redButton).toHaveClass('border-primary-600');
      expect(blueButton).toHaveClass('border-primary-600');
    });

    it('色の選択を解除できる', async () => {
      const user = userEvent.setup();
      render(<StyleStep onNext={mockOnNext} />);

      const blueButton = screen.getByRole('button', { name: /青/ });

      await user.click(blueButton);
      expect(blueButton).toHaveClass('border-primary-600');

      await user.click(blueButton);
      expect(blueButton).not.toHaveClass('border-primary-600');
    });

    it('スタイルを選択できる', async () => {
      const user = userEvent.setup();
      render(<StyleStep onNext={mockOnNext} />);

      const realisticButton = screen.getByRole('button', { name: /リアル/ });
      const animeButton = screen.getByRole('button', { name: /アニメ/ });

      await user.click(realisticButton);
      expect(realisticButton).toHaveClass('border-primary-600');

      await user.click(animeButton);
      expect(animeButton).toHaveClass('border-primary-600');
      expect(realisticButton).not.toHaveClass('border-primary-600');
    });
  });

  describe('プロンプト生成', () => {
    it('選択した内容でプロンプトを生成する', async () => {
      const user = userEvent.setup();
      render(<StyleStep onNext={mockOnNext} />);

      // 各項目を選択
      await user.click(screen.getByRole('button', { name: /青/ }));
      await user.click(screen.getByRole('button', { name: /リアル/ }));
      await user.click(screen.getByRole('radio', { name: '楽しい' }));
      await user.click(screen.getByRole('radio', { name: '自然光' }));

      // プロンプト生成ボタンをクリック
      await user.click(screen.getByRole('button', { name: 'プロンプトを生成' }));

      // 正しい値でストアが更新されることを確認
      expect(mockSetColors).toHaveBeenCalledWith([
        expect.objectContaining({
          predefinedId: 'blue',
          name: '青',
          nameEn: 'Blue',
          hex: '#0000FF',
        }),
      ]);

      expect(mockSetStyle).toHaveBeenCalledWith({
        predefinedId: 'realistic',
        name: 'リアル',
        nameEn: 'Realistic',
      });

      expect(mockSetMood).toHaveBeenCalledWith({
        predefinedId: 'happy',
        name: '楽しい',
        nameEn: 'Happy',
      });

      expect(mockSetLighting).toHaveBeenCalledWith({
        predefinedId: 'natural',
        name: '自然光',
        nameEn: 'Natural Light',
      });

      expect(mockOnNext).toHaveBeenCalled();
    });
  });

  describe('リセット機能', () => {
    it('プロンプトストアがリセットされた時に選択状態もリセットされる', () => {
      const { rerender } = render(<StyleStep onNext={mockOnNext} />);

      // 初期状態で値が設定されている
      mockUsePromptStore.mockReturnValue({
        currentPrompt: {
          colors: [{ predefinedId: 'blue', name: '青', hex: '#0000FF' }],
          style: { predefinedId: 'realistic', name: 'リアル' },
          mood: { predefinedId: 'happy', name: '楽しい' },
          lighting: { predefinedId: 'natural', name: '自然光' },
        },
        setColors: mockSetColors,
        setStyle: mockSetStyle,
        setMood: mockSetMood,
        setLighting: mockSetLighting,
        setCategory: vi.fn(),
        addDetail: vi.fn(),
        removeDetail: vi.fn(),
        reorderDetails: vi.fn(),
        setGeneratedPrompt: vi.fn(),
        saveToHistory: vi.fn(),
        reset: vi.fn(),
        clearSelectionsFromDetails: vi.fn(),
        history: [],
      });

      rerender(<StyleStep onNext={mockOnNext} />);

      // 選択状態を確認
      expect(screen.getByRole('button', { name: /青/ })).toHaveClass('border-primary-600');
      expect(screen.getByRole('button', { name: /リアル/ })).toHaveClass('border-primary-600');
      expect(screen.getByRole('radio', { name: '楽しい' })).toHaveClass('bg-primary-600');
      expect(screen.getByRole('radio', { name: '自然光' })).toHaveClass('bg-primary-600');

      // ストアをリセット
      mockUsePromptStore.mockReturnValue({
        currentPrompt: {},
        setColors: mockSetColors,
        setStyle: mockSetStyle,
        setMood: mockSetMood,
        setLighting: mockSetLighting,
        setCategory: vi.fn(),
        addDetail: vi.fn(),
        removeDetail: vi.fn(),
        reorderDetails: vi.fn(),
        setGeneratedPrompt: vi.fn(),
        saveToHistory: vi.fn(),
        reset: vi.fn(),
        clearSelectionsFromDetails: vi.fn(),
        history: [],
      });

      rerender(<StyleStep onNext={mockOnNext} />);

      // 選択状態がリセットされることを確認
      expect(screen.getByRole('button', { name: /青/ })).not.toHaveClass('border-primary-600');
      expect(screen.getByRole('button', { name: /リアル/ })).not.toHaveClass('border-primary-600');
      expect(screen.getByRole('radio', { name: '楽しい' })).not.toHaveClass('bg-primary-600');
      expect(screen.getByRole('radio', { name: '自然光' })).not.toHaveClass('bg-primary-600');
    });
  });
});
