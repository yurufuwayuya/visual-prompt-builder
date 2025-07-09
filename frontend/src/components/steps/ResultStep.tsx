import { useState, useCallback, useEffect } from 'react';
import { Copy, Save, Sparkles } from 'lucide-react';
import { usePromptStore } from '@/stores/promptStore';
import { useToastStore } from '@/stores/toastStore';
import { Button } from '@/components/common/Button';
import { API_ENDPOINTS } from '@/config/api';
import { ImageGenerationSection } from '../ImageGenerationSection';

interface ResultStepProps {
  onNew: () => void;
}

export function ResultStep({ onNew }: ResultStepProps) {
  const { currentPrompt, setGeneratedPrompt, saveToHistory } = usePromptStore();
  const { addToast } = useToastStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setLocalGeneratedPrompt] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const MAX_RETRY_COUNT = 3;
  const RETRY_DELAYS = [1000, 2000, 4000]; // exponential backoff

  // プロンプトストアがリセットされた時にローカルステートもリセット
  useEffect(() => {
    if (!currentPrompt.generatedPrompt && !currentPrompt.generatedPromptJa) {
      setLocalGeneratedPrompt('');
      setHasGenerated(false);
      setError(null);
      setRetryCount(0);
    }
  }, [currentPrompt.generatedPrompt, currentPrompt.generatedPromptJa]);

  // ステップ2,3の内容が変更された時にhasGeneratedをリセット
  useEffect(() => {
    // カテゴリ以外の要素が変更された場合、再生成を許可
    setHasGenerated(false);
  }, [
    currentPrompt.details,
    currentPrompt.colors,
    currentPrompt.style,
    currentPrompt.mood,
    currentPrompt.lighting,
  ]);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // 日本語文字を含むかチェックする関数
  const containsJapanese = (text: string): boolean => {
    // ひらがな、カタカナ、漢字の正規表現
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
  };

  // テキストを翻訳する関数
  const translateText = async (text: string): Promise<string> => {
    try {
      // デバッグ情報
      // if (process.env.NODE_ENV === 'development') {
      //   console.log('Translating text:', text);
      // }

      const response = await fetch(API_ENDPOINTS.translatePrompt, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          sourceLang: 'ja', // from → sourceLang に修正
          targetLang: 'en', // to → targetLang に修正
        }),
      });

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch {
          // テスト環境などでtext()が使えない場合
          errorText = 'Response text not available';
        }
        console.error('Translation API error:', response.status, errorText);
        // エラーをトーストで表示
        addToast({
          type: 'warning',
          message: `翻訳APIエラー: ${response.status}`,
        });
        return text; // 翻訳に失敗した場合は元のテキストを返す
      }

      const result = await response.json();
      const translatedText = result.data?.translatedText || result.translatedText || text;

      // デバッグ情報
      // if (process.env.NODE_ENV === 'development') {
      //   console.log('Translation result:', translatedText);
      // }

      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // エラーが発生した場合は元のテキストを返す
    }
  };

  const generatePrompt = useCallback(
    async (attemptCount = 0): Promise<void> => {
      // データ検証：カテゴリが選択されているか確認
      if (!currentPrompt.category || !currentPrompt.category.predefinedId) {
        return;
      }

      // デバッグ情報は開発環境でのみ出力
      // if (process.env.NODE_ENV === 'development') {
      //   console.log('Current Prompt State:', currentPrompt);
      // }

      if (attemptCount === 0) {
        setIsGenerating(true);
        setError(null);
        setRetryCount(0);
      }

      try {
        // カスタムテキストの翻訳処理
        const translateCustomText = async (item: { predefinedId?: string; name?: string }) => {
          if (
            item?.predefinedId?.startsWith('custom-') &&
            item?.name &&
            containsJapanese(item.name)
          ) {
            // デバッグ情報
            // if (process.env.NODE_ENV === 'development') {
            //   console.log('Translating custom text:', item.name);
            // }
            const translated = await translateText(item.name);
            // if (process.env.NODE_ENV === 'development') {
            //   console.log('Translated result:', translated);
            // }
            return translated;
          }
          return item?.name || null;
        };

        // カテゴリのカスタムテキストを翻訳
        let categoryCustomText = null;
        if (currentPrompt.category.predefinedId?.startsWith('custom-')) {
          categoryCustomText = await translateCustomText(currentPrompt.category);
        }

        // 詳細のカスタムテキストを翻訳
        const translatedDetails = await Promise.all(
          (currentPrompt.details || []).map(async (detail) => {
            const customText = await translateCustomText(detail);
            return {
              ...detail,
              translatedCustomText: customText,
            };
          })
        );

        // 色のカスタムテキストを翻訳
        const translatedColors = await Promise.all(
          (currentPrompt.colors || []).map(async (color) => {
            const customText = await translateCustomText(color);
            return {
              ...color,
              translatedCustomText: customText,
            };
          })
        );

        // スタイルのカスタムテキストを翻訳
        let styleCustomText = null;
        if (currentPrompt.style?.predefinedId?.startsWith('custom-')) {
          styleCustomText = await translateCustomText(currentPrompt.style);
        }

        // 雰囲気のカスタムテキストを翻訳
        let moodCustomText = null;
        if (currentPrompt.mood?.predefinedId?.startsWith('custom-')) {
          moodCustomText = await translateCustomText(currentPrompt.mood);
        }

        // 照明のカスタムテキストを翻訳
        let lightingCustomText = null;
        if (currentPrompt.lighting?.predefinedId?.startsWith('custom-')) {
          lightingCustomText = await translateCustomText(currentPrompt.lighting);
        }

        // デバッグ: 翻訳結果を確認
        // if (process.env.NODE_ENV === 'development') {
        //   console.log('Translation results:', {
        //     categoryCustomText,
        //     styleCustomText,
        //     moodCustomText,
        //     lightingCustomText,
        //     detailsCount: translatedDetails.length,
        //     colorsCount: translatedColors.length,
        //   });
        // }

        const requestBody = {
          promptData: {
            category: {
              predefinedId: currentPrompt.category.predefinedId?.startsWith('custom-')
                ? null
                : currentPrompt.category.predefinedId,
              customText: currentPrompt.category.predefinedId?.startsWith('custom-')
                ? categoryCustomText
                : currentPrompt.category.customText || null,
            },
            details: translatedDetails.map((detail, index) => ({
              predefinedId: detail.predefinedId?.startsWith('custom-') ? null : detail.predefinedId,
              customText: detail.predefinedId?.startsWith('custom-')
                ? detail.translatedCustomText
                : detail.customText || null,
              order: index,
            })),
            colors: translatedColors.map((color) => ({
              predefinedId: color.predefinedId?.startsWith('custom-') ? null : color.predefinedId,
              customText: color.predefinedId?.startsWith('custom-')
                ? color.translatedCustomText
                : color.customText || null,
            })),
            style: currentPrompt.style
              ? {
                  predefinedId: currentPrompt.style.predefinedId?.startsWith('custom-')
                    ? null
                    : currentPrompt.style.predefinedId,
                  customText: currentPrompt.style.predefinedId?.startsWith('custom-')
                    ? styleCustomText
                    : currentPrompt.style.customText || null,
                }
              : undefined,
            mood: currentPrompt.mood
              ? {
                  predefinedId: currentPrompt.mood.predefinedId?.startsWith('custom-')
                    ? null
                    : currentPrompt.mood.predefinedId,
                  customText: currentPrompt.mood.predefinedId?.startsWith('custom-')
                    ? moodCustomText
                    : currentPrompt.mood.customText || null,
                }
              : undefined,
            lighting: currentPrompt.lighting
              ? {
                  predefinedId: currentPrompt.lighting.predefinedId?.startsWith('custom-')
                    ? null
                    : currentPrompt.lighting.predefinedId,
                  customText: currentPrompt.lighting.predefinedId?.startsWith('custom-')
                    ? lightingCustomText
                    : currentPrompt.lighting.customText || null,
                }
              : undefined,
          },
          options: {
            language: 'en',
            quality: 'high',
          },
        };

        // デバッグ情報は開発環境でのみ出力
        // if (process.env.NODE_ENV === 'development') {
        //   console.log('API Request Body:', requestBody);
        // }

        const response = await fetch(API_ENDPOINTS.generatePrompt, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
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
        // デバッグ情報は開発環境でのみ出力
        // if (process.env.NODE_ENV === 'development') {
        //   console.log('API Response:', result);
        // }
        const data = result.data;
        setLocalGeneratedPrompt(data.prompt);
        // 日本語プロンプトは使用しない
        setGeneratedPrompt(data.prompt, '');
        setError(null);
        setRetryCount(0);
        setHasGenerated(true);
      } catch (error) {
        console.error(`Error generating prompt (attempt ${attemptCount + 1}):`, error);

        let errorMessage = 'プロンプト生成に失敗しました';
        let isConnectionError = false;

        if (error instanceof Error) {
          errorMessage = error.message;
          // ネットワークエラーの判定
          isConnectionError =
            error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError') ||
            error.message.includes('ERR_NETWORK');
        }

        // APIサーバー未起動の可能性を示唆するメッセージ
        if (isConnectionError) {
          errorMessage =
            'APIサーバーに接続できません。APIサーバーが起動していることを確認してください。\n\n開発時は npm run dev:all または別ターミナルで npm run dev:worker を実行してください。';
        }

        // 400番台のエラーはリトライしない
        const isClientError = errorMessage.includes('(4') || errorMessage.includes('カテゴリ');

        if (attemptCount < MAX_RETRY_COUNT - 1 && !isClientError && !isConnectionError) {
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
            message:
              isClientError || isConnectionError
                ? errorMessage
                : `プロンプト生成に失敗しました。最大リトライ回数(${MAX_RETRY_COUNT}回)に達しました。`,
          });

          // エラー時はモックデータも生成しない
          setLocalGeneratedPrompt('');
        }
      } finally {
        if (attemptCount === 0 || attemptCount >= MAX_RETRY_COUNT - 1) {
          setIsGenerating(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentPrompt, setGeneratedPrompt, addToast]
  );

  // コンポーネントマウント時に自動的にプロンプトを生成
  useEffect(() => {
    // カテゴリが選択されていて、まだ生成されていない場合に自動生成
    const hasSelectedCategory =
      currentPrompt.category &&
      (currentPrompt.category.predefinedId || currentPrompt.category.customText);

    if (hasSelectedCategory && !hasGenerated && !isGenerating && !error) {
      generatePrompt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPrompt.category,
    currentPrompt.details,
    currentPrompt.colors,
    currentPrompt.style,
    currentPrompt.mood,
    currentPrompt.lighting,
    hasGenerated,
    isGenerating,
    error,
  ]); // generatePromptは除外（無限ループ防止）

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

  const handleSave = async () => {
    // プロンプトをコピー
    const fullPrompt = generatedPrompt;
    try {
      await navigator.clipboard.writeText(fullPrompt);
      // 履歴に保存
      saveToHistory();
      addToast({
        type: 'success',
        message: 'コピーして履歴に保存しました',
      });
    } catch {
      // コピーに失敗しても履歴には保存
      saveToHistory();
      addToast({
        type: 'warning',
        message: 'コピーに失敗しましたが、履歴には保存しました',
      });
    }
  };

  if (isGenerating) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20"
        role="status"
        aria-live="polite"
      >
        <Sparkles className="h-12 w-12 text-primary-600 animate-pulse mb-4" aria-hidden="true" />
        <p className="text-lg font-medium text-gray-900">プロンプトを生成中...</p>
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">プロンプト生成エラー</h3>
        <p className="text-sm text-gray-600 mb-4 text-center max-w-md whitespace-pre-line">
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
    // カテゴリが選択されていない場合は何も表示しない
    if (!currentPrompt.category || !currentPrompt.category.predefinedId) {
      return null;
    }

    return (
      <div
        className="flex flex-col items-center justify-center py-20"
        role="region"
        aria-labelledby="generate-heading"
      >
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
              <dd className="inline ml-2">{currentPrompt.category.name}</dd>
            </div>
            {currentPrompt.details && currentPrompt.details.length > 0 && (
              <div>
                <dt className="inline font-medium text-gray-600">詳細:</dt>
                <dd className="inline ml-2">
                  {currentPrompt.details.map((d) => d.name).join(', ')}
                </dd>
              </div>
            )}
            {currentPrompt.style && (
              <div>
                <dt className="inline font-medium text-gray-600">スタイル:</dt>
                <dd className="inline ml-2">{currentPrompt.style.name}</dd>
              </div>
            )}
            {currentPrompt.mood && (
              <div>
                <dt className="inline font-medium text-gray-600">雰囲気:</dt>
                <dd className="inline ml-2">{currentPrompt.mood.name}</dd>
              </div>
            )}
            {currentPrompt.lighting && (
              <div>
                <dt className="inline font-medium text-gray-600">照明:</dt>
                <dd className="inline ml-2">{currentPrompt.lighting.name}</dd>
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
      <h2 id="result-heading" className="sr-only">
        生成結果
      </h2>
      <p className="text-gray-600 mb-6 xl:text-lg">
        以下のプロンプトを画像生成AIで使用してください
      </p>

      {/* 統合プロンプト表示 */}
      <div className="space-y-2" role="region" aria-label="生成プロンプト">
        <div className="flex items-center justify-between">
          <h3
            className="font-medium text-sm sm:text-base xl:text-lg text-gray-900"
            id="generated-prompt"
          >
            生成されたプロンプト
          </h3>
          <Button
            onClick={() => {
              copyToClipboard(generatedPrompt, 'プロンプト');
            }}
            variant="ghost"
            size="sm"
            aria-label="プロンプトをコピー"
          >
            <Copy className="h-4 w-4 mr-1" aria-hidden="true" />
            コピー
          </Button>
        </div>
        <div
          className="bg-gray-50 rounded-lg p-3 sm:p-4 xl:p-6 max-w-4xl mx-auto"
          aria-describedby="generated-prompt"
        >
          <p className="text-xs sm:text-sm xl:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
            {generatedPrompt}
          </p>
        </div>
      </div>

      {/* 設定内容のサマリー */}
      <div
        className="bg-blue-50 rounded-lg p-3 sm:p-4 xl:p-6 max-w-4xl mx-auto"
        role="region"
        aria-label="設定内容"
      >
        <h3
          className="font-medium text-sm sm:text-base xl:text-lg text-gray-900 mb-2"
          id="settings-summary"
        >
          設定内容
        </h3>
        <dl className="text-xs sm:text-sm xl:text-base space-y-1">
          <div>
            <dt className="inline font-medium text-gray-600">カテゴリ:</dt>
            <dd className="inline ml-2">{currentPrompt.category?.name}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-gray-600">詳細:</dt>
            <dd className="inline ml-2">
              {(currentPrompt.details || []).map((d) => d.name).join(', ')}
            </dd>
          </div>
          {currentPrompt.colors && currentPrompt.colors.length > 0 && (
            <div>
              <dt className="inline font-medium text-gray-600">色:</dt>
              <dd className="inline ml-2">{currentPrompt.colors.map((c) => c.name).join(', ')}</dd>
            </div>
          )}
          {currentPrompt.style && (
            <div>
              <dt className="inline font-medium text-gray-600">スタイル:</dt>
              <dd className="inline ml-2">{currentPrompt.style.name}</dd>
            </div>
          )}
          {currentPrompt.mood && (
            <div>
              <dt className="inline font-medium text-gray-600">雰囲気:</dt>
              <dd className="inline ml-2">{currentPrompt.mood.name}</dd>
            </div>
          )}
          {currentPrompt.lighting && (
            <div>
              <dt className="inline font-medium text-gray-600">照明:</dt>
              <dd className="inline ml-2">{currentPrompt.lighting.name}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* 画像生成セクション */}
      <ImageGenerationSection prompt={generatedPrompt} />

      {/* アクションボタン */}
      <div className="flex justify-center">
        <Button onClick={handleSave} variant="secondary" aria-label="コピーして履歴に保存">
          <Save className="h-4 w-4 mr-2" aria-hidden="true" />
          コピーして履歴に保存
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
