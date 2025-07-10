import { useState, useEffect } from 'react';

/**
 * Stepコンポーネント用の共通state管理Hook
 * ストアの値とローカルstateを同期
 */
export function useStepState<T>(
  storeValue: T | undefined,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [localValue, setLocalValue] = useState<T>(storeValue ?? defaultValue);

  // ストアの値が変更されたら、ローカルstateも更新
  useEffect(() => {
    setLocalValue(storeValue ?? defaultValue);
  }, [storeValue]); // defaultValueを依存配列から除外

  return [localValue, setLocalValue];
}

/**
 * 複数選択用のstate管理Hook
 */
export function useMultiSelectState<T>(
  storeValue: T[] | undefined,
  getId: (item: T) => string
): {
  selectedIds: string[];
  toggle: (id: string) => void;
  set: (ids: string[]) => void;
  clear: () => void;
} {
  const initialIds = storeValue?.map(getId) ?? [];
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);

  // ストアの値が変更されたら、ローカルstateも更新
  // getIdは関数なので依存配列から除外（無限ループを防ぐ）
  useEffect(() => {
    setSelectedIds(storeValue?.map(getId) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeValue]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const set = (ids: string[]) => {
    setSelectedIds(ids);
  };

  const clear = () => {
    setSelectedIds([]);
  };

  return { selectedIds, toggle, set, clear };
}
