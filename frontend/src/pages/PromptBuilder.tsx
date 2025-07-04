import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryStep } from '@/components/steps/CategoryStep';
import { DetailStep } from '@/components/steps/DetailStep';
import { StyleStep } from '@/components/steps/StyleStep';
import { ResultStep } from '@/components/steps/ResultStep';
import { Button } from '@/components/common/Button';
import { usePromptStore } from '@/stores/promptStore';
import { useToastStore } from '@/stores/toastStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export function PromptBuilder() {
  const navigate = useNavigate();
  const { currentPrompt, reset, saveToHistory } = usePromptStore();
  const { addToast } = useToastStore();
  const [completedSteps, setCompletedSteps] = useState({
    category: false,
    detail: false,
    style: false,
  });

  const categoryRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCategoryComplete = () => {
    setCompletedSteps((prev) => ({ ...prev, category: true }));
    setTimeout(() => scrollToSection(detailRef), 100);
  };

  const handleDetailComplete = () => {
    setCompletedSteps((prev) => ({ ...prev, detail: true }));
    setTimeout(() => scrollToSection(styleRef), 100);
  };

  const handleStyleComplete = () => {
    setCompletedSteps((prev) => ({ ...prev, style: true }));
    setTimeout(() => scrollToSection(resultRef), 100);
  };

  const handleComplete = () => {
    saveToHistory();
    addToast({
      type: 'success',
      message: '履歴に保存しました',
    });
    navigate('/history');
  };

  const handleReset = () => {
    if (window.confirm('作成中の内容は保存されません。最初からやり直しますか？')) {
      reset();
      setCompletedSteps({
        category: false,
        detail: false,
        style: false,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCancel = () => {
    if (window.confirm('作成中の内容は保存されません。よろしいですか？')) {
      reset();
      navigate('/');
    }
  };

  // カテゴリが選択されたら詳細セクションを有効化
  useEffect(() => {
    if (currentPrompt.category && !completedSteps.category) {
      setCompletedSteps((prev) => ({ ...prev, category: true }));
    }
  }, [currentPrompt.category, completedSteps.category]);

  // キーボードショートカット
  useKeyboardShortcuts({
    '1': () => scrollToSection(categoryRef),
    '2': () => completedSteps.category && scrollToSection(detailRef),
    '3': () => completedSteps.detail && scrollToSection(styleRef),
    '4': () => completedSteps.style && scrollToSection(resultRef),
    'cmd+enter': () => {
      if (completedSteps.style && currentPrompt.generatedPrompt) {
        handleComplete();
      }
    },
    'ctrl+enter': () => {
      if (completedSteps.style && currentPrompt.generatedPrompt) {
        handleComplete();
      }
    },
    escape: () => handleCancel(),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-4xl lg:max-w-6xl">
        <header className="sticky top-0 z-10 bg-white shadow-sm">
          <div className="px-4 py-3 sm:py-4 lg:py-5">
            <div className="flex items-center justify-between">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">プロンプト作成</h1>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  リセット
                </Button>
                <Button variant="ghost" onClick={handleCancel}>
                  ホームに戻る
                </Button>
              </div>
            </div>
            <nav
              className="mt-3 sm:mt-4 flex gap-2 sm:gap-4 text-xs sm:text-sm lg:text-base overflow-x-auto"
              role="navigation"
              aria-label="プロンプト作成ステップ"
            >
              <button
                onClick={() => scrollToSection(categoryRef)}
                className="font-medium text-primary-600 hover:underline"
              >
                1. カテゴリ
              </button>
              <button
                onClick={() => scrollToSection(detailRef)}
                className={`font-medium ${
                  completedSteps.category
                    ? 'text-primary-600 hover:underline'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                disabled={!completedSteps.category}
                aria-disabled={!completedSteps.category}
              >
                2. 詳細
              </button>
              <button
                onClick={() => scrollToSection(styleRef)}
                className={`font-medium ${
                  completedSteps.detail
                    ? 'text-primary-600 hover:underline'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                disabled={!completedSteps.detail}
                aria-disabled={!completedSteps.detail}
              >
                3. スタイル
              </button>
              <button
                onClick={() => scrollToSection(resultRef)}
                className={`font-medium ${
                  completedSteps.style
                    ? 'text-primary-600 hover:underline'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                disabled={!completedSteps.style}
                aria-disabled={!completedSteps.style}
              >
                4. 結果
              </button>
            </nav>
          </div>
        </header>

        <main className="px-4 py-6 sm:py-8 lg:py-12 space-y-8 sm:space-y-12 lg:space-y-16">
          {/* カテゴリ選択 */}
          <section ref={categoryRef} className="scroll-mt-32">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="mb-6">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white font-bold">
                  1
                </span>
                <span className="ml-2 text-lg font-semibold text-gray-900">カテゴリ選択</span>
              </div>
              <CategoryStep onNext={handleCategoryComplete} />
            </div>
          </section>

          {/* 詳細選択 */}
          <section
            ref={detailRef}
            className={`scroll-mt-32 transition-opacity duration-300 ${
              completedSteps.category ? 'opacity-100' : 'opacity-30 pointer-events-none'
            }`}
          >
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="mb-6">
                <span
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                    completedSteps.category
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  2
                </span>
                <span className="ml-2 text-lg font-semibold text-gray-900">詳細選択</span>
              </div>
              <DetailStep onNext={handleDetailComplete} />
            </div>
          </section>

          {/* スタイル設定 */}
          <section
            ref={styleRef}
            className={`scroll-mt-32 transition-opacity duration-300 ${
              completedSteps.detail ? 'opacity-100' : 'opacity-30 pointer-events-none'
            }`}
          >
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="mb-6">
                <span
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                    completedSteps.detail
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  3
                </span>
                <span className="ml-2 text-lg font-semibold text-gray-900">スタイル設定</span>
              </div>
              <StyleStep onNext={handleStyleComplete} />
            </div>
          </section>

          {/* 結果 */}
          <section
            ref={resultRef}
            className={`scroll-mt-32 transition-opacity duration-300 ${
              completedSteps.style ? 'opacity-100' : 'opacity-30 pointer-events-none'
            }`}
          >
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="mb-6">
                <span
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                    completedSteps.style ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  4
                </span>
                <span className="ml-2 text-lg font-semibold text-gray-900">生成結果</span>
              </div>
              <ResultStep onNew={handleComplete} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
