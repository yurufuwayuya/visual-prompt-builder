/**
 * 翻訳関連のルート
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Bindings } from '../types';
import type { TranslationResponse } from '@visual-prompt-builder/shared';
import {
  createSuccessResponse,
  createErrorResponse,
  generateCacheKey,
} from '@visual-prompt-builder/shared';
import { translationSchema } from '../validators/translation';

export const translationRoute = new Hono<{ Bindings: Bindings }>();

// デバッグ用の最小限のテストルート
translationRoute.get('/test', (c) => {
  return c.json({
    success: true,
    message: 'Translation route is working',
    env: !!c.env,
    cache: !!c?.env?.CACHE,
  });
});

// POSTテストルート
translationRoute.post('/test-post', async (c) => {
  try {
    const body = await c.req.json();
    return c.json({
      success: true,
      message: 'POST test working',
      body: body,
      env: !!c.env,
      cache: !!c?.env?.CACHE,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// /trans エンドポイント（/translateの代替）
translationRoute.post('/trans', zValidator('json', translationSchema), async (c) => {
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
    // キャッシュチェック（KVが利用可能な場合のみ）
    let cached = null;
    if (c?.env?.CACHE) {
      try {
        const cacheKey = await generateCacheKey('translation', { sourceLang, targetLang, text });
        cached = await c.env.CACHE.get(cacheKey);
        if (cached) {
          const cachedResponse = createSuccessResponse(JSON.parse(cached));
          return c.json({ ...cachedResponse, cached: true });
        }
      } catch (cacheError) {
        console.warn('Cache read error:', cacheError);
        // キャッシュエラーは無視して続行
      }
    }

    // MyMemory APIを使用して翻訳
    const translatedText = await translateWithMyMemory(text, sourceLang, targetLang);

    const response: TranslationResponse = {
      translatedText,
      detectedLanguage: sourceLang,
      confidence: 0.95,
    };

    // キャッシュに保存（24時間）- KVが利用可能な場合のみ
    if (c?.env?.CACHE) {
      try {
        const cacheKey = await generateCacheKey('translation', { sourceLang, targetLang, text });
        await c.env.CACHE.put(cacheKey, JSON.stringify(response), {
          expirationTtl: 86400,
        });
      } catch (cacheError) {
        console.warn('Cache write error:', cacheError);
        // キャッシュエラーは無視して続行
      }
    }

    return c.json(createSuccessResponse(response));
  } catch (error) {
    console.error('Translation error:', error);

    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }

    return c.json(createErrorResponse(error, '翻訳に失敗しました'), 500);
  }
});

// POST /api/v1/translation/translate - テキスト翻訳
translationRoute.post('/translate', zValidator('json', translationSchema), async (c) => {
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
    // キャッシュチェック（KVが利用可能な場合のみ）
    let cached = null;
    // console.log('[Translation API] Checking cache availability:', !!c?.env?.CACHE);
    if (c?.env?.CACHE) {
      try {
        // console.log('[Translation API] Attempting to read from cache');
        const cacheKey = await generateCacheKey('translation', { sourceLang, targetLang, text });
        cached = await c.env.CACHE.get(cacheKey);
        if (cached) {
          const cachedResponse = createSuccessResponse(JSON.parse(cached));
          return c.json({ ...cachedResponse, cached: true });
        }
      } catch (cacheError) {
        console.warn('Cache read error:', cacheError);
        // キャッシュエラーは無視して続行
      }
    }

    // MyMemory APIを使用して翻訳
    const translatedText = await translateWithMyMemory(text, sourceLang, targetLang);

    const response: TranslationResponse = {
      translatedText,
      detectedLanguage: sourceLang,
      confidence: 0.95,
    };

    // キャッシュに保存（24時間）- KVが利用可能な場合のみ
    if (c?.env?.CACHE) {
      try {
        const cacheKey = await generateCacheKey('translation', { sourceLang, targetLang, text });
        await c.env.CACHE.put(cacheKey, JSON.stringify(response), {
          expirationTtl: 86400,
        });
      } catch (cacheError) {
        console.warn('Cache write error:', cacheError);
        // キャッシュエラーは無視して続行
      }
    }

    return c.json(createSuccessResponse(response));
  } catch (error) {
    console.error('[Translation API] Translation error:', error);

    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error('[Translation API] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause,
      });
    } else {
      console.error('[Translation API] Non-Error object thrown:', error);
    }

    const errorResponse = createErrorResponse(error, '翻訳に失敗しました');
    // デバッグ用にスタックトレースを追加
    if (error instanceof Error) {
      const debugResponse = errorResponse as { stack?: string; name?: string };
      debugResponse.stack = error.stack;
      debugResponse.name = error.name;
    }
    return c.json(errorResponse, 500);
  }
});

// POST /api/v1/translation/batch - バッチ翻訳
translationRoute.post(
  '/batch',
  zValidator(
    'json',
    z.object({
      texts: z.array(z.string()).min(1).max(100),
      sourceLang: z.enum(['ja', 'en']),
      targetLang: z.enum(['ja', 'en']),
    })
  ),
  async (c) => {
    const { texts, sourceLang, targetLang } = c.req.valid('json');

    // 同じ言語の場合はそのまま返す
    if (sourceLang === targetLang) {
      return c.json(
        createSuccessResponse({
          translations: texts.map((text) => ({
            originalText: text,
            translatedText: text,
            detectedLanguage: sourceLang,
            confidence: 1.0,
          })),
        })
      );
    }

    try {
      // 並列で翻訳を実行（最大5つずつ）
      const batchSize = 5;
      const results = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchPromises = batch.map(async (text) => {
          // キャッシュチェック（KVが利用可能な場合のみ）
          let cached = null;
          if (c?.env?.CACHE) {
            try {
              const cacheKey = await generateCacheKey('translation', {
                sourceLang,
                targetLang,
                text,
              });
              cached = await c.env.CACHE.get(cacheKey);

              if (cached) {
                const cachedData = JSON.parse(cached);
                return {
                  originalText: text,
                  translatedText: cachedData.translatedText,
                  detectedLanguage: cachedData.detectedLanguage,
                  confidence: cachedData.confidence,
                  cached: true,
                };
              }
            } catch (cacheError) {
              console.warn('Batch cache read error:', cacheError);
              // キャッシュエラーは無視して続行
            }
          }

          // 翻訳実行
          const translatedText = await translateWithMyMemory(text, sourceLang, targetLang);
          const result = {
            originalText: text,
            translatedText,
            detectedLanguage: sourceLang,
            confidence: 0.95,
          };

          // キャッシュに保存（KVが利用可能な場合のみ）
          if (c?.env?.CACHE) {
            try {
              const cacheKey = await generateCacheKey('translation', {
                sourceLang,
                targetLang,
                text,
              });
              await c.env.CACHE.put(
                cacheKey,
                JSON.stringify({
                  translatedText,
                  detectedLanguage: sourceLang,
                  confidence: 0.95,
                }),
                {
                  expirationTtl: 86400,
                }
              );
            } catch (cacheError) {
              console.warn('Batch cache write error:', cacheError);
              // キャッシュエラーは無視して続行
            }
          }

          return result;
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      return c.json(createSuccessResponse({ translations: results }));
    } catch (error) {
      console.error('Batch translation error:', error);
      return c.json(createErrorResponse(error, 'バッチ翻訳に失敗しました'), 500);
    }
  }
);

// MyMemory Translation APIを使用した翻訳関数
async function translateWithMyMemory(
  text: string,
  sourceLang: 'ja' | 'en',
  targetLang: 'ja' | 'en'
): Promise<string> {
  try {
    // デバッグログ（本番環境では非表示）
    // console.log('Translating text:', { text, sourceLang, targetLang });

    // MyMemory APIのエンドポイント
    const langPair = `${sourceLang}|${targetLang}`;
    const encodedText = encodeURIComponent(text);
    const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${langPair}`;

    // console.log('MyMemory API URL:', url);

    // APIリクエスト
    const response = await fetch(url);

    // console.log('MyMemory API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MyMemory API error response:', errorText);
      throw new Error(`MyMemory API returned ${response.status}: ${errorText}`);
    }

    interface MyMemoryResponse {
      responseData: {
        translatedText: string;
      };
      responseStatus: number;
    }
    const data = await response.json<MyMemoryResponse>();
    // console.log('MyMemory API response data:', data);

    // レスポンスの検証
    if (!data || !data.responseData) {
      console.error('Invalid MyMemory API response:', data);
      throw new Error('Invalid translation response');
    }

    if (data.responseStatus !== 200) {
      console.error('MyMemory API error:', data);
      throw new Error(`Translation failed with status: ${data.responseStatus}`);
    }

    // 翻訳結果を返す
    return data.responseData.translatedText || text;
  } catch (error) {
    // エラー時はフォールバック辞書を使用
    console.error('MyMemory translation error:', error);
    return fallbackTranslate(text, sourceLang, targetLang);
  }
}

// フォールバック翻訳関数（MyMemory APIが使用できない場合）
function fallbackTranslate(text: string, sourceLang: 'ja' | 'en', targetLang: 'ja' | 'en'): string {
  // 基本的な辞書ベースの翻訳
  const dictionary: Record<string, Record<string, string>> = {
    'ja-en': {
      風景: 'landscape',
      動物: 'animal',
      人物: 'person',
      抽象画: 'abstract',
      花: 'flower',
      食べ物: 'food',
      建物: 'building',
      乗り物: 'vehicle',
      ファンタジー: 'fantasy',
      宇宙: 'space',
      物: 'object',
      模様: 'pattern',
      // 追加の基本語彙
      猫: 'cat',
      犬: 'dog',
      鳥: 'bird',
      魚: 'fish',
      木: 'tree',
      山: 'mountain',
      海: 'sea',
      空: 'sky',
      雲: 'cloud',
      太陽: 'sun',
      月: 'moon',
      星: 'star',
    },
    'en-ja': {
      landscape: '風景',
      animal: '動物',
      person: '人物',
      abstract: '抽象画',
      flower: '花',
      food: '食べ物',
      building: '建物',
      vehicle: '乗り物',
      fantasy: 'ファンタジー',
      space: '宇宙',
      object: '物',
      pattern: '模様',
      // 追加の基本語彙
      cat: '猫',
      dog: '犬',
      bird: '鳥',
      fish: '魚',
      tree: '木',
      mountain: '山',
      sea: '海',
      sky: '空',
      cloud: '雲',
      sun: '太陽',
      moon: '月',
      star: '星',
    },
  };

  const dictKey = `${sourceLang}-${targetLang}`;
  const dict = dictionary[dictKey] || {};

  // 辞書にあれば翻訳、なければそのまま返す
  return dict[text] || text;
}
