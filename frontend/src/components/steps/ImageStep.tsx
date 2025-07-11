import { useState, useRef } from 'react';
import { usePromptStore } from '@/stores/promptStore';
import { useToastStore } from '@/stores/toastStore';
import { Button } from '@/components/common/Button';
import { Upload, X } from 'lucide-react';

export function ImageStep({ onNext }: { onNext: () => void }) {
  const { setReferenceImage } = usePromptStore();
  const { addToast } = useToastStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        type: 'error',
        message: 'ファイルサイズは5MB以下にしてください',
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
    try {
      // 画像をBase64に変換
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setSelectedImage(base64);
        setReferenceImage(base64);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('画像の読み込みに失敗しました:', error);
      addToast({
        type: 'error',
        message: '画像の読み込みに失敗しました',
      });
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
              <p className="text-xs text-gray-500 mt-2">PNG、JPG、GIF（最大5MB）</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <img
              src={selectedImage}
              alt="選択された画像"
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
