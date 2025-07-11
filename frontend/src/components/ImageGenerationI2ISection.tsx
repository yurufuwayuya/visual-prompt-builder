import React, { useState } from 'react';
import { Loader, Download, Sparkles, AlertCircle } from 'lucide-react';
import { usePromptStore } from '@/stores/promptStore';
import { useToastStore } from '@/stores/toastStore';
import { generateImage } from '@/services/imageGeneration';
import { Button } from '@/components/common/Button';

interface ImageGenerationI2ISectionProps {
  prompt: string;
}

export const ImageGenerationI2ISection: React.FC<ImageGenerationI2ISectionProps> = ({ prompt }) => {
  const { referenceImage } = usePromptStore();
  const { addToast } = useToastStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<
    'flux-fill' | 'flux-variations' | 'flux-canny'
  >('flux-variations');
  const [strength, setStrength] = useState(0.8);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    if (!referenceImage) {
      addToast({
        type: 'error',
        message: '参考画像がアップロードされていません',
      });
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await generateImage({
        prompt,
        referenceImage,
        model: selectedModel,
        strength,
      });

      if (result.success && result.image) {
        setGeneratedImage(result.image);
        addToast({
          type: 'success',
          message: result.cached ? 'キャッシュから画像を取得しました' : '画像を生成しました',
        });
      } else {
        setError(result.error || '画像生成に失敗しました');
        addToast({
          type: 'error',
          message: result.error || '画像生成に失敗しました',
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '画像生成中にエラーが発生しました';
      setError(errorMessage);
      addToast({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      message: '画像をダウンロードしました',
    });
  };

  if (!referenceImage) {
    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">AI画像生成（i2i）</h3>
        <div className="flex items-center gap-2 text-amber-600">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">参考画像をアップロードすると、AI画像生成が利用できます</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">AI画像生成（i2i）</h3>

      <div className="space-y-4">
        {/* 参考画像プレビュー */}
        <div>
          <p className="text-sm font-medium mb-2">参考画像</p>
          <img
            src={referenceImage}
            alt="参考画像"
            className="max-w-xs h-auto rounded border border-gray-300"
            style={{ maxHeight: '200px' }}
          />
        </div>

        {/* モデル選択 */}
        <div>
          <label htmlFor="model-select" className="block text-sm font-medium mb-2">
            生成モデル
          </label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={isGenerating}
          >
            <option value="flux-variations">FLUX Variations（画風変換）</option>
            <option value="flux-fill">FLUX Fill（部分修正）</option>
            <option value="flux-canny">FLUX Canny（輪郭保持）</option>
          </select>
        </div>

        {/* 強度調整 */}
        <div>
          <label htmlFor="strength-slider" className="block text-sm font-medium mb-2">
            変換強度: {strength}
          </label>
          <input
            id="strength-slider"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={strength}
            onChange={(e) => setStrength(parseFloat(e.target.value))}
            className="w-full"
            disabled={isGenerating}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>弱い（元画像に近い）</span>
            <span>強い（プロンプトに近い）</span>
          </div>
        </div>

        {/* 生成ボタン */}
        <Button onClick={handleGenerateImage} disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              画像を生成
            </>
          )}
        </Button>

        {/* エラー表示 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* 生成結果 */}
        {generatedImage && (
          <div className="space-y-3">
            <p className="text-sm font-medium">生成結果</p>
            <img
              src={generatedImage}
              alt="生成された画像"
              className="max-w-full h-auto rounded border border-gray-300"
              style={{ maxHeight: '400px' }}
            />
            <Button onClick={handleDownload} variant="secondary" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              画像をダウンロード
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
