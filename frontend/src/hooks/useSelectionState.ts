import { useState, useCallback, useEffect } from 'react';

/**
 * 選択状態を管理する汎用フック
 * 単一選択と複数選択の両方に対応
 * 
 * @param initialValue - 初期値
 * @param multiple - 複数選択を許可するかどうか
 * @param maxSelections - 最大選択数（複数選択時のみ有効）
 */
export function useSelectionState<T extends string>(
  initialValue: T | T[] | undefined,
  multiple: boolean = false,
  maxSelections?: number
) {
  const [selection, setSelection] = useState<T | T[] | ''>(
    multiple ? (initialValue as T[]) || [] : (initialValue as T) || ''
  );
  
  // 初期値が変更されたら更新
  useEffect(() => {
    setSelection(
      multiple ? (initialValue as T[]) || [] : (initialValue as T) || ''
    );
  }, [initialValue, multiple]);
  
  const handleSelect = useCallback((value: T) => {
    if (!multiple) {
      // 単一選択
      setSelection(value);
    } else {
      // 複数選択
      setSelection((prev) => {
        const prevArray = prev as T[];
        if (prevArray.includes(value)) {
          // すでに選択されている場合は削除
          return prevArray.filter(v => v !== value);
        } else {
          // 最大選択数のチェック
          if (maxSelections && prevArray.length >= maxSelections) {
            return prevArray;
          }
          return [...prevArray, value];
        }
      });
    }
  }, [multiple, maxSelections]);
  
  const isSelected = useCallback((value: T): boolean => {
    if (!multiple) {
      return selection === value;
    } else {
      return (selection as T[]).includes(value);
    }
  }, [selection, multiple]);
  
  const clearSelection = useCallback(() => {
    setSelection(multiple ? [] as T[] : '' as T | '');
  }, [multiple]);
  
  const hasSelection = useCallback((): boolean => {
    if (!multiple) {
      return Boolean(selection);
    } else {
      return (selection as T[]).length > 0;
    }
  }, [selection, multiple]);
  
  return {
    selection,
    handleSelect,
    isSelected,
    clearSelection,
    hasSelection,
    selectionCount: multiple ? (selection as T[]).length : (selection ? 1 : 0),
  };
}