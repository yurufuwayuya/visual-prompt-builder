/**
 * 画像生成関連のルート
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Bindings } from '../types';
import { createSuccessResponse, generateCacheKey } from '@visual-prompt-builder/shared';
import { createSecureLogger, formatImageSize } from '../utils/secureLogger';
import { generateImageFingerprint } from '../utils/imageHash';
import { validateAndLogImageSize, validateImageSize } from '../utils/imageProcessing';
import { assessCudaOomRisk, applyRiskMitigation } from '../utils/imageValidator';

// リクエストスキーマ
const generateImageSchema = z.object({
  // ベース画像（Base64エンコード）
  baseImage: z.string().min(1, '画像データが必要です'),
  // プロンプト（画像生成の指示）
  prompt: z.string().min(1, 'プロンプトが必要です'),
  // オプション設定
  options: z
    .object({
      // 画像サイズ（CUDA OOM対策でより小さく制限）
      width: z.number().min(256).max(768).default(512),
      height: z.number().min(256).max(768).default(512),
      // 生成強度（0.0-1.0）: 0に近いほど元画像に忠実
      strength: z.number().min(0).max(0.9).default(0.7),
      // 生成ステップ数（メモリ効率のため上限を下げる）
      steps: z.number().min(8).max(30).default(15),
      // ガイダンススケール（メモリ効率のため上限を下げる）
      guidanceScale: z.number().min(1).max(10).default(5),
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
  // R2に保存された画像のURL（オプション）
  imageUrl?: string;
  // R2に保存された画像のキー（オプション）
  imageKey?: string;
}

export const imageRoute = new Hono<{ Bindings: Bindings }>();

// POST /api/v1/image/generate - 画像生成（i2i）
imageRoute.post('/generate', zValidator('json', generateImageSchema), async (c) => {
  const { baseImage, prompt, options = {} } = c.req.valid('json');

  // デフォルト値の設定（CUDA OOM対策でより保守的な値に）
  const finalOptions = {
    width: 512,
    height: 512,
    strength: 0.7,
    steps: 15,
    guidanceScale: 5,
    outputFormat: 'png' as const,
    ...options,
  };

  // Request logging (セキュアロガーを使用)
  const imageLogger = createSecureLogger({ prefix: 'Image API', env: c.env });
  const imageHash = await generateImageFingerprint(baseImage);
  imageLogger.info('Received image generation request', {
    prompt: prompt.substring(0, 100), // プロンプトの最初の100文字のみ
    options: finalOptions,
    imageSize: formatImageSize(baseImage.length),
    imageHash,
  });

  try {
    // 画像サイズの検証（CUDA OOM対策で制限を厳しく）
    if (!validateImageSize(baseImage, 5)) {
      throw new Error('画像サイズが大きすぎます（最大5MB）');
    }

    // Smartphone detection is handled in the frontend optimization

    // CUDA OOMリスク評価
    const riskAssessment = await assessCudaOomRisk(baseImage, 'sdxl-img2img', {
      steps: finalOptions.steps,
      guidanceScale: finalOptions.guidanceScale,
      strength: finalOptions.strength,
      width: finalOptions.width,
      height: finalOptions.height,
    });

    // 高リスクの場合はパラメータを自動調整
    if (riskAssessment.riskLevel === 'very-high' || riskAssessment.riskLevel === 'high') {
      imageLogger.warn('High CUDA OOM risk detected, adjusting parameters', {
        riskLevel: riskAssessment.riskLevel,
        recommendations: riskAssessment.recommendations,
      });

      // Apply risk mitigation using the utility function
      const mitigatedOptions = applyRiskMitigation(finalOptions, riskAssessment);
      Object.assign(finalOptions, mitigatedOptions);

      // ユーザーに通知するための情報を追加
      imageLogger.info('Parameters auto-adjusted for memory efficiency', finalOptions);
    }

    // 画像サイズの検証とログ出力（実際のリサイズはクライアント側で事前実行済み）
    const validatedImage = await validateAndLogImageSize(baseImage, 5);
    imageLogger.debug('Image validated:', {
      originalSize: baseImage.length,
      validatedSize: validatedImage.length,
    });
    // キャッシュキーの生成 - 既に計算済みのフィンガープリントを使用

    const cacheKey = await generateCacheKey('image', {
      baseImage: imageHash,
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
        imageLogger.warn('Cache read failed', cacheError);
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
          validatedImage,
          prompt,
          finalOptions,
          c.env.IMAGE_API_KEY,
          c.env
        );
        break;
      case 'openai':
        response = await generateWithOpenAI(
          validatedImage,
          prompt,
          finalOptions,
          c.env.IMAGE_API_KEY
        );
        break;
      case 'stability':
        response = await generateWithStability(
          validatedImage,
          prompt,
          finalOptions,
          c.env.IMAGE_API_KEY
        );
        break;
      default:
        throw new Error(`サポートされていないプロバイダー: ${provider}`);
    }

    response.generationTime = Date.now() - startTime;

    // 生成された画像をR2に保存
    if (c?.env?.IMAGE_BUCKET && c?.env?.R2_CUSTOM_DOMAIN) {
      try {
        const imageDataUrl = `data:image/${finalOptions.outputFormat};base64,${response.image}`;
        const uploadResult = await uploadToR2(c.env.IMAGE_BUCKET, imageDataUrl, {
          keyPrefix: 'generated',
          customDomain: c.env.R2_CUSTOM_DOMAIN,
          env: c.env,
        });

        // レスポンスに画像URLを追加
        const enhancedResponse = {
          ...response,
          imageUrl: uploadResult.url,
          imageKey: uploadResult.key,
        };

        // キャッシュに保存（24時間）
        if (c?.env?.ENVIRONMENT !== 'development' && c?.env?.IMAGE_CACHE) {
          try {
            await c.env.IMAGE_CACHE.put(cacheKey, JSON.stringify(enhancedResponse), {
              expirationTtl: 86400, // 24時間
            });
          } catch (cacheError) {
            // Use secure logger for cache errors
            imageLogger.warn('Cache save failed', cacheError);
          }
        }

        return c.json(createSuccessResponse(enhancedResponse));
      } catch (uploadError) {
        // Use secure logger for critical errors
        imageLogger.error('Failed to upload generated image to R2', uploadError);
        // アップロードに失敗しても、生成された画像は返す
      }
    }

    // キャッシュに保存（24時間）
    if (c?.env?.ENVIRONMENT !== 'development' && c?.env?.IMAGE_CACHE) {
      try {
        await c.env.IMAGE_CACHE.put(cacheKey, JSON.stringify(response), {
          expirationTtl: 86400, // 24時間
        });
      } catch (cacheError) {
        imageLogger.warn('Cache save failed', cacheError);
      }
    }

    return c.json(createSuccessResponse(response));
  } catch (error) {
    imageLogger.error('Image generation failed', error);

    // CUDA OOMエラーの特別処理
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('CUDA out of memory') || errorMessage.includes('メモリが不足')) {
      return c.json(
        {
          success: false,
          error:
            '画像生成に必要なメモリが不足しています。より小さな画像サイズを使用するか、パラメータを調整してください。',
          suggestions: [
            '画像サイズを512x512以下に設定',
            'ステップ数を15以下に設定',
            'ガイダンススケールを5以下に設定',
            '入力画像を5MB以下にリサイズ',
          ],
        },
        507 // Insufficient Storage
      );
    }

    // 本番環境では詳細なエラー情報を露出しない
    if (c.env.ENVIRONMENT === 'development') {
      const debugInfo = {
        success: false,
        error: error instanceof Error ? error.message : '画像生成に失敗しました',
        details: error instanceof Error ? error.stack : undefined,
        provider: c.env.IMAGE_PROVIDER || 'replicate',
        hasApiKey: !!c.env.IMAGE_API_KEY,
        hasR2AccessKey: !!c.env.R2_ACCESS_KEY_ID,
        hasR2SecretKey: !!c.env.R2_SECRET_ACCESS_KEY,
        r2CustomDomain: c.env.R2_CUSTOM_DOMAIN,
        timestamp: new Date().toISOString(),
      };
      return c.json(debugInfo, 500);
    }

    // Production error response
    return c.json(
      {
        success: false,
        error: '画像生成に失敗しました',
      },
      500
    );
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
import { uploadToR2 } from '../services/r2Storage';

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
  apiKey: string,
  env?: Bindings
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
      'sdxl-img2img', // SDXLを使用（img2img対応）
      env
    );

    return {
      image: result.image,
      generationTime: result.generationTime,
      model: result.model,
      cost: result.cost,
    };
  } catch (error) {
    const replicateLogger = createSecureLogger({ prefix: 'Replicate', env: env || {} });
    replicateLogger.error('Replicate generation failed', error);
    throw error;
  }
}

async function generateWithOpenAI(
  _baseImage: string,
  _prompt: string,
  _options: ImageGenerationOptions,
  _apiKey: string
): Promise<GenerateImageResponse> {
  // OpenAI API実装は今後追加予定（Issue #86で追跡）
  throw new Error('OpenAI API実装は準備中です');
}

async function generateWithStability(
  _baseImage: string,
  _prompt: string,
  _options: ImageGenerationOptions,
  _apiKey: string
): Promise<GenerateImageResponse> {
  // Stability AI API実装は今後追加予定（Issue #87で追跡）
  throw new Error('Stability AI API実装は準備中です');
}
