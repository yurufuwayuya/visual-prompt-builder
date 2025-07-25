import React, { useState } from 'react';
import { Loader, Download, Sparkles, AlertCircle } from 'lucide-react';
import { usePromptStore } from '@/stores/promptStore';
import { useToastStore } from '@/stores/toastStore';
import { generateImage } from '@/services/imageGeneration';
import { Button } from '@/components/common/Button';
import { resizeImage, estimateFileSize } from '@/utils/imageResize';
import { optimizeImageForGeneration } from '@/utils/imageOptimizer';
import { CudaOomErrorDialog } from '@/components/common/CudaOomErrorDialog';
import { createSecureLogger } from '@/utils/secureLogger';

const logger = createSecureLogger({ prefix: 'ImageGenerationI2I' });

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
  const [strength, setStrength] = useState(0.5); // CUDA OOM対策でデフォルト値をさらに下げる
  const [error, setError] = useState<string | null>(null);
  const [showCudaOomDialog, setShowCudaOomDialog] = useState(false);
  const [, setCudaOomErrorDetails] = useState<
    | {
        modelUsed?: string;
        imageSize?: number;
        suggestions?: string[];
      }
    | undefined
  >();

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
      // CUDA OOM対策: スマートフォン画像を最適化
      addToast({
        type: 'info',
        message: '画像をAI生成用に最適化しています...',
      });

      let processedImage = referenceImage;

      try {
        // I2I用に画像を最適化
        const optimizationResult = await optimizeImageForGeneration(referenceImage, {
          targetUsage: 'i2i',
          onProgress: (stage, totalStages, currentSize) => {
            logger.info(`I2I最適化進捗: ステージ ${stage}/${totalStages}, サイズ: ${currentSize}`);
          },
        });

        processedImage = optimizationResult.optimizedImage;

        // 最適化結果の表示
        logger.info(
          `画像最適化: ${optimizationResult.originalSize} → ${optimizationResult.finalSize}`
        );

        // スマートフォン画像の場合は特別な警告
        if (optimizationResult.isSmartphoneImage) {
          addToast({
            type: 'success',
            message: `スマートフォン画像をGPUメモリ効率的なサイズに最適化しました`,
          });
        }

        // それでも大きすぎる場合は追加の警告
        const optimizedSize = estimateFileSize(processedImage);
        if (optimizedSize > 500_000) {
          addToast({
            type: 'warning',
            message: '画像がまだ大きいため、生成に失敗する可能性があります',
          });

          // モデルをより軽量なものに自動変更
          if (selectedModel === 'flux-fill' || selectedModel === 'flux-canny') {
            setSelectedModel('flux-variations');
            addToast({
              type: 'info',
              message: 'メモリ効率の良いFlux Variationsモデルに切り替えました',
            });
          }

          // 強度を下げる
          if (strength > 0.5) {
            setStrength(0.5);
          }
        }
      } catch (optimizationError) {
        logger.error('画像最適化エラー', optimizationError);

        // フォールバック: 単純なリサイズ
        try {
          processedImage = await resizeImage(referenceImage, 512, 512, 0.5);
          addToast({
            type: 'warning',
            message: '画像最適化に一部失敗しましたが、基本的なリサイズを適用しました',
          });
        } catch (fallbackError) {
          logger.error('フォールバックリサイズエラー', fallbackError);
          addToast({
            type: 'error',
            message: '画像の処理に失敗しました。より小さな画像を使用してください。',
          });
          setIsGenerating(false);
          return;
        }
      }
      const result = await generateImage({
        prompt,
        referenceImage: processedImage,
        model: selectedModel,
        strength,
      });

      if (result.success && result.image) {
        // Base64画像にdata URLプレフィックスを追加
        const imageDataUrl = result.image.startsWith('data:')
          ? result.image
          : `data:image/png;base64,${result.image}`;
        setGeneratedImage(imageDataUrl);
        addToast({
          type: 'success',
          message: result.cached ? 'キャッシュから画像を取得しました' : '画像を生成しました',
        });
      } else {
        // CUDA OOMエラーの特別処理
        if (
          result.error &&
          (result.error.includes('CUDA out of memory') ||
            result.error.includes('メモリが不足') ||
            result.error.includes('GPUメモリ'))
        ) {
          setCudaOomErrorDetails({
            modelUsed: selectedModel,
            imageSize: estimateFileSize(processedImage),
            suggestions: [
              '画像サイズを小さくしてください',
              'Flux Variationsモデルを使用してください',
              '変換強度を下げてください',
            ],
          });
          setShowCudaOomDialog(true);
        } else {
          setError(result.error || '画像生成に失敗しました');
          addToast({
            type: 'error',
            message: result.error || '画像生成に失敗しました',
          });
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '画像生成中にエラーが発生しました';

      // CUDA OOMエラーの特別処理
      if (errorMessage.includes('CUDA') || errorMessage.includes('メモリ')) {
        setCudaOomErrorDetails({
          modelUsed: selectedModel,
          imageSize: estimateFileSize(referenceImage),
        });
        setShowCudaOomDialog(true);
      } else {
        setError(errorMessage);
        addToast({
          type: 'error',
          message: errorMessage,
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    try {
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
    } catch (error) {
      logger.error('Download failed', error);
      addToast({
        type: 'error',
        message: 'ダウンロードに失敗しました',
      });
    }
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
            alt="AI画像生成の参考画像"
            className="max-w-xs h-auto rounded border border-gray-300 max-h-[200px]"
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
            onChange={(e) =>
              setSelectedModel(e.target.value as 'flux-fill' | 'flux-variations' | 'flux-canny')
            }
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
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={strength}
            aria-valuetext={`${strength} - ${strength < 0.5 ? '弱い（元画像に近い）' : '強い（プロンプトに近い）'}`}
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
              alt="AIによって生成された画像結果"
              className="max-w-full h-auto rounded border border-gray-300 max-h-[400px]"
            />
            <Button onClick={handleDownload} variant="secondary" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              画像をダウンロード
            </Button>
          </div>
        )}
      </div>

      {/* CUDA OOMエラーダイアログ */}
      <CudaOomErrorDialog
        isOpen={showCudaOomDialog}
        onClose={() => setShowCudaOomDialog(false)}
        onRetry={() => {
          setShowCudaOomDialog(false);
          setError(null);
          // モデルを軽量なものに変更
          setSelectedModel('flux-variations');
          setStrength(0.3);
          // 再試行
          handleGenerateImage();
        }}
      />
    </div>
  );
};
