import { useState } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';
import { getCategoryById, getDetailsByCategoryId } from '@visual-prompt-builder/shared';
import { usePromptStore } from '@/stores/promptStore';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { sanitizeInput } from '@/lib/security';

interface DetailStepProps {
  onNext: () => void;
}

export function DetailStep({ onNext }: DetailStepProps) {
  const { currentPrompt, addDetail, removeDetail } = usePromptStore();
  const [customDetail, setCustomDetail] = useState('');

  const category = currentPrompt.category;
  if (!category?.predefinedId) {
    return null;
  }

  const categoryData = getCategoryById(category.predefinedId);
  const availableDetails = getDetailsByCategoryId(category.predefinedId);
  const selectedDetails = currentPrompt.details || [];

  const handleAddDetail = (detailId: string) => {
    if (selectedDetails.length >= 5) return;

    const detail = availableDetails.find((d) => d.id === detailId);
    if (!detail) return;

    addDetail({
      predefinedId: detail.id,
      name: detail.name,
      nameEn: detail.nameEn,
      order: selectedDetails.length,
    });
  };

  const handleAddCustomDetail = () => {
    const sanitized = sanitizeInput(customDetail.trim());
    if (!sanitized || selectedDetails.length >= 5) return;

    addDetail({
      predefinedId: `custom-${Date.now()}`,
      name: sanitized,
      order: selectedDetails.length,
    });
    setCustomDetail('');
  };

  // const handleReorder = (fromIndex: number, toIndex: number) => {
  //   const newDetails = [...selectedDetails];
  //   const [removed] = newDetails.splice(fromIndex, 1);
  //   newDetails.splice(toIndex, 0, removed);
  //   const reorderedDetails = newDetails.map((d, i) => ({ ...d, order: i }));
  //   reorderDetails(reorderedDetails);
  // };

  return (
    <div className="space-y-6" role="group" aria-labelledby="detail-heading">
      <h2 id="detail-heading" className="sr-only">
        詳細選択
      </h2>
      <p className="text-gray-600 mb-4 xl:text-lg">
        {categoryData?.name}の詳細を最大5つまで選択できます
      </p>

      {/* 選択済みの詳細 */}
      {selectedDetails.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4" role="region" aria-label="選択済み詳細">
          <h3 className="font-medium text-sm sm:text-base text-gray-900 mb-2 sm:mb-3">
            選択済み ({selectedDetails.length}/5)
          </h3>
          <div className="space-y-2">
            {selectedDetails
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((detail) => (
                <div
                  key={detail.predefinedId}
                  className="flex items-center gap-2 bg-white rounded-md px-2 sm:px-3 py-1.5 sm:py-2"
                >
                  <GripVertical className="h-4 w-4 text-gray-400 cursor-move" aria-hidden="true" />
                  <span className="flex-1 text-xs sm:text-sm">{detail.name}</span>
                  <button
                    onClick={() => removeDetail(detail.predefinedId)}
                    className="p-1 hover:bg-gray-100 rounded focus-visible-ring"
                    aria-label={`${detail.name}を削除`}
                  >
                    <X className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 利用可能な詳細オプション */}
      <div role="region" aria-label="利用可能なオプション">
        <h3 className="font-medium text-gray-900 mb-3 xl:text-lg" id="available-options">
          利用可能なオプション
        </h3>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 sm:gap-3 lg:gap-4 xl:gap-5"
          role="list"
          aria-labelledby="available-options"
        >
          {availableDetails.map((detail) => {
            const isSelected = selectedDetails.some((d) => d.predefinedId === detail.id);
            return (
              <button
                key={detail.id}
                onClick={() => handleAddDetail(detail.id)}
                disabled={isSelected || selectedDetails.length >= 5}
                className={cn(
                  'p-2 sm:p-3 rounded-md border text-left transition-all focus-visible-ring',
                  isSelected
                    ? 'border-gray-200 bg-gray-100 text-gray-400'
                    : selectedDetails.length >= 5
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 hover:border-primary-600 hover:bg-primary-50'
                )}
                role="listitem"
                aria-pressed={isSelected}
                aria-label={`${detail.name}${isSelected ? ' (選択済み)' : ''}${selectedDetails.length >= 5 && !isSelected ? ' (上限に達しました)' : ''}`}
              >
                <span className="text-xs sm:text-sm xl:text-base">{detail.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* カスタム詳細入力 */}
      <div role="region" aria-label="カスタムオプション">
        <h3 className="font-medium text-gray-900 mb-3 xl:text-lg" id="custom-option">
          カスタムオプション
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={customDetail}
            onChange={(e) => setCustomDetail(e.target.value)}
            placeholder="自由に入力"
            disabled={selectedDetails.length >= 5}
            className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
            aria-label="カスタム詳細"
            aria-describedby="custom-option"
            aria-invalid={selectedDetails.length >= 5}
          />
          <Button
            onClick={handleAddCustomDetail}
            disabled={!customDetail.trim() || selectedDetails.length >= 5}
            variant="secondary"
            aria-label="カスタム詳細を追加"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={selectedDetails.length === 0} size="lg">
          スタイル設定へ進む
        </Button>
      </div>
    </div>
  );
}
