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
  });

  it('サービス選択カードに全てのサービスが表示される', () => {
    render(<ImageGenerationSection prompt={mockPrompt} />);

    // 各サービスがカードとして表示されることを確認
    expect(screen.getByText('ChatGPT 画像生成')).toBeInTheDocument();
    expect(screen.getByText('Leonardo.ai')).toBeInTheDocument();
    expect(screen.getByText('Stable Diffusion Online')).toBeInTheDocument();
    expect(screen.getByText('ImageFX by Google')).toBeInTheDocument();
  });

  it('コピー型サービスで画像生成ボタンをクリックすると適切に処理される', async () => {
    (imageGeneration.openImageService as any).mockImplementation(() => {});
    (imageGeneration.copyPromptToClipboard as any).mockResolvedValue(true);

    render(<ImageGenerationSection prompt={mockPrompt} />);

    // ChatGPT（コピー型）カードをクリック
    const chatgptCard = screen.getByText('ChatGPT 画像生成').closest('button');
    fireEvent.click(chatgptCard!);

    const generateButton = screen.getByText('プロンプトをコピーして開く');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(imageGeneration.copyPromptToClipboard).toHaveBeenCalledWith(mockPrompt);
      expect(imageGeneration.openImageService).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'chatgpt' })
      );
    });
  });

  it('コピー型サービスでボタンをクリックするとプロンプトがコピーされる', async () => {
    (imageGeneration.copyPromptToClipboard as any).mockResolvedValue(true);
    (imageGeneration.openImageService as any).mockImplementation(() => {});

    render(<ImageGenerationSection prompt={mockPrompt} />);

    // Leonardo（コピー型）カードをクリック
    const leonardoCard = screen.getByText('Leonardo.ai').closest('button');
    fireEvent.click(leonardoCard!);

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

    expect(screen.getByText(/ChatGPTにログイン後/)).toBeInTheDocument();
  });

  it('プロンプトが長すぎる場合は警告が表示される', () => {
    (imageGeneration.checkPromptLength as any).mockReturnValue(false);

    render(<ImageGenerationSection prompt={mockPrompt} />);

    expect(screen.getByText(/プロンプトが長すぎる可能性があります/)).toBeInTheDocument();
  });

  it('最後に使用したサービスが復元される', () => {
    (imageGeneration.getLastUsedService as any).mockReturnValue('leonardo');

    render(<ImageGenerationSection prompt={mockPrompt} />);

    // Leonardo.aiカードが選択状態になっていることを確認
    const leonardoCard = screen.getByText('Leonardo.ai').closest('button');
    expect(leonardoCard).toHaveClass('border-blue-500');
  });

  it('商用利用可能の表示がある', () => {
    render(<ImageGenerationSection prompt={mockPrompt} />);

    expect(screen.getByText('商用利用可能')).toBeInTheDocument();
  });

  it('無料プラン情報が表示される', () => {
    (imageGeneration.getLastUsedService as any).mockReturnValue('chatgpt');

    render(<ImageGenerationSection prompt={mockPrompt} />);

    // ChatGPTカードをクリックして情報を確認
    const chatgptCard = screen.getByText('ChatGPT 画像生成').closest('button');
    fireEvent.click(chatgptCard!);

    expect(screen.getByText(/無料プランで利用可能/)).toBeInTheDocument();
  });

  it('サービスを変更すると対応する情報が表示される', () => {
    render(<ImageGenerationSection prompt={mockPrompt} />);

    // Leonardo.aiカードをクリック
    const leonardoCard = screen.getByText('Leonardo.ai').closest('button');
    fireEvent.click(leonardoCard!);

    // Leonardo.aiの情報が表示される
    expect(screen.getByText(/無料プラン: 1日150トークン/)).toBeInTheDocument();
  });

  it('プロンプトが空の場合、ボタンが無効になる', () => {
    render(<ImageGenerationSection prompt="" />);

    // まずサービスを選択
    const chatgptCard = screen.getByText('ChatGPT 画像生成').closest('button');
    fireEvent.click(chatgptCard!);

    const button = screen.getByRole('button', { name: /プロンプトをコピーして開く/ });
    expect(button).toBeDisabled();
  });
});
