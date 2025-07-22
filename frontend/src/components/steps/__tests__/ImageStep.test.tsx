import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageStep } from '../ImageStep';
import { usePromptStore } from '@/stores/promptStore';
import { useToastStore } from '@/stores/toastStore';

// モックの設定
vi.mock('@/stores/promptStore');
vi.mock('@/stores/toastStore');
vi.mock('@/services/imageGeneration', () => ({
  validateImageSize: vi.fn((base64: string, _maxSize: number) => base64.length < 1000),
  resizeImage: vi.fn((base64: string) => Promise.resolve(base64 + '_resized')),
}));

describe('ImageStep', () => {
  const mockSetReferenceImage = vi.fn();
  const mockAddToast = vi.fn();
  const mockOnNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (usePromptStore as any).mockReturnValue({
      setReferenceImage: mockSetReferenceImage,
    });
    (useToastStore as any).mockReturnValue({
      addToast: mockAddToast,
    });
  });

  it('初期状態で画像アップロードUIが表示される', () => {
    render(<ImageStep onNext={mockOnNext} />);

    expect(screen.getByText('参考画像をアップロード（オプション）')).toBeInTheDocument();
    expect(screen.getByText('画像を選択')).toBeInTheDocument();
    expect(screen.getByText('スキップ')).toBeInTheDocument();
  });

  it('スキップボタンをクリックすると画像なしで次へ進む', () => {
    render(<ImageStep onNext={mockOnNext} />);

    const skipButton = screen.getByText('スキップ');
    fireEvent.click(skipButton);

    expect(mockSetReferenceImage).toHaveBeenCalledWith(null);
    expect(mockOnNext).toHaveBeenCalled();
  });

  it('大きすぎるファイルを選択するとエラーが表示される', async () => {
    render(<ImageStep onNext={mockOnNext} />);

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 }); // 6MB

    const input = screen.getByLabelText('画像を選択').closest('input') as HTMLInputElement;
    await userEvent.upload(input, file);

    expect(mockAddToast).toHaveBeenCalledWith({
      type: 'error',
      message: 'ファイルサイズは5MB以下にしてください',
    });
  });

  it.skip('画像以外のファイルを選択するとエラーが表示される', async () => {
    render(<ImageStep onNext={mockOnNext} />);

    const file = new File([''], 'test.txt', { type: 'text/plain' });

    const input = screen.getByLabelText('画像を選択').closest('input') as HTMLInputElement;
    await userEvent.upload(input, file);

    expect(mockAddToast).toHaveBeenCalledWith({
      type: 'error',
      message: '画像ファイルを選択してください',
    });
  });

  it('有効な画像ファイルを選択すると画像が表示される', async () => {
    render(<ImageStep onNext={mockOnNext} />);

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 }); // 1KB

    // FileReaderのモック
    const mockReadAsDataURL = vi.fn();
    const mockFileReader = {
      readAsDataURL: mockReadAsDataURL,
      onload: null as any,
      onerror: null as any,
      result: 'data:image/jpeg;base64,test',
    };

    global.FileReader = vi.fn(() => mockFileReader) as any;

    const input = screen.getByLabelText('画像を選択').closest('input') as HTMLInputElement;
    await userEvent.upload(input, file);

    // FileReaderのonloadを手動で呼び出す
    await waitFor(() => {
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,test' } });
      }
    });

    await waitFor(() => {
      expect(screen.getByAltText('アップロードされた参考画像のプレビュー')).toBeInTheDocument();
      expect(mockSetReferenceImage).toHaveBeenCalledWith('data:image/jpeg;base64,test');
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'success',
        message: '画像をアップロードしました',
      });
    });
  });

  it('画像を削除できる', async () => {
    render(<ImageStep onNext={mockOnNext} />);

    // まず画像をアップロード
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });

    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      onerror: null as any,
      result: 'data:image/jpeg;base64,test',
    };

    global.FileReader = vi.fn(() => mockFileReader) as any;

    const input = screen.getByLabelText('画像を選択').closest('input') as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,test' } });
      }
    });

    // 削除ボタンをクリック
    const deleteButton = await screen.findByLabelText('画像を削除');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockSetReferenceImage).toHaveBeenLastCalledWith(null);
      expect(screen.getByText('画像を選択')).toBeInTheDocument();
    });
  });

  it('画像を選択した後、次へボタンが有効になる', async () => {
    render(<ImageStep onNext={mockOnNext} />);

    const nextButton = screen.getByText('次へ');
    expect(nextButton).toBeDisabled();

    // 画像をアップロード
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });

    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      onerror: null as any,
      result: 'data:image/jpeg;base64,test',
    };

    global.FileReader = vi.fn(() => mockFileReader) as any;

    const input = screen.getByLabelText('画像を選択').closest('input') as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,test' } });
      }
    });

    await waitFor(() => {
      expect(nextButton).not.toBeDisabled();
    });

    fireEvent.click(nextButton);
    expect(mockOnNext).toHaveBeenCalled();
  });
});
