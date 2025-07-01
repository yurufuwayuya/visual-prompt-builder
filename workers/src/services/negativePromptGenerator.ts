/**
 * ネガティブプロンプト生成サービス
 */

import type { PromptGenerationOptions, ApiPromptData } from '@visual-prompt-builder/shared';
import { buildNegativePrompt } from '@visual-prompt-builder/shared';

export async function generateNegativePrompt(
  promptData: ApiPromptData,
  options: PromptGenerationOptions
): Promise<string> {
  // スタイルとカテゴリを型安全に取得
  const style = options.style as 'realistic' | 'anime' | 'artistic' | undefined;
  const category = promptData.category?.predefinedId as 'person' | 'landscape' | undefined;
  
  // 共通ヘルパー関数を使用してネガティブキーワードを構築
  const negativeKeywords = buildNegativePrompt(style, category);
  
  // カンマ区切りで結合
  return negativeKeywords.join(', ');
}