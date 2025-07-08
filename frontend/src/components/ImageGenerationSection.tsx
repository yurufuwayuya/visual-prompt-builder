import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Copy, Check, AlertCircle, Link } from 'lucide-react';
import { useLanguageStore } from '@/stores/languageStore';
import { commercialImageServices, getServiceById } from '../config/commercialImageServices';
import {
  copyPromptToClipboard,
  openImageService,
  saveLastUsedService,
  getLastUsedService,
  checkPromptLength,
} from '../services/commercialImageGeneration';

interface ImageGenerationSectionProps {
  prompt: string;
}

export const ImageGenerationSection: React.FC<ImageGenerationSectionProps> = ({ prompt }) => {
  const { language } = useLanguageStore();
  const isJapanese = language === 'ja';

  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // 最後に使用したサービスを復元
  useEffect(() => {
    const lastUsedId = getLastUsedService();
    if (lastUsedId && getServiceById(lastUsedId)) {
      setSelectedServiceId(lastUsedId);
    } else if (commercialImageServices.length > 0) {
      setSelectedServiceId(commercialImageServices[0].id);
    }
  }, []);

  const selectedService = getServiceById(selectedServiceId);

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    saveLastUsedService(serviceId);
    setShowInstructions(false);
    setIsCopied(false);
  };

  const handleGenerateImage = async () => {
    if (!selectedService) return;

    setIsGenerating(true);

    try {
      // コピペ型またはboth型の場合は先にコピー
      if (selectedService.type === 'copy' || selectedService.type === 'both') {
        const success = await copyPromptToClipboard(prompt);
        if (success) {
          setIsCopied(true);
          // コピー成功表示を2秒後にリセット
          setTimeout(() => setIsCopied(false), 2000);
        }
      }

      // サービスを開く
      if (selectedService.type === 'url') {
        // URL型の場合はプロンプト付きで開く
        openImageService(selectedService, prompt);
      } else {
        // コピペ型の場合は通常のURLを開く
        openImageService(selectedService);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // プロンプトの長さチェック
  const isPromptTooLong = !checkPromptLength(prompt);

  return (
    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">{isJapanese ? '画像を生成' : 'Generate Image'}</h3>

      <div className="space-y-4">
        {/* サービス選択カード */}
        <div>
          <label className="block text-sm font-medium mb-3">
            {isJapanese ? 'サービスを選択' : 'Select Service'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {commercialImageServices.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceSelect(service.id)}
                className={`
                  relative p-3 rounded-lg border-2 transition-all duration-200
                  hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
                  text-left flex flex-col gap-2
                  ${
                    selectedServiceId === service.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                  }
                `}
              >
                {/* 選択インジケーター */}
                {selectedServiceId === service.id && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                )}

                {/* サービス名 */}
                <div className="font-medium text-gray-900 dark:text-gray-100">{service.name}</div>

                {/* サービスタイプ */}
                <div className="flex items-center gap-2 text-xs">
                  {service.type === 'url' || service.type === 'both' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                      <Link className="w-3 h-3" />
                      URL連携
                    </span>
                  ) : null}
                  {service.type === 'copy' || service.type === 'both' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">
                      <Copy className="w-3 h-3" />
                      コピペ
                    </span>
                  ) : null}
                </div>

                {/* 無料プラン情報 */}
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {isJapanese ? service.freeInfo : service.freeInfoEn}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 選択されたサービスの詳細情報 */}
        {selectedService && (
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {isJapanese ? '商用利用可能' : 'Commercial use allowed'}
                </span>
              </div>
              {selectedService.limitations && (
                <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span className="text-sm">
                    {isJapanese ? selectedService.limitations : selectedService.limitationsEn}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* プロンプト長警告 */}
        {isPromptTooLong && (
          <div className="p-3 bg-amber-100 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-md">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {isJapanese
                ? 'プロンプトが長すぎる可能性があります。一部のサービスでは制限があります。'
                : 'The prompt might be too long. Some services have limitations.'}
            </p>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateImage}
            disabled={!prompt || isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {selectedService?.type === 'copy' ? (
              <>
                {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {isJapanese
                  ? isCopied
                    ? 'コピー済み'
                    : 'プロンプトをコピーして開く'
                  : isCopied
                    ? 'Copied'
                    : 'Copy prompt and open'}
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                {isJapanese ? '画像生成サービスで開く' : 'Open in image service'}
              </>
            )}
          </button>

          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            {isJapanese ? '使い方' : 'How to use'}
            {showInstructions ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* 使い方説明 */}
        {showInstructions && selectedService && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-sm">
              {isJapanese ? selectedService.instructions : selectedService.instructionsEn}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
