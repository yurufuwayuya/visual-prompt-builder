/**
 * プロンプト生成関連のルート
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Bindings } from '../types';
import type { GeneratePromptResponse } from '@visual-prompt-builder/shared';
import {
  createSuccessResponse,
  createErrorResponse,
  generateCacheKey,
} from '@visual-prompt-builder/shared';
import { generatePrompt } from '../services/promptGenerator';
import { generatePromptSchema } from '../validators/prompt';
// import { promptRateLimit } from '../middleware/rateLimit';

export const promptRoute = new Hono<{ Bindings: Bindings }>();

// POST /api/v1/prompt/generate - プロンプト生成
promptRoute.post(
  '/generate',
  // promptRateLimit, // 一時的に無効化
  zValidator('json', generatePromptSchema),
  async (c) => {
    const { promptData, options } = c.req.valid('json');

    // console.log('[API] Received request:', JSON.stringify({ promptData, options }, null, 2));

    try {
      // customTextのundefinedをnullに変換
      const normalizedPromptData = {
        ...promptData,
        category: {
          ...promptData.category,
          customText: promptData.category.customText ?? null,
        },
        details: promptData.details.map((detail) => ({
          ...detail,
          customText: detail.customText ?? null,
        })),
        colors: promptData.colors.map((color) => ({
          ...color,
          customText: color.customText ?? null,
        })),
        style: promptData.style
          ? {
              ...promptData.style,
              customText: promptData.style.customText ?? null,
            }
          : undefined,
        mood: promptData.mood
          ? {
              ...promptData.mood,
              customText: promptData.mood.customText ?? null,
            }
          : undefined,
        lighting: promptData.lighting
          ? {
              ...promptData.lighting,
              customText: promptData.lighting.customText ?? null,
            }
          : undefined,
      };

      // プロンプト生成
      const startTime = Date.now();
      const prompt = await generatePrompt(normalizedPromptData, options, c.env);

      // 使用されたキーワードの抽出
      const usedKeywords = extractKeywords(prompt);

      const response: GeneratePromptResponse = {
        prompt,
        usedKeywords,
        generationTime: Date.now() - startTime,
      };

      // キャッシュに保存（1時間）- ローカル開発では無効化
      if (c?.env?.ENVIRONMENT !== 'development') {
        try {
          if (c?.env?.CACHE) {
            // キーをハッシュ化して512バイト制限を回避
            const cacheKey = await generateCacheKey('prompt', { promptData, options });
            await c.env.CACHE.put(cacheKey, JSON.stringify(response), {
              expirationTtl: 3600,
            });
          }
        } catch (cacheError) {
          // Logger is not available here, using console.warn for cache errors
          console.warn('Cache save failed:', cacheError);
          // キャッシュ保存失敗は無視して続行
        }
      }

      return c.json(createSuccessResponse(response));
    } catch (error) {
      // Logger is not available here, using console.error for critical errors
      console.error('Prompt generation error:', error);
      return c.json(createErrorResponse(error, 'プロンプト生成に失敗しました'), 500);
    }
  }
);

// GET /api/v1/prompt/templates - プロンプトテンプレート一覧
promptRoute.get('/templates', async (c) => {
  // TODO: テンプレート機能の実装
  return c.json({
    success: true,
    data: {
      templates: [],
    },
    timestamp: new Date().toISOString(),
  });
});

// ヘルパー関数: キーワード抽出
function extractKeywords(prompt: string): string[] {
  // シンプルな実装：カンマで分割して前後の空白を削除
  return prompt
    .split(',')
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
}
