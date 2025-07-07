import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageGenerationSection } from './ImageGenerationSection';
import * as imageGeneration from '../services/commercialImageGeneration';

// モックの設定
vi.mock('@/stores/languageStore', () => ({
  useLanguageStore: () => ({ language: 'ja' }),
}));

vi.mock('../services/commercialImageGeneration', () => ({
  copyPromptToClipboard: vi.fn(),
  openImageService: vi.fn(),
  saveLastUsedService: vi.fn(),
  getLastUsedService: vi.fn(),
  checkPromptLength: vi.fn(),
}));

describe('ImageGenerationSection', () => {
  const mockPrompt = 'A beautiful landscape with mountains and a lake';

  beforeEach(() => {
    vi.clearAllMocks();
    (imageGeneration.checkPromptLength as any).mockReturnValue(true);
  });

  it('コンポーネントが正しくレンダリングされる', () => {
    render(<ImageGenerationSection prompt={mockPrompt} />);

    expect(screen.getByText('画像を生成')).toBeInTheDocument();
    expect(screen.getByText('サービスを選択')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('サービス選択ドロップダウンに全てのサービスが表示される', () => {
    render(<ImageGenerationSection prompt={mockPrompt} />);

    const select = screen.getByRole('combobox');
    const options = select.querySelectorAll('option');

    expect(options.length).toBeGreaterThan(0);
    expect(options[0]).toHaveTextContent('Pollinations.ai');
  });

  it('URL型サービスで画像生成ボタンをクリックすると適切に処理される', async () => {
    (imageGeneration.openImageService as any).mockImplementation(() => {});

    render(<ImageGenerationSection prompt={mockPrompt} />);

    // Pollinations.ai（URL型）を選択
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'pollinations' } });

    const generateButton = screen.getByText('画像生成サービスで開く');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(imageGeneration.openImageService).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'pollinations' }),
        mockPrompt
      );
    });
  });

  it('コピー型サービスでボタンをクリックするとプロンプトがコピーされる', async () => {
    (imageGeneration.copyPromptToClipboard as any).mockResolvedValue(true);
    (imageGeneration.openImageService as any).mockImplementation(() => {});

    render(<ImageGenerationSection prompt={mockPrompt} />);

    // Bing（コピー型）を選択
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'bing' } });

    const copyButton = screen.getByText('プロンプトをコピーして開く');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(imageGeneration.copyPromptToClipboard).toHaveBeenCalledWith(mockPrompt);
      expect(imageGeneration.openImageService).toHaveBeenCalled();
    });
  });

  it('使い方ボタンをクリックすると説明が表示される', () => {
    render(<ImageGenerationSection prompt={mockPrompt} />);

    const howToButton = screen.getByText('使い方');
    fireEvent.click(howToButton);

    expect(screen.getByText(/自動的に画像が生成されます/)).toBeInTheDocument();
  });

  it('プロンプトが長すぎる場合は警告が表示される', () => {
    (imageGeneration.checkPromptLength as any).mockReturnValue(false);

    render(<ImageGenerationSection prompt={mockPrompt} />);

    expect(screen.getByText(/プロンプトが長すぎる可能性があります/)).toBeInTheDocument();
  });

  it('最後に使用したサービスが復元される', () => {
    (imageGeneration.getLastUsedService as any).mockReturnValue('leonardo');

    render(<ImageGenerationSection prompt={mockPrompt} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('leonardo');
  });

  it('商用利用可能の表示がある', () => {
    render(<ImageGenerationSection prompt={mockPrompt} />);

    expect(screen.getByText('商用利用可能')).toBeInTheDocument();
  });

  it('無料プラン情報が表示される', () => {
    (imageGeneration.getLastUsedService as any).mockReturnValue('pollinations');

    render(<ImageGenerationSection prompt={mockPrompt} />);

    // Pollinations.aiを選択して情報を確認
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'pollinations' } });

    expect(screen.getByText(/完全無料、登録不要/)).toBeInTheDocument();
  });

  it('サービスを変更すると対応する情報が表示される', () => {
    render(<ImageGenerationSection prompt={mockPrompt} />);

    // Leonardo.aiを選択
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'leonardo' } });

    // Leonardo.aiの情報が表示される
    expect(screen.getByText(/無料プラン: 1日150トークン/)).toBeInTheDocument();
  });

  it('プロンプトが空の場合、ボタンが無効になる', () => {
    render(<ImageGenerationSection prompt="" />);

    const button = screen.getByRole('button', { name: /画像生成サービスで開く/ });
    expect(button).toBeDisabled();
  });
});
