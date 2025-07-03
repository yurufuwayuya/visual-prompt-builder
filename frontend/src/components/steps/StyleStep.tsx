import { usePromptStore } from '@/stores/promptStore';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { useStepState, useMultiSelectState } from '@/hooks/useStepState';
import type { ColorSelection } from '@visual-prompt-builder/shared';
import { COLORS, STYLES, MOODS, LIGHTINGS } from '@visual-prompt-builder/shared';

interface StyleStepProps {
  onNext: () => void;
}

export function StyleStep({ onNext }: StyleStepProps) {
  const { currentPrompt, setColors, setStyle, setMood, setLighting } = usePromptStore();

  const { selectedIds: selectedColors, toggle: handleColorToggle } = useMultiSelectState(
    currentPrompt.colors,
    (color) => color.predefinedId || ''
  );
  const [selectedStyle, setSelectedStyle] = useStepState(currentPrompt.style?.predefinedId, '');
  const [selectedMood, setSelectedMood] = useStepState(currentPrompt.mood?.predefinedId, '');
  const [selectedLighting, setSelectedLighting] = useStepState(
    currentPrompt.lighting?.predefinedId,
    ''
  );

  const handleNext = () => {
    // 色の設定
    const colors = selectedColors
      .map((id) => COLORS.find((c) => c.id === id))
      .filter(Boolean)
      .map((color) => ({
        predefinedId: color!.id,
        name: color!.name,
        nameEn: color!.nameEn,
        hex: color!.hex,
      })) as ColorSelection[];
    setColors(colors);

    // ヘルパー関数を使って各選択を設定
    const setSelectionFromId = <T extends { id: string; name: string; nameEn: string }>(
      selectedId: string | undefined,
      masterData: readonly T[],
      setter: (selection: any) => void
    ) => {
      if (!selectedId) return;
      const item = masterData.find((m) => m.id === selectedId);
      if (item) {
        setter({
          predefinedId: item.id,
          name: item.name,
          nameEn: item.nameEn,
        });
      }
    };

    setSelectionFromId(selectedStyle, STYLES, setStyle);
    setSelectionFromId(selectedMood, MOODS, setMood);
    setSelectionFromId(selectedLighting, LIGHTINGS, setLighting);

    onNext();
  };

  return (
    <div className="space-y-8">
      <p className="text-gray-600 mb-6">画像のスタイルや雰囲気を設定してください</p>

      {/* 色選択 */}
      <div>
        <h3 className="font-medium text-sm sm:text-base text-gray-900 mb-2 sm:mb-3">
          色（複数選択可）
        </h3>
        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
          {COLORS.map((color) => (
            <button
              key={color.id}
              onClick={() => handleColorToggle(color.id)}
              className={cn(
                'p-2 sm:p-3 rounded-md border-2 transition-all',
                selectedColors.includes(color.id) ? 'border-primary-600' : 'border-gray-200'
              )}
            >
              <div
                className="w-full h-6 sm:h-8 rounded mb-1 sm:mb-2"
                style={{ backgroundColor: color.hex }}
              />
              <span className="text-[10px] sm:text-xs">{color.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* スタイル選択 */}
      <div>
        <h3 className="font-medium text-sm sm:text-base text-gray-900 mb-2 sm:mb-3">スタイル</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              className={cn(
                'p-3 rounded-md border-2 text-left transition-all',
                selectedStyle === style.id
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="font-medium text-xs sm:text-sm">{style.name}</div>
              <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                {style.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 雰囲気選択 */}
      <div role="region" aria-label="雰囲気選択">
        <h3
          className="font-medium text-sm sm:text-base text-gray-900 mb-2 sm:mb-3"
          id="mood-selection"
        >
          雰囲気
        </h3>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="mood-selection">
          {MOODS.map((mood) => (
            <button
              key={mood.id}
              onClick={() => setSelectedMood(mood.id)}
              className={cn(
                'px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border transition-all text-xs sm:text-sm focus-visible-ring',
                selectedMood === mood.id
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-gray-300 hover:border-gray-400'
              )}
              role="radio"
              aria-checked={selectedMood === mood.id}
              aria-label={mood.name}
            >
              {mood.name}
            </button>
          ))}
        </div>
      </div>

      {/* 照明選択 */}
      <div role="region" aria-label="照明選択">
        <h3
          className="font-medium text-sm sm:text-base text-gray-900 mb-2 sm:mb-3"
          id="lighting-selection"
        >
          照明
        </h3>
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-labelledby="lighting-selection"
        >
          {LIGHTINGS.map((lighting) => (
            <button
              key={lighting.id}
              onClick={() => setSelectedLighting(lighting.id)}
              className={cn(
                'px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border transition-all text-xs sm:text-sm focus-visible-ring',
                selectedLighting === lighting.id
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-gray-300 hover:border-gray-400'
              )}
              role="radio"
              aria-checked={selectedLighting === lighting.id}
              aria-label={lighting.name}
            >
              {lighting.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext} size="lg">
          プロンプトを生成
        </Button>
      </div>
    </div>
  );
}
