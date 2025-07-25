import { useState, useRef } from 'react';
import { usePromptStore } from '@/stores/promptStore';
import { useToastStore } from '@/stores/toastStore';
import { Button } from '@/components/common/Button';
import { Upload, X } from 'lucide-react';
import {
  resizeImage,
  estimateFileSize,
  formatFileSize,
  getRecommendedSettings,
} from '@/utils/imageResize';
import { createSecureLogger } from '@/utils/secureLogger';

const logger = createSecureLogger({ prefix: 'ImageStep' });

export function ImageStep({ onNext }: { onNext: () => void }) {
  const { setReferenceImage } = usePromptStore();
  const { addToast } = useToastStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（最大20MB）
    if (file.size > 20 * 1024 * 1024) {
      addToast({
        type: 'error',
        message: 'ファイルサイズは20MB以下にしてください',
      });
      return;
    }

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      addToast({
        type: 'error',
        message: '画像ファイルを選択してください',
      });
      return;
    }

    setIsLoading(true);

    const reader = new FileReader();

    // エラーハンドリングとクリーンアップ
    const cleanup = () => {
      reader.onload = null;
      reader.onerror = null;
      reader.onabort = null;
    };

    reader.onload = async (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') {
          throw new Error('画像データの読み込みに失敗しました');
        }
        let base64 = result;

        // 画像サイズを推定して最適な設定を取得
        const fileSize = estimateFileSize(base64);
        const formattedSize = formatFileSize(fileSize);

        // 2MBを超える場合はリサイズ推奨
        if (fileSize > 2 * 1024 * 1024) {
          const settings = getRecommendedSettings(fileSize);
          addToast({
            type: 'info',
            message: `画像をリサイズしています... (元サイズ: ${formattedSize})`,
          });

          try {
            base64 = await resizeImage(
              base64,
              settings.maxWidth,
              settings.maxHeight,
              settings.quality
            );

            const newSize = estimateFileSize(base64);
            const newFormattedSize = formatFileSize(newSize);
            addToast({
              type: 'success',
              message: `画像をリサイズしました (${formattedSize} → ${newFormattedSize})`,
            });
          } catch (resizeError) {
            console.error('リサイズエラー:', resizeError);
            addToast({
              type: 'warning',
              message: 'リサイズに失敗しましたが、元の画像で続行します',
            });
          }
        }

        setSelectedImage(base64);
        setReferenceImage(base64);
        addToast({
          type: 'success',
          message: '画像をアップロードしました',
        });
      } catch (error) {
        logger.error('画像処理エラー', error);
        addToast({
          type: 'error',
          message: '画像の処理に失敗しました',
        });
      } finally {
        cleanup();
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      logger.error('FileReader error', new Error('Failed to read file'));
      addToast({
        type: 'error',
        message: '画像の読み込みに失敗しました',
      });
      cleanup();
      setIsLoading(false);
    };

    reader.onabort = () => {
      cleanup();
      setIsLoading(false);
    };

    try {
      reader.readAsDataURL(file);
    } catch (error) {
      logger.error('画像の読み込みに失敗しました', error);
      addToast({
        type: 'error',
        message: '画像の読み込みに失敗しました',
      });
      cleanup();
      setIsLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setReferenceImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSkip = () => {
    // 画像なしで次へ進む
    setReferenceImage(null);
    onNext();
  };

  const handleNext = () => {
    if (selectedImage) {
      onNext();
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">参考画像をアップロード（オプション）</h2>
        <p className="text-gray-600 text-sm">
          画像を元にプロンプトを生成できます。スキップして文字だけで生成することもできます。
        </p>
      </div>

      <div className="space-y-6">
        {!selectedImage ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                    画像を選択
                  </span>
                  <input
                    id="file-upload"
                    ref={fileInputRef}
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={isLoading}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                PNG、JPG、WEBP（最大20MB、2MB以上は自動リサイズ）
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <img
              src={selectedImage}
              alt="アップロードされた参考画像のプレビュー"
              className="max-w-full h-auto rounded-lg shadow-lg max-h-[400px] mx-auto block"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-3 bg-red-500 text-white rounded-full hover:bg-red-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="画像を削除"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleSkip}>
            スキップ
          </Button>
          <Button onClick={handleNext} disabled={!selectedImage || isLoading}>
            {isLoading ? '読み込み中...' : '次へ'}
          </Button>
        </div>
      </div>
    </div>
  );
}
