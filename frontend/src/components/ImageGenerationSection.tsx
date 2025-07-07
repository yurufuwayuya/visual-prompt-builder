import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Copy, Check, AlertCircle } from 'lucide-react';
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

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newServiceId = e.target.value;
    setSelectedServiceId(newServiceId);
    saveLastUsedService(newServiceId);
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
        {/* サービス選択 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {isJapanese ? 'サービスを選択' : 'Select Service'}
          </label>
          <select
            value={selectedServiceId}
            onChange={handleServiceChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
          >
            {commercialImageServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>

        {/* サービス情報 */}
        {selectedService && (
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Check className="w-4 h-4" />
              <span>{isJapanese ? '商用利用可能' : 'Commercial use allowed'}</span>
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {isJapanese ? selectedService.freeInfo : selectedService.freeInfoEn}
            </div>
            {selectedService.limitations && (
              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <span>
                  {isJapanese ? selectedService.limitations : selectedService.limitationsEn}
                </span>
              </div>
            )}
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
