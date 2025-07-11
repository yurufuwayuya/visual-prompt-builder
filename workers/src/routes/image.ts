/**
 * 画像生成関連のルート
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Bindings } from '../types';
import {
  createSuccessResponse,
  createErrorResponse,
  generateCacheKey,
} from '@visual-prompt-builder/shared';

// リクエストスキーマ
const generateImageSchema = z.object({
  // ベース画像（Base64エンコード）
  baseImage: z.string().min(1, '画像データが必要です'),
  // プロンプト（画像生成の指示）
  prompt: z.string().min(1, 'プロンプトが必要です'),
  // オプション設定
  options: z
    .object({
      // 画像サイズ
      width: z.number().min(256).max(1024).default(512),
      height: z.number().min(256).max(1024).default(512),
      // 生成強度（0.0-1.0）: 0に近いほど元画像に忠実
      strength: z.number().min(0).max(1).default(0.75),
      // 生成ステップ数
      steps: z.number().min(10).max(50).default(30),
      // ガイダンススケール
      guidanceScale: z.number().min(1).max(20).default(7.5),
      // ネガティブプロンプト
      negativePrompt: z.string().optional(),
      // 出力フォーマット
      outputFormat: z.enum(['jpeg', 'png']).default('png'),
    })
    .optional(),
});

// レスポンス型
interface GenerateImageResponse {
  // 生成された画像（Base64エンコード）
  image: string;
  // 生成にかかった時間（ミリ秒）
  generationTime: number;
  // 使用したモデル
  model: string;
  // コスト情報
  cost?: {
    amount: number;
    currency: string;
  };
}

export const imageRoute = new Hono<{ Bindings: Bindings }>();

// POST /api/v1/image/generate - 画像生成（i2i）
imageRoute.post('/generate', zValidator('json', generateImageSchema), async (c) => {
  const { baseImage, prompt, options = {} } = c.req.valid('json');

  // デフォルト値の設定
  const finalOptions = {
    width: 512,
    height: 512,
    strength: 0.75,
    steps: 30,
    guidanceScale: 7.5,
    outputFormat: 'png' as const,
    ...options,
  };

  // Request logging (開発環境のみ)
  if (c?.env?.ENVIRONMENT === 'development') {
    console.log('[Image API] Received request:', {
      prompt,
      options: finalOptions,
      baseImageSize: baseImage.length,
    });
  }

  try {
    // キャッシュキーの生成
    const cacheKey = await generateCacheKey('image', {
      baseImage: baseImage.substring(0, 100), // 最初の100文字のみ使用
      prompt,
      options: finalOptions,
    });

    // キャッシュチェック（開発環境では無効）
    if (c?.env?.ENVIRONMENT !== 'development' && c?.env?.IMAGE_CACHE) {
      try {
        const cached = await c.env.IMAGE_CACHE.get(cacheKey);
        if (cached) {
          const cachedData = JSON.parse(cached) as GenerateImageResponse;
          return c.json(createSuccessResponse(cachedData));
        }
      } catch (cacheError) {
        console.warn('Cache read failed:', cacheError);
      }
    }

    // APIプロバイダーの選択
    const provider = c.env.IMAGE_PROVIDER || 'replicate';

    if (!c.env.IMAGE_API_KEY) {
      throw new Error('画像生成APIキーが設定されていません');
    }

    // 画像生成処理（プロバイダーに応じて実装を切り替え）
    const startTime = Date.now();
    let response: GenerateImageResponse;

    switch (provider) {
      case 'replicate':
        response = await generateWithReplicate(
          baseImage,
          prompt,
          finalOptions,
          c.env.IMAGE_API_KEY
        );
        break;
      case 'openai':
        response = await generateWithOpenAI(baseImage, prompt, finalOptions, c.env.IMAGE_API_KEY);
        break;
      case 'stability':
        response = await generateWithStability(
          baseImage,
          prompt,
          finalOptions,
          c.env.IMAGE_API_KEY
        );
        break;
      default:
        throw new Error(`サポートされていないプロバイダー: ${provider}`);
    }

    response.generationTime = Date.now() - startTime;

    // キャッシュに保存（24時間）
    if (c?.env?.ENVIRONMENT !== 'development' && c?.env?.IMAGE_CACHE) {
      try {
        await c.env.IMAGE_CACHE.put(cacheKey, JSON.stringify(response), {
          expirationTtl: 86400, // 24時間
        });
      } catch (cacheError) {
        console.warn('Cache save failed:', cacheError);
      }
    }

    return c.json(createSuccessResponse(response));
  } catch (error) {
    console.error('Image generation error:', error);
    return c.json(createErrorResponse(error, '画像生成に失敗しました'), 500);
  }
});

// GET /api/v1/image/models - 利用可能なモデル一覧
imageRoute.get('/models', async (c) => {
  const provider = c.env.IMAGE_PROVIDER || 'replicate';

  const models = {
    replicate: [
      {
        id: 'flux-fill',
        name: 'FLUX Fill',
        description: 'Professional inpainting and outpainting',
      },
      { id: 'flux-variations', name: 'FLUX Variations', description: 'Image variations' },
      { id: 'flux-canny', name: 'FLUX Canny', description: 'Edge-guided generation' },
    ],
    openai: [{ id: 'dall-e-3', name: 'DALL-E 3', description: 'High quality image generation' }],
    stability: [
      {
        id: 'sd-3.5-large',
        name: 'Stable Diffusion 3.5 Large',
        description: '8.1B parameter model',
      },
      {
        id: 'stable-image-ultra',
        name: 'Stable Image Ultra',
        description: 'Ultra quality generation',
      },
    ],
  };

  return c.json(
    createSuccessResponse({
      provider,
      models: models[provider as keyof typeof models] || [],
    })
  );
});

// プロバイダー別の実装
import { generateWithReplicate as replicateGenerate } from '../services/imageProviders/replicate';

// 画像生成オプションの型
type ImageGenerationOptions = {
  width: number;
  height: number;
  strength: number;
  steps: number;
  guidanceScale: number;
  negativePrompt?: string;
  outputFormat: 'jpeg' | 'png';
};

async function generateWithReplicate(
  baseImage: string,
  prompt: string,
  options: ImageGenerationOptions,
  apiKey: string
): Promise<GenerateImageResponse> {
  try {
    const result = await replicateGenerate(
      baseImage,
      prompt,
      {
        width: options.width,
        height: options.height,
        strength: options.strength,
        steps: options.steps,
        guidanceScale: options.guidanceScale,
        negativePrompt: options.negativePrompt,
        outputFormat: options.outputFormat,
      },
      apiKey,
      'flux-fill' // デフォルトモデル
    );

    return {
      image: result.image,
      generationTime: result.generationTime,
      model: result.model,
      cost: result.cost,
    };
  } catch (error) {
    console.error('Replicate generation error:', error);
    throw error;
  }
}

async function generateWithOpenAI(
  _baseImage: string,
  _prompt: string,
  _options: any,
  _apiKey: string
): Promise<GenerateImageResponse> {
  // TODO: OpenAI API実装
  throw new Error('OpenAI API実装は準備中です');
}

async function generateWithStability(
  _baseImage: string,
  _prompt: string,
  _options: any,
  _apiKey: string
): Promise<GenerateImageResponse> {
  // TODO: Stability AI API実装
  throw new Error('Stability AI API実装は準備中です');
}
