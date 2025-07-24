import React, { useState } from 'react';
import { Upload, Loader, Download, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useToastStore } from '@/stores/toastStore';
import { generateImage, validateImageSize, resizeImage } from '@/services/imageGeneration';

export const ImageToImage: React.FC = () => {
  const { addToast } = useToastStore();
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<
    'flux-fill' | 'flux-variations' | 'flux-canny'
  >('flux-variations');
  const [strength, setStrength] = useState(0.8);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Enhanced file validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      addToast({
        type: 'error',
        message: 'ファイルサイズは5MB以下にしてください',
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      addToast({
        type: 'error',
        message: '画像ファイルを選択してください',
      });
      return;
    }

    // Additional supported format validation
    const supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!supportedFormats.includes(file.type)) {
      addToast({
        type: 'error',
        message: '対応形式: JPG, PNG, GIF, WebP',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let base64 = e.target?.result as string;
        if (!base64) {
          throw new Error('画像データの読み込みに失敗しました');
        }

        // 画像サイズをチェックし、必要に応じてリサイズ
        // Replicateのメモリ制限を考慮して、より小さいサイズにリサイズ
        if (!validateImageSize(base64, 3)) {
          addToast({
            type: 'info',
            message: '画像をリサイズしています...',
          });
          // 最大2048x2048、品質0.8でリサイズ（メモリ使用量を削減）
          base64 = await resizeImage(base64, 2048, 2048, 0.8);
        }

        setReferenceImage(base64);
        setGeneratedImage(null);
        setError(null);
        addToast({
          type: 'success',
          message: '画像をアップロードしました',
        });
      } catch (error) {
        console.error('画像処理エラー:', error);
        addToast({
          type: 'error',
          message: '画像の処理に失敗しました',
        });
      }
    };
    reader.onerror = () => {
      addToast({
        type: 'error',
        message: 'ファイルの読み込みに失敗しました',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateImage = async () => {
    if (!referenceImage) {
      addToast({
        type: 'error',
        message: '参考画像をアップロードしてください',
      });
      return;
    }

    if (!prompt.trim()) {
      addToast({
        type: 'error',
        message: 'プロンプトを入力してください',
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
        const imageDataUrl = result.image.startsWith('data:')
          ? result.image
          : `data:image/png;base64,${result.image}`;
        setGeneratedImage(imageDataUrl);
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

  const handleReset = () => {
    setReferenceImage(null);
    setGeneratedImage(null);
    setPrompt('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Image-to-Image 生成</h1>
          <p className="text-gray-600 mb-8">参考画像とプロンプトを使って、新しい画像を生成します</p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 左側: 入力エリア */}
            <div className="space-y-6">
              {/* 画像アップロード */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-4">参考画像</h2>

                {!referenceImage ? (
                  <label className="block" htmlFor="image-upload">
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      aria-describedby="upload-help"
                    />
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
                      role="button"
                      tabIndex={0}
                      aria-label="画像をアップロード"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          document.getElementById('image-upload')?.click();
                        }
                      }}
                    >
                      <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm text-gray-600">クリックして画像をアップロード</p>
                      <p id="upload-help" className="text-xs text-gray-500 mt-2">
                        対応形式: JPG, PNG, GIF, WebP（最大5MB）
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="space-y-4">
                    <img
                      src={referenceImage}
                      alt="参考画像"
                      className="w-full h-auto rounded-lg border border-gray-300"
                      style={{ maxHeight: '300px', objectFit: 'contain' }}
                    />
                    <Button onClick={handleReset} variant="secondary" className="w-full">
                      画像を変更
                    </Button>
                  </div>
                )}
              </div>

              {/* プロンプト入力 */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-4">プロンプト</h2>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="生成したい画像の説明を入力してください..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-describedby="prompt-help"
                  aria-label="プロンプト入力"
                  maxLength={500}
                  disabled={isGenerating}
                />
                <div id="prompt-help" className="text-xs text-gray-500 mt-1">
                  {500 - prompt.length} 文字残り
                </div>
              </div>

              {/* 設定 */}
              <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
                <h2 className="text-lg font-semibold mb-4">生成設定</h2>

                {/* モデル選択 */}
                <div>
                  <label htmlFor="model-select" className="block text-sm font-medium mb-2">
                    生成モデル
                  </label>
                  <select
                    id="model-select"
                    value={selectedModel}
                    onChange={(e) =>
                      setSelectedModel(
                        e.target.value as 'flux-variations' | 'flux-fill' | 'flux-canny'
                      )
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
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>弱い（元画像に近い）</span>
                    <span>強い（プロンプトに近い）</span>
                  </div>
                </div>
              </div>

              {/* 生成ボタン */}
              <Button
                onClick={handleGenerateImage}
                disabled={isGenerating || !referenceImage || !prompt.trim()}
                className="w-full"
              >
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
            </div>

            {/* 右側: 結果エリア */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">生成結果</h2>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {!generatedImage && !error && (
                <div className="flex items-center justify-center h-96 text-gray-400">
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-3" />
                    <p className="text-sm">生成された画像がここに表示されます</p>
                  </div>
                </div>
              )}

              {generatedImage && (
                <div className="space-y-4">
                  <img
                    src={generatedImage}
                    alt="生成された画像"
                    className="w-full h-auto rounded-lg border border-gray-300"
                    style={{ maxHeight: '500px', objectFit: 'contain' }}
                  />
                  <Button onClick={handleDownload} variant="secondary" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    画像をダウンロード
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
