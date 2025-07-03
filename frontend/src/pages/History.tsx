import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ChevronLeft, Copy, Clock } from 'lucide-react';
import { usePromptStore } from '@/stores/promptStore';
import { useToastStore } from '@/stores/toastStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export function History() {
  const { history } = usePromptStore();
  const { addToast } = useToastStore();

  // キーボードショートカット
  useKeyboardShortcuts({
    escape: () => window.history.back(),
    'cmd+c': () => {
      const firstPrompt = history[0];
      if (firstPrompt) {
        copyToClipboard(firstPrompt.generatedPrompt || firstPrompt.generatedPromptJa || '');
      }
    },
    'ctrl+c': () => {
      const firstPrompt = history[0];
      if (firstPrompt) {
        copyToClipboard(firstPrompt.generatedPrompt || firstPrompt.generatedPromptJa || '');
      }
    },
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast({
        type: 'success',
        message: 'コピーしました',
      });
    } catch {
      addToast({
        type: 'error',
        message: 'コピーに失敗しました',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl">
        <header className="py-4 sm:py-6 lg:py-8 border-b">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">作成履歴</h1>
            <Link to="/">
              <Button variant="outline" size="sm" aria-label="ホームページに戻る">
                <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                ホームに戻る
              </Button>
            </Link>
          </div>
        </header>

        <main className="py-6 sm:py-8 lg:py-12" aria-label="プロンプト履歴">
          {history.length === 0 ? (
            <div
              className="rounded-lg bg-white p-8 sm:p-12 text-center shadow-sm"
              role="status"
              aria-live="polite"
            >
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
              <p className="text-base sm:text-lg text-gray-500">
                まだプロンプトが作成されていません。
              </p>
              <Link to="/builder">
                <Button className="mt-6">プロンプトを作成する</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="list">
              {history.map((item) => (
                <article
                  key={item.id}
                  className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 hover:shadow-md transition-shadow"
                  role="listitem"
                  aria-label={`${item.category.name}のプロンプト`}
                >
                  <div className="mb-3">
                    <h3 className="font-medium text-sm sm:text-base text-gray-900">
                      {item.category.name}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs sm:text-sm text-gray-600">
                      {item.details.length > 0 && (
                        <p>
                          詳細:{' '}
                          {item.details
                            .slice(0, 3)
                            .map((d) => d.name)
                            .join(', ')}
                          {item.details.length > 3 && ` 他${item.details.length - 3}件`}
                        </p>
                      )}
                      {item.style && <p>スタイル: {item.style.name}</p>}
                    </div>

                    {item.generatedPrompt && (
                      <div className="pt-2 border-t">
                        <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">
                          {item.generatedPromptJa || item.generatedPrompt}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 sm:mt-4 flex items-center justify-between">
                    <time
                      className="text-[10px] sm:text-xs text-gray-500"
                      dateTime={item.createdAt}
                    >
                      {new Date(item.createdAt).toLocaleDateString('ja-JP')}
                    </time>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(item.generatedPrompt || item.generatedPromptJa || '')
                      }
                      aria-label="プロンプトをコピー"
                    >
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                      <span className="ml-1 hidden sm:inline">コピー</span>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
