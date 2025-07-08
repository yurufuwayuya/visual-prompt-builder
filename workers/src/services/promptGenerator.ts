/**
 * プロンプト生成サービス
 */

import type {
  PromptGenerationOptions,
  ApiPromptData,
  ApiSelectionItem,
} from '@visual-prompt-builder/shared';
import {
  CATEGORIES,
  CATEGORY_DETAILS,
  COLORS,
  STYLES,
  MOODS,
  LIGHTINGS,
  QUALITY_KEYWORDS,
} from '@visual-prompt-builder/shared';

export async function generatePrompt(
  promptData: ApiPromptData,
  options: PromptGenerationOptions
): Promise<string> {
  const parts: string[] = [];

  // デバッグログ
  console.log('[generatePrompt] Input promptData:', JSON.stringify(promptData, null, 2));
  console.log('[generatePrompt] Input options:', JSON.stringify(options, null, 2));

  // 常に英語でプロンプトを生成する
  const language = 'en';

  // カテゴリ
  if (promptData.category) {
    const categoryText = getCategoryText(promptData.category, language);
    if (categoryText) {
      parts.push(categoryText);
    }
  }

  // 詳細
  if (promptData.details && promptData.details.length > 0) {
    console.log('[generatePrompt] Processing details:', promptData.details);
    const sortedDetails = [...promptData.details].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    for (const detail of sortedDetails) {
      const detailText = getDetailText(detail, language);
      console.log('[generatePrompt] Detail:', detail, '→ Text:', detailText);
      if (detailText) {
        parts.push(detailText);
      }
    }
  } else {
    console.log('[generatePrompt] No details provided');
  }

  // スタイル
  if (promptData.style) {
    const styleText = getStyleText(promptData.style, language);
    if (styleText) {
      const style = STYLES.find((s) => s.id === promptData.style?.predefinedId);
      if (style && style.keywords) {
        parts.push(...style.keywords);
      } else {
        parts.push(styleText);
      }
    }
  }

  // 色
  if (promptData.colors && promptData.colors.length > 0) {
    const colorTexts = promptData.colors
      .map((color) => getColorText(color, language))
      .filter(Boolean);
    if (colorTexts.length > 0) {
      parts.push(colorTexts.join(' and '));
    }
  }

  // 雰囲気
  if (promptData.mood) {
    const moodText = getMoodText(promptData.mood, language);
    if (moodText) {
      const mood = MOODS.find((m) => m.id === promptData.mood?.predefinedId);
      if (mood && mood.keywords) {
        parts.push(...mood.keywords);
      } else {
        parts.push(moodText);
      }
    }
  }

  // 照明
  if (promptData.lighting) {
    const lightingText = getLightingText(promptData.lighting, language);
    if (lightingText) {
      const lighting = LIGHTINGS.find((l) => l.id === promptData.lighting?.predefinedId);
      if (lighting && lighting.keywords) {
        parts.push(...lighting.keywords);
      } else {
        parts.push(lightingText);
      }
    }
  }

  // 品質修飾子
  if (options.quality) {
    parts.push(...getQualityKeywords(options.quality));
  }

  // 基本的な品質向上キーワード
  parts.push('high quality', 'detailed', 'masterpiece');

  const result = parts.join(', ');
  console.log('[generatePrompt] Final parts:', parts);
  console.log('[generatePrompt] Final prompt:', result);
  return result;
}

// ヘルパー関数群

/**
 * 汎用的なテキスト取得関数
 * predefinedIdからマスターデータを検索し、言語に応じたテキストを返す
 */
function getSelectionText<T extends { id: string; name: string; nameEn: string }>(
  selection: ApiSelectionItem,
  masterData: readonly T[],
  language: 'ja' | 'en'
): string {
  if (selection.customText) {
    return selection.customText;
  }
  if (selection.predefinedId) {
    const item = masterData.find((m) => m.id === selection.predefinedId);
    if (item) {
      return language === 'ja' ? item.name : item.nameEn;
    }
  }
  return '';
}

function getCategoryText(category: ApiSelectionItem, language: 'ja' | 'en'): string {
  return getSelectionText(category, CATEGORIES, language);
}

function getDetailText(detail: ApiSelectionItem, language: 'ja' | 'en'): string {
  return getSelectionText(detail, CATEGORY_DETAILS, language);
}

function getColorText(color: ApiSelectionItem, language: 'ja' | 'en'): string {
  return getSelectionText(color, COLORS, language);
}

function getStyleText(style: ApiSelectionItem, language: 'ja' | 'en'): string {
  return getSelectionText(style, STYLES, language);
}

function getMoodText(mood: ApiSelectionItem, language: 'ja' | 'en'): string {
  return getSelectionText(mood, MOODS, language);
}

function getLightingText(lighting: ApiSelectionItem, language: 'ja' | 'en'): string {
  return getSelectionText(lighting, LIGHTINGS, language);
}

function getQualityKeywords(quality: 'draft' | 'standard' | 'high'): string[] {
  return [...(QUALITY_KEYWORDS[quality] || [])] as string[];
}
