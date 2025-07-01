import { useEffect } from 'react';

interface ShortcutHandlers {
  [key: string]: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Create a key combination string
      const modifiers = [];
      if (e.ctrlKey) modifiers.push('ctrl');
      if (e.metaKey) modifiers.push('cmd');
      if (e.altKey) modifiers.push('alt');
      if (e.shiftKey) modifiers.push('shift');
      
      const key = e.key.toLowerCase();
      const combo = [...modifiers, key].join('+');
      
      // Check if this combination has a handler
      if (shortcuts[combo]) {
        e.preventDefault();
        shortcuts[combo]();
      }
      
      // Also check without modifiers
      if (shortcuts[key] && modifiers.length === 0) {
        // Don't prevent default for single keys if in an input
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          shortcuts[key]();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}