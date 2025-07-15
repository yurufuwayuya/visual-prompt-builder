import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageGenerationI2ISection } from '../ImageGenerationI2ISection';
import * as imageGenerationService from '../../services/imageGeneration';

// Mock dependencies
vi.mock('../../services/imageGeneration');

describe('ImageGenerationI2ISection', () => {
  const mockProps = {
    prompt: 'A beautiful landscape',
    uploadedImage: 'data:image/png;base64,iVBORw0KGgo...',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正しくレンダリングされる', () => {
    render(<ImageGenerationI2ISection {...mockProps} />);

    expect(screen.getByText('AI画像生成 (Image-to-Image)')).toBeInTheDocument();
    expect(screen.getByText('画像を生成')).toBeInTheDocument();
    expect(screen.getByLabelText('モデル')).toBeInTheDocument();
    expect(screen.getByLabelText('変換強度')).toBeInTheDocument();
  });

  it('画像がない場合は生成ボタンが無効になる', () => {
    render(<ImageGenerationI2ISection {...mockProps} uploadedImage={null} />);

    const generateButton = screen.getByText('画像を生成');
    expect(generateButton).toBeDisabled();
  });

  it('プロンプトがない場合は生成ボタンが無効になる', () => {
    render(<ImageGenerationI2ISection {...mockProps} prompt="" />);

    const generateButton = screen.getByText('画像を生成');
    expect(generateButton).toBeDisabled();
  });

  it('モデルを選択できる', () => {
    render(<ImageGenerationI2ISection {...mockProps} />);

    const modelSelect = screen.getByLabelText('モデル') as HTMLSelectElement;
    fireEvent.change(modelSelect, { target: { value: 'fill' } });

    expect(modelSelect.value).toBe('fill');
  });

  it('変換強度を調整できる', () => {
    render(<ImageGenerationI2ISection {...mockProps} />);

    const strengthRange = screen.getByLabelText('変換強度') as HTMLInputElement;
    fireEvent.change(strengthRange, { target: { value: '0.5' } });

    expect(strengthRange.value).toBe('0.5');
    expect(screen.getByText('0.5')).toBeInTheDocument();
  });

  it('画像生成が成功する', async () => {
    const mockGeneratedImage = 'data:image/png;base64,generated...';
    vi.mocked(imageGenerationService.generateImage).mockResolvedValue({
      success: true,
      image: mockGeneratedImage,
      error: undefined,
      cached: false,
    });

    render(<ImageGenerationI2ISection {...mockProps} />);

    const generateButton = screen.getByText('画像を生成');
    fireEvent.click(generateButton);

    expect(screen.getByText('生成中...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('生成中...')).not.toBeInTheDocument();
      expect(screen.getByAltText('生成された画像')).toHaveAttribute('src', mockGeneratedImage);
      expect(screen.getByText('ダウンロード')).toBeInTheDocument();
    });

    expect(imageGenerationService.generateImage).toHaveBeenCalledWith({
      referenceImage: mockProps.uploadedImage,
      prompt: mockProps.prompt,
      model: 'variations',
      strength: 0.7,
    });
  });

  it('画像生成が失敗する', async () => {
    const mockError = 'API key not found';
    vi.mocked(imageGenerationService.generateImage).mockResolvedValue({
      success: false,
      image: undefined,
      error: mockError,
      cached: false,
    });

    render(<ImageGenerationI2ISection {...mockProps} />);

    const generateButton = screen.getByText('画像を生成');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(mockError)).toBeInTheDocument();
      expect(screen.queryByAltText('生成された画像')).not.toBeInTheDocument();
    });
  });

  it('生成された画像をダウンロードできる', async () => {
    const mockGeneratedImage = 'data:image/png;base64,generated...';
    vi.mocked(imageGenerationService.generateImage).mockResolvedValue({
      success: true,
      image: mockGeneratedImage,
      error: undefined,
      cached: false,
    });

    // ダウンロード関数をモック
    const mockCreateElement = vi.fn();
    const mockClick = vi.fn();
    const mockLink = {
      href: '',
      download: '',
      click: mockClick,
    };

    document.createElement = mockCreateElement;
    mockCreateElement.mockReturnValue(mockLink);

    render(<ImageGenerationI2ISection {...mockProps} />);

    const generateButton = screen.getByText('画像を生成');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('ダウンロード')).toBeInTheDocument();
    });

    const downloadButton = screen.getByText('ダウンロード');
    fireEvent.click(downloadButton);

    expect(mockLink.href).toBe(mockGeneratedImage);
    expect(mockLink.download).toMatch(/generated-image-\d+\.png/);
    expect(mockClick).toHaveBeenCalled();
  });

  it('生成中は再度生成ボタンを押せない', async () => {
    vi.mocked(imageGenerationService.generateImage).mockImplementation(
      () => new Promise(() => {}) // 永続的にpending状態
    );

    render(<ImageGenerationI2ISection {...mockProps} />);

    const generateButton = screen.getByText('画像を生成');
    fireEvent.click(generateButton);

    expect(screen.getByText('生成中...')).toBeInTheDocument();
    expect(generateButton).toBeDisabled();
  });

  it('エラーメッセージがクリアされる', async () => {
    const mockError = 'API key not found';
    vi.mocked(imageGenerationService.generateImage).mockResolvedValue({
      success: false,
      image: undefined,
      error: mockError,
      cached: false,
    });

    render(<ImageGenerationI2ISection {...mockProps} />);

    const generateButton = screen.getByText('画像を生成');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(mockError)).toBeInTheDocument();
    });

    // モデルを変更することでエラーがクリアされる
    const modelSelect = screen.getByLabelText('モデル');
    fireEvent.change(modelSelect, { target: { value: 'fill' } });

    expect(screen.queryByText(mockError)).not.toBeInTheDocument();
  });
});
