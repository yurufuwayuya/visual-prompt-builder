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
 * Converts a frontend selection item to an API-compatible selection item.
 *
 * Returns an API selection item object with appropriate `predefinedId` and `customText` fields, or `undefined` if the input is `undefined`. For custom selections, sets `predefinedId` to `null` and uses the item's custom or name text as `customText`.
 *
 * @returns The converted API selection item, or `undefined` if the input is `undefined`.
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
 * Converts a detail selection item to an API detail selection item, including its order.
 *
 * Throws an error if the detail selection cannot be converted.
 *
 * @param detail - The detail selection item to convert
 * @param order - The order index to assign to the API detail selection item
 * @returns The API-compatible detail selection item with order
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
 * Converts an array of frontend selection items to API-compatible selection items.
 *
 * Throws an error if any item cannot be converted.
 *
 * @param items - The array of selection items to convert
 * @returns An array of API selection items
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
 * Converts an array of detail selection items to API-compatible detail selection items, assigning an order to each.
 *
 * @param details - The array of detail selection items to convert
 * @returns An array of API detail selection items with order properties
 */
export function toApiDetailSelectionItems(details: DetailSelection[]): ApiDetailSelectionItem[] {
  return details.map((detail, index) => toApiDetailSelectionItem(detail, index));
}

/**
 * Determines whether a selection item is a custom selection.
 *
 * Returns true if the item's `predefinedId` starts with "custom-", otherwise false.
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
 * Retrieves the custom text for a selection item, prioritizing a provided translated text if available.
 *
 * If the item is a custom selection, returns the translated text if provided, otherwise the item's custom text, or name, or null. For predefined selections, returns the item's custom text or null.
 *
 * @param item - The selection item to extract custom text from
 * @param translatedText - Optional translated text to use if available
 * @returns The custom or translated text, or null if none is available
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
