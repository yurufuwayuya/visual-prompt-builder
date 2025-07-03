import { CATEGORIES } from '@visual-prompt-builder/shared';
import { usePromptStore } from '@/stores/promptStore';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { useStepState } from '@/hooks/useStepState';

interface CategoryStepProps {
  onNext: () => void;
}

export function CategoryStep({ onNext }: CategoryStepProps) {
  const { currentPrompt, setCategory, clearSelectionsFromDetails } = usePromptStore();
  const [selectedCategory, setSelectedCategory] = useStepState(
    currentPrompt.category?.predefinedId,
    ''
  );

  const handleCategorySelect = (categoryId: string) => {
    const shouldConfirmChange =
      (currentPrompt.details?.length ?? 0) > 0 &&
      currentPrompt.category?.predefinedId &&
      currentPrompt.category.predefinedId !== categoryId;

    // 既に詳細選択がある場合は確認
    if (shouldConfirmChange) {
      const confirmMessage =
        'カテゴリを変更すると、現在選択されている詳細やスタイルなどがすべてリセットされます。\n続行しますか？';
      if (!window.confirm(confirmMessage)) {
        return; // キャンセルした場合は何もしない
      }
      clearSelectionsFromDetails();
    }

    // カテゴリを選択
    setSelectedCategory(categoryId);

    // 新しいカテゴリをストアに設定（handleNextでも同じ処理をしているため、ここでは不要）
    if (shouldConfirmChange) {
      const category = CATEGORIES.find((c) => c.id === categoryId);
      if (category) {
        setCategory({
          predefinedId: category.id,
          name: category.name,
          nameEn: category.nameEn,
        });
      }
    }
  };

  const handleNext = () => {
    if (!selectedCategory) return;

    const category = CATEGORIES.find((c) => c.id === selectedCategory);
    if (!category) return;

    setCategory({
      predefinedId: category.id,
      name: category.name,
      nameEn: category.nameEn,
    });
    onNext();
  };

  return (
    <div className="space-y-6" role="group" aria-labelledby="category-heading">
      <h2 id="category-heading" className="sr-only">
        カテゴリ選択
      </h2>
      <p className="text-gray-600 mb-4">作成したい画像のカテゴリを選んでください</p>

      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5"
        role="radiogroup"
        aria-required="true"
      >
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategorySelect(category.id)}
            className={cn(
              'p-3 sm:p-4 rounded-lg border-2 text-left transition-all min-h-[60px] sm:min-h-[80px]',
              selectedCategory === category.id
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
            role="radio"
            aria-checked={selectedCategory === category.id}
            aria-label={`${category.name} - ${category.nameEn}`}
          >
            <h3 className="font-medium text-gray-900">{category.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{category.nameEn}</p>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={!selectedCategory} size="lg">
          詳細選択へ進む
        </Button>
      </div>
    </div>
  );
}
