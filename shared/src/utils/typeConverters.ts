/**
 * 型変換ユーティリティ
 * フロントエンドの型とAPI型の相互変換を行う
 */

import type {
  CategorySelection,
  DetailSelection,
  ColorSelection,
  StyleSelection,
  MoodSelection,
  LightingSelection,
  ApiSelectionItem,
  ApiDetailSelectionItem,
} from '../types/prompt';

/**
 * 選択項目をAPI用の型に変換
 */
export function toApiSelectionItem(
  item:
    | CategorySelection
    | DetailSelection
    | ColorSelection
    | StyleSelection
    | MoodSelection
    | LightingSelection
    | undefined
): ApiSelectionItem | undefined {
  if (!item) return undefined;

  // カスタム項目の場合
  if (item.predefinedId?.startsWith('custom-')) {
    return {
      predefinedId: null,
      customText: item.customText || item.name || null,
    };
  }

  // 事前定義項目の場合
  return {
    predefinedId: item.predefinedId || null,
    customText: item.customText || null,
  };
}

/**
 * 詳細選択項目をAPI用の型に変換
 */
export function toApiDetailSelectionItem(
  detail: DetailSelection,
  order: number
): ApiDetailSelectionItem {
  const apiItem = toApiSelectionItem(detail);
  if (!apiItem) {
    throw new Error('Failed to convert detail selection item');
  }

  return {
    ...apiItem,
    order,
  };
}

/**
 * 選択項目の配列をAPI用の型に変換
 */
export function toApiSelectionItems<
  T extends
    | CategorySelection
    | DetailSelection
    | ColorSelection
    | StyleSelection
    | MoodSelection
    | LightingSelection,
>(items: T[]): ApiSelectionItem[] {
  return items.map((item) => {
    const converted = toApiSelectionItem(item);
    if (!converted) {
      throw new Error('Failed to convert selection item');
    }
    return converted;
  });
}

/**
 * 詳細選択項目の配列をAPI用の型に変換
 */
export function toApiDetailSelectionItems(details: DetailSelection[]): ApiDetailSelectionItem[] {
  return details.map((detail, index) => toApiDetailSelectionItem(detail, index));
}

/**
 * 選択項目がカスタムかどうかを判定
 */
export function isCustomSelection(
  item:
    | CategorySelection
    | DetailSelection
    | ColorSelection
    | StyleSelection
    | MoodSelection
    | LightingSelection
    | undefined
): boolean {
  return !!item?.predefinedId?.startsWith('custom-');
}

/**
 * カスタムテキストを取得（翻訳済みのテキストを優先）
 */
export function getCustomText(
  item:
    | CategorySelection
    | DetailSelection
    | ColorSelection
    | StyleSelection
    | MoodSelection
    | LightingSelection
    | undefined,
  translatedText?: string
): string | null {
  if (!item) return null;

  if (isCustomSelection(item)) {
    return translatedText || item.customText || item.name || null;
  }

  return item.customText || null;
}
