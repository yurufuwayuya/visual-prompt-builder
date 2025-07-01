import { useState } from 'react';
import { Keyboard } from 'lucide-react';

const shortcuts = [
  { keys: ['1', '2', '3', '4'], description: 'セクションへジャンプ' },
  { keys: ['Cmd+Enter', 'Ctrl+Enter'], description: 'プロンプトを保存' },
  { keys: ['Esc'], description: 'キャンセル' },
  { keys: ['Cmd+C', 'Ctrl+C'], description: 'プロンプトをコピー' },
];

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  // Only show on desktop
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow lg:block hidden"
        aria-label="キーボードショートカット"
      >
        <Keyboard className="h-5 w-5 text-gray-600" />
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 bg-white rounded-lg shadow-xl p-6 min-w-[300px] lg:block hidden">
          <h3 className="font-semibold text-gray-900 mb-4">キーボードショートカット</h3>
          <div className="space-y-2">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex gap-2">
                  {shortcut.keys.map((key) => (
                    <kbd
                      key={key}
                      className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
                <span className="text-sm text-gray-600 ml-4">{shortcut.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}