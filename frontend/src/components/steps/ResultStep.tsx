import { useState, useCallback } from 'react';
import { Copy, Download, Save, Sparkles } from 'lucide-react';
import { usePromptStore } from '@/stores/promptStore';
import { useToastStore } from '@/stores/toastStore';
import { Button } from '@/components/common/Button';

interface ResultStepProps {
  onNew: () => void;
}

export function ResultStep({ onNew }: ResultStepProps) {
  const { currentPrompt, setGeneratedPrompt, saveToHistory } = usePromptStore();
  const { addToast } = useToastStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setLocalGeneratedPrompt] = useState('');
  const [generatedPromptJa, setLocalGeneratedPromptJa] = useState('');
  const [negativePrompt, setLocalNegativePrompt] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  
  const MAX_RETRY_COUNT = 3;
  const RETRY_DELAYS = [1000, 2000, 4000]; // exponential backoff


  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const generatePrompt = useCallback(async (attemptCount = 0): Promise<void> => {
    // データ検証：カテゴリが選択されているか確認
    if (!currentPrompt.category || !currentPrompt.category.predefinedId) {
      setError('カテゴリが選択されていません。最初からやり直してください。');
      addToast({
        type: 'error',
        message: 'カテゴリが選択されていません',
      });
      return;
    }

    if (attemptCount === 0) {
      setIsGenerating(true);
      setError(null);
      setRetryCount(0);
    }

    try {
      const response = await fetch('http://localhost:8787/api/v1/prompt/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptData: {
            category: {
              predefinedId: currentPrompt.category.predefinedId,
              customText: currentPrompt.category.customText || null,
            },
            details: (currentPrompt.details || []).map((detail, index) => ({
              predefinedId: detail.predefinedId,
              customText: null,
              order: index,
            })),
            colors: (currentPrompt.colors || []).map(color => ({
              predefinedId: color.predefinedId,
              customText: null,
            })),
            style: currentPrompt.style ? {
              predefinedId: currentPrompt.style.predefinedId,
              customText: null,
            } : undefined,
            mood: currentPrompt.mood ? {
              predefinedId: currentPrompt.mood.predefinedId,
              customText: null,
            } : undefined,
            lighting: currentPrompt.lighting ? {
              predefinedId: currentPrompt.lighting.predefinedId,
              customText: null,
            } : undefined,
          },
          options: {
            language: 'ja',
            quality: 'high',
            includeNegativePrompt: true,
          },
        }),
      });

      if (!response.ok) {
        // 400番台のエラーはリトライしない（クライアントエラー）
        if (response.status >= 400 && response.status < 500) {
          const errorData = await response.json();
          throw new Error(errorData.error || `プロンプト生成に失敗しました (${response.status})`);
        }
        throw new Error(`プロンプト生成に失敗しました (${response.status})`);
      }

      const result = await response.json();
      const data = result.data;
      setLocalGeneratedPrompt(data.prompt);
      setLocalGeneratedPromptJa(data.prompt); // 日本語で生成されるため同じ値
      setLocalNegativePrompt(data.negativePrompt || '');
      setGeneratedPrompt(data.prompt, data.prompt, data.negativePrompt);
      setError(null);
      setRetryCount(0);
      setHasGenerated(true);
    } catch (error) {
      console.error(`Error generating prompt (attempt ${attemptCount + 1}):`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'プロンプト生成に失敗しました';
      
      // 400番台のエラーはリトライしない
      const isClientError = errorMessage.includes('(4') || errorMessage.includes('カテゴリ');
      
      if (attemptCount < MAX_RETRY_COUNT - 1 && !isClientError) {
        // リトライ（サーバーエラーの場合のみ）
        setRetryCount(attemptCount + 1);
        const delay = RETRY_DELAYS[attemptCount] || 1000;
        addToast({
          type: 'info',
          message: `接続エラーが発生しました。${delay / 1000}秒後に再試行します... (${attemptCount + 2}/${MAX_RETRY_COUNT})`,
        });
        await sleep(delay);
        return generatePrompt(attemptCount + 1);
      } else {
        // 最大リトライ回数に達したか、クライアントエラーの場合
        setError(errorMessage);
        addToast({
          type: 'error',
          message: isClientError ? errorMessage : `プロンプト生成に失敗しました。最大リトライ回数(${MAX_RETRY_COUNT}回)に達しました。`,
        });
        
        // エラー時はモックデータも生成しない
        setLocalGeneratedPrompt('');
        setLocalGeneratedPromptJa('');
        setLocalNegativePrompt('');
      }
    } finally {
      if (attemptCount === 0 || attemptCount >= MAX_RETRY_COUNT - 1) {
        setIsGenerating(false);
      }
    }
  }, [currentPrompt, setGeneratedPrompt, addToast]);

  // 削除: 自動生成をやめる
  // useEffect(() => {
  //   generatePrompt();
  // }, [generatePrompt]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast({
        type: 'success',
        message: `${label}をコピーしました`,
      });
    } catch {
      addToast({
        type: 'error',
        message: 'コピーに失敗しました',
      });
    }
  };

  const handleSave = () => {
    saveToHistory();
    addToast({
      type: 'success',
      message: '履歴に保存しました',
    });
  };

  const handleDownload = () => {
    const data = {
      prompt: generatedPrompt,
      promptJa: generatedPromptJa,
      negativePrompt,
      settings: currentPrompt,
      createdAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      message: 'ファイルをダウンロードしました',
    });
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-20" role="status" aria-live="polite">
        <Sparkles className="h-12 w-12 text-primary-600 animate-pulse mb-4" aria-hidden="true" />
        <p className="text-lg font-medium text-gray-900">
          プロンプトを生成中...
        </p>
        {retryCount > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            再試行中... ({retryCount + 1}/{MAX_RETRY_COUNT})
          </p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20" role="alert">
        <div className="text-red-600 mb-4">
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          プロンプト生成エラー
        </h3>
        <p className="text-sm text-gray-600 mb-4 text-center max-w-md">
          {error}
        </p>
        <Button onClick={() => generatePrompt()} variant="default">
          再試行
        </Button>
      </div>
    );
  }

  // 初期状態：生成ボタンを表示
  if (!hasGenerated && !isGenerating && !error) {
    // カテゴリが選択されていない場合のエラー表示
    if (!currentPrompt.category || !currentPrompt.category.predefinedId) {
      return (
        <div className="flex flex-col items-center justify-center py-20" role="alert">
          <div className="text-yellow-600 mb-4">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            カテゴリが選択されていません
          </h3>
          <p className="text-sm text-gray-600 mb-4 text-center max-w-md">
            プロンプトを生成するには、最初にカテゴリを選択してください。
          </p>
          <Button onClick={() => window.location.reload()} variant="default">
            最初からやり直す
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-20" role="region" aria-labelledby="generate-heading">
        <h2 id="generate-heading" className="text-xl font-medium text-gray-900 mb-4">
          プロンプトを生成する準備ができました
        </h2>
        <p className="text-gray-600 mb-8 text-center max-w-md">
          設定した内容を元に、AI画像生成用のプロンプトを作成します。
        </p>
        
        {/* 設定内容のプレビュー */}
        <div className="bg-gray-50 rounded-lg p-4 mb-8 w-full max-w-md">
          <h3 className="font-medium text-sm text-gray-900 mb-2">設定内容</h3>
          <dl className="text-sm space-y-1">
            <div>
              <dt className="inline font-medium text-gray-600">カテゴリ:</dt>
              <dd className="inline ml-2">{currentPrompt.category.displayName}</dd>
            </div>
            {currentPrompt.details && currentPrompt.details.length > 0 && (
              <div>
                <dt className="inline font-medium text-gray-600">詳細:</dt>
                <dd className="inline ml-2">{currentPrompt.details.map(d => d.displayName).join(', ')}</dd>
              </div>
            )}
            {currentPrompt.style && (
              <div>
                <dt className="inline font-medium text-gray-600">スタイル:</dt>
                <dd className="inline ml-2">{currentPrompt.style.displayName}</dd>
              </div>
            )}
            {currentPrompt.mood && (
              <div>
                <dt className="inline font-medium text-gray-600">雰囲気:</dt>
                <dd className="inline ml-2">{currentPrompt.mood.displayName}</dd>
              </div>
            )}
            {currentPrompt.lighting && (
              <div>
                <dt className="inline font-medium text-gray-600">照明:</dt>
                <dd className="inline ml-2">{currentPrompt.lighting.displayName}</dd>
              </div>
            )}
          </dl>
        </div>
        
        <Button onClick={() => generatePrompt()} size="lg" variant="default">
          <Sparkles className="h-5 w-5 mr-2" aria-hidden="true" />
          プロンプトを生成
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="region" aria-labelledby="result-heading">
      <h2 id="result-heading" className="sr-only">生成結果</h2>
      <p className="text-gray-600 mb-6">
        以下のプロンプトを画像生成AIで使用してください
      </p>

      {/* 英語プロンプト */}
      <div className="space-y-2" role="region" aria-label="英語プロンプト">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm sm:text-base text-gray-900" id="prompt-en">プロンプト（英語）</h3>
          <Button
            onClick={() => copyToClipboard(generatedPrompt, '英語プロンプト')}
            variant="ghost"
            size="sm"
            aria-label="英語プロンプトをコピー"
          >
            <Copy className="h-4 w-4 mr-1" aria-hidden="true" />
            コピー
          </Button>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4" aria-describedby="prompt-en">
          <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">
            {generatedPrompt}
          </p>
        </div>
      </div>

      {/* 日本語プロンプト */}
      <div className="space-y-2" role="region" aria-label="日本語プロンプト">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm sm:text-base text-gray-900" id="prompt-ja">プロンプト（日本語）</h3>
          <Button
            onClick={() => copyToClipboard(generatedPromptJa, '日本語プロンプト')}
            variant="ghost"
            size="sm"
            aria-label="日本語プロンプトをコピー"
          >
            <Copy className="h-4 w-4 mr-1" aria-hidden="true" />
            コピー
          </Button>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4" aria-describedby="prompt-ja">
          <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">
            {generatedPromptJa}
          </p>
        </div>
      </div>

      {/* ネガティブプロンプト */}
      {negativePrompt && (
        <div className="space-y-2" role="region" aria-label="ネガティブプロンプト">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm sm:text-base text-gray-900" id="negative-prompt">ネガティブプロンプト</h3>
            <Button
              onClick={() => copyToClipboard(negativePrompt, 'ネガティブプロンプト')}
              variant="ghost"
              size="sm"
              aria-label="ネガティブプロンプトをコピー"
            >
              <Copy className="h-4 w-4 mr-1" aria-hidden="true" />
              コピー
            </Button>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4" aria-describedby="negative-prompt">
            <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">
              {negativePrompt}
            </p>
          </div>
        </div>
      )}

      {/* 設定内容のサマリー */}
      <div className="bg-blue-50 rounded-lg p-3 sm:p-4" role="region" aria-label="設定内容">
        <h3 className="font-medium text-sm sm:text-base text-gray-900 mb-2" id="settings-summary">設定内容</h3>
        <dl className="text-xs sm:text-sm space-y-1">
          <div>
            <dt className="inline font-medium text-gray-600">カテゴリ:</dt>
            <dd className="inline ml-2">{currentPrompt.category?.displayName}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-gray-600">詳細:</dt>
            <dd className="inline ml-2">
              {(currentPrompt.details || [])
                .map(d => d.displayName)
                .join(', ')}
            </dd>
          </div>
          {currentPrompt.colors && currentPrompt.colors.length > 0 && (
            <div>
              <dt className="inline font-medium text-gray-600">色:</dt>
              <dd className="inline ml-2">
                {currentPrompt.colors.map(c => c.displayName).join(', ')}
              </dd>
            </div>
          )}
          {currentPrompt.style && (
            <div>
              <dt className="inline font-medium text-gray-600">スタイル:</dt>
              <dd className="inline ml-2">{currentPrompt.style.displayName}</dd>
            </div>
          )}
          {currentPrompt.mood && (
            <div>
              <dt className="inline font-medium text-gray-600">雰囲気:</dt>
              <dd className="inline ml-2">{currentPrompt.mood.displayName}</dd>
            </div>
          )}
          {currentPrompt.lighting && (
            <div>
              <dt className="inline font-medium text-gray-600">照明:</dt>
              <dd className="inline ml-2">{currentPrompt.lighting.displayName}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* アクションボタン */}
      <div className="flex flex-col xs:flex-row gap-3">
        <Button onClick={handleSave} variant="secondary" className="flex-1" aria-label="プロンプトを履歴に保存">
          <Save className="h-4 w-4 mr-2" aria-hidden="true" />
          履歴に保存
        </Button>
        <Button onClick={handleDownload} variant="secondary" className="flex-1" aria-label="プロンプトをJSONファイルとしてダウンロード">
          <Download className="h-4 w-4 mr-2" aria-hidden="true" />
          ダウンロード
        </Button>
      </div>

      <div className="flex justify-center pt-4 border-t">
        <Button onClick={onNew} size="lg">
          履歴に保存して終了
        </Button>
      </div>
    </div>
  );
}