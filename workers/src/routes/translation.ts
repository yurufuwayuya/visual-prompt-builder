/**
 * 翻訳関連のルート
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Bindings } from '../types';
import type { TranslationResponse } from '@visual-prompt-builder/shared';
import { createSuccessResponse, createErrorResponse, generateCacheKey } from '@visual-prompt-builder/shared';
import { translationSchema } from '../validators/translation';

export const translationRoute = new Hono<{ Bindings: Bindings }>();

// POST /api/v1/translation/translate - テキスト翻訳
translationRoute.post(
  '/translate',
  zValidator('json', translationSchema),
  async (c) => {
    const { text, sourceLang, targetLang } = c.req.valid('json');
    
    // 同じ言語の場合はそのまま返す
    if (sourceLang === targetLang) {
      const response: TranslationResponse = {
        translatedText: text,
        detectedLanguage: sourceLang,
        confidence: 1.0,
      };
      return c.json(createSuccessResponse(response));
    }
    
    try {
      // キャッシュチェック
      const cacheKey = await generateCacheKey('translation', { sourceLang, targetLang, text });
      const cached = await c.env.CACHE.get(cacheKey);
      if (cached) {
        const cachedResponse = createSuccessResponse(JSON.parse(cached));
        return c.json({ ...cachedResponse, cached: true });
      }
      
      // TODO: 実際の翻訳API実装
      // 現在はモック実装
      const translatedText = await mockTranslate(text, sourceLang, targetLang);
      
      const response: TranslationResponse = {
        translatedText,
        detectedLanguage: sourceLang,
        confidence: 0.95,
      };
      
      // キャッシュに保存（24時間）
      await c.env.CACHE.put(cacheKey, JSON.stringify(response), {
        expirationTtl: 86400,
      });
      
      return c.json(createSuccessResponse(response));
    } catch (error) {
      console.error('Translation error:', error);
      return c.json(
        createErrorResponse(error, '翻訳に失敗しました'),
        500
      );
    }
  }
);

// POST /api/v1/translation/batch - バッチ翻訳
translationRoute.post('/batch', async (c) => {
  // TODO: バッチ翻訳の実装
  return c.json(createErrorResponse(new Error('Not implemented')), 501);
});

// モック翻訳関数（実際のAPIが実装されるまでの仮実装）
async function mockTranslate(
  text: string,
  sourceLang: 'ja' | 'en',
  targetLang: 'ja' | 'en'
): Promise<string> {
  // 簡単な辞書ベースの翻訳
  const dictionary: Record<string, Record<string, string>> = {
    'ja-en': {
      '風景': 'landscape',
      '動物': 'animal',
      '人物': 'person',
      '抽象画': 'abstract',
      '花': 'flower',
      '食べ物': 'food',
      '建物': 'building',
      '乗り物': 'vehicle',
      'ファンタジー': 'fantasy',
      '宇宙': 'space',
      '物': 'object',
      '模様': 'pattern',
    },
    'en-ja': {
      'landscape': '風景',
      'animal': '動物',
      'person': '人物',
      'abstract': '抽象画',
      'flower': '花',
      'food': '食べ物',
      'building': '建物',
      'vehicle': '乗り物',
      'fantasy': 'ファンタジー',
      'space': '宇宙',
      'object': '物',
      'pattern': '模様',
    },
  };
  
  const dictKey = `${sourceLang}-${targetLang}`;
  const dict = dictionary[dictKey] || {};
  
  // 辞書にあれば翻訳、なければそのまま返す
  return dict[text] || text;
}