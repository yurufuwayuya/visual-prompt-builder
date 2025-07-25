/**
 * Replicate API を使用した画像生成サービス
 */

import { createDataUrl } from '../../utils/imageProcessing';
import { uploadToR2 } from '../r2Storage';
import { uploadToR2S3, deleteFromR2S3 } from '../r2S3Upload';
import type { Bindings } from '../../types';
import { createLogger } from '../../utils/logger';

// Create logger instance
const logger = createLogger({ prefix: 'Replicate' });

// Replicateの画像生成モデル
// モデル名とバージョンIDのマッピング
const REPLICATE_MODELS = {
  'flux-fill': {
    name: 'black-forest-labs/flux-fill-dev',
    version: null, // Official model - no version needed
    isOfficial: true,
  },
  'flux-variations': {
    name: 'black-forest-labs/flux-redux-schnell',
    version: null, // Official model - no version needed
    isOfficial: true,
  },
  'flux-canny': {
    name: 'black-forest-labs/flux-dev',
    version: null, // Official model - no version needed
    isOfficial: true,
  },
  'sdxl-img2img': {
    name: 'stability-ai/sdxl',
    version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
    isOfficial: false,
  },
} as const;

type ModelId = keyof typeof REPLICATE_MODELS;

interface ReplicateOptions {
  width: number;
  height: number;
  strength: number;
  steps: number;
  guidanceScale: number;
  negativePrompt?: string;
  outputFormat: 'jpeg' | 'png';
}

interface ReplicatePredictionResponse {
  id: string;
  version: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  urls: {
    get: string;
    cancel: string;
  };
  error?: string;
  logs?: string;
  output?: string[];
  metrics?: {
    predict_time?: number;
  };
}

/**
 * Get model-specific input parameters
 */
function getModelSpecificInput(
  modelId: ModelId,
  params: {
    image: string;
    prompt: string;
    options: ReplicateOptions;
  }
): Record<string, unknown> {
  const { image, prompt, options } = params;

  switch (modelId) {
    case 'flux-fill':
      // flux-fill-dev parameters (inpainting/outpainting)
      return {
        image: image,
        prompt: prompt,
        steps: Math.min(options.steps, 15), // Further reduced from 20 to 15
        guidance: Math.min(options.guidanceScale, 3.5), // Further reduced from 5 to 3.5
        strength: Math.min(options.strength, 0.8), // Limit strength to 0.8
        output_format: options.outputFormat,
        output_quality: 70, // Further reduced from 80 to 70
        negative_prompt: options.negativePrompt,
        // Enable memory-efficient generation
        enable_attention_slicing: true,
        enable_vae_slicing: true,
      };

    case 'flux-variations':
      // flux-redux-schnell parameters
      return {
        redux_image: image, // Note: flux-redux uses redux_image, not image
        num_outputs: 1,
        megapixels: '0.16', // Further reduced to 0.16MP (400x400) for extreme memory efficiency
        aspect_ratio: '1:1',
        output_format: options.outputFormat,
        // Note: flux-redux doesn't use prompt or guidance
      };

    case 'flux-canny':
      // flux-schnell parameters (text-to-image)
      return {
        prompt: prompt,
        num_outputs: 1,
        aspect_ratio: '1:1',
        output_format: options.outputFormat,
        output_quality: 70, // Further reduced from 80 to 70
      };

    case 'sdxl-img2img':
      // SDXL img2img parameters (optimized for memory efficiency)
      return {
        prompt: prompt,
        image: image,
        width: 512, // メモリ効率のため最小値に設定
        height: 512, // メモリ効率のため最小値に設定
        refine: 'no_refiner', // リファイナーを無効化してメモリ削減
        num_inference_steps: Math.min(options.steps, 15), // 20から15に削減
        guidance_scale: Math.min(options.guidanceScale, 3.5), // 5から3.5に削減
        prompt_strength: Math.min(options.strength, 0.8), // 強度を0.8に制限
        num_outputs: 1,
        scheduler: 'DPMSolverMultistep', // 高速かつメモリ効率的
        negative_prompt: options.negativePrompt || '',
        apply_watermark: false, // 透かし無効化でメモリ削減
        // メモリ最適化オプション
        enable_attention_slicing: true,
        enable_vae_slicing: true,
        enable_sequential_cpu_offload: true,
      };

    default:
      throw new Error(`Unknown model: ${modelId}`);
  }
}

/**
 * Replicate APIで画像を生成
 */
export async function generateWithReplicate(
  baseImage: string,
  prompt: string,
  options: ReplicateOptions,
  apiKey: string,
  modelId: ModelId = 'flux-fill',
  env?: Bindings
): Promise<{
  image: string;
  generationTime: number;
  model: string;
  cost?: {
    amount: number;
    currency: string;
  };
}> {
  const startTime = Date.now();

  // リトライ設定
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let lastError: Error | null = null;

  // メモリエラー時にパラメータを段階的に削減
  const modifiableOptions = { ...options };

  while (retryCount < MAX_RETRIES) {
    try {
      // 実際の生成処理を実行
      return await executeGenerationAttempt(
        baseImage,
        prompt,
        modifiableOptions,
        apiKey,
        modelId,
        env,
        startTime
      );
    } catch (error) {
      lastError = error as Error;

      // CUDA OOMエラーの場合のみリトライ
      if (
        lastError.message.includes('CUDA out of memory') ||
        lastError.message.includes('メモリが不足')
      ) {
        retryCount++;

        if (retryCount < MAX_RETRIES) {
          logger.warn('CUDA OOM detected, retrying with reduced parameters', {
            retryCount,
            modelId,
            currentSteps: modifiableOptions.steps,
            currentGuidance: modifiableOptions.guidanceScale,
          });

          // パラメータを段階的に削減（より積極的に）
          modifiableOptions.steps = Math.max(8, Math.floor(modifiableOptions.steps * 0.6));
          modifiableOptions.guidanceScale = Math.max(2, modifiableOptions.guidanceScale - 2);
          modifiableOptions.strength = Math.max(0.3, modifiableOptions.strength - 0.2);

          // 解像度も段階的に削減
          if (retryCount === 1) {
            modifiableOptions.width = Math.min(modifiableOptions.width, 640);
            modifiableOptions.height = Math.min(modifiableOptions.height, 640);
          } else if (retryCount === 2) {
            modifiableOptions.width = Math.min(modifiableOptions.width, 512);
            modifiableOptions.height = Math.min(modifiableOptions.height, 512);
          }

          // リトライ間隔（指数バックオフ）
          await new Promise((resolve) => setTimeout(resolve, 2000 * retryCount));
          continue;
        }
      }

      // その他のエラーまたは最後のリトライ後はエラーを再スロー
      throw lastError;
    }
  }

  // ここには到達しないはずだが、念のため
  throw lastError || new Error('Failed to generate image after retries');
}

/**
 * 実際の画像生成処理（リトライ可能な部分を分離）
 */
async function executeGenerationAttempt(
  baseImage: string,
  prompt: string,
  options: ReplicateOptions,
  apiKey: string,
  modelId: ModelId,
  env: Bindings | undefined,
  startTime: number
): Promise<{
  image: string;
  generationTime: number;
  model: string;
  cost?: {
    amount: number;
    currency: string;
  };
}> {
  // 入力画像の準備
  const imageDataUrl = baseImage.startsWith('data:')
    ? baseImage
    : createDataUrl(baseImage, 'image/png');

  // 入力画像のサイズチェック（全モデル共通）
  try {
    // Base64から画像のサイズを検証
    const base64Data = imageDataUrl.includes(',') ? imageDataUrl.split(',')[1] : imageDataUrl;

    // Base64のサイズから実際のバイト数を計算（約3/4）
    const sizeInBytes = (base64Data.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    // より厳格な画像サイズ制限
    if (sizeInMB > 5) {
      logger.error('Input image is too large, may cause CUDA OOM', {
        sizeInMB: sizeInMB.toFixed(2),
        modelId: modelId,
      });
      throw new Error(
        `画像が大きすぎます（${sizeInMB.toFixed(1)}MB）。5MB以下の画像を使用してください。`
      );
    } else if (sizeInMB > 3) {
      logger.warn('Input image is large, may cause memory issues', {
        sizeInMB: sizeInMB.toFixed(2),
        modelId: modelId,
      });

      // 大きな画像の場合、パラメータを自動調整
      if (sizeInMB > 4) {
        options.steps = Math.min(options.steps, 15);
        options.guidanceScale = Math.min(options.guidanceScale, 3.5);
        logger.info('Auto-adjusting parameters for large image', {
          steps: options.steps,
          guidanceScale: options.guidanceScale,
        });
      }
    }

    // SDXLモデル固有の最小サイズチェック
    if (modelId === 'sdxl-img2img') {
      // 最小サイズのBase64画像（1x1ピクセル）は約100文字程度
      // SDXLには最低でも256x256以上の画像が必要
      // Note: This is an approximation - actual image dimensions depend on compression
      if (base64Data.length < 10000) {
        logger.warn('Input image might be too small for SDXL model', {
          base64Length: base64Data.length,
          modelId: modelId,
        });

        // オプションでwidth/heightが指定されていない場合はデフォルト値を設定
        if (!options.width || options.width < 256) {
          options.width = 512;
        }
        if (!options.height || options.height < 256) {
          options.height = 512;
        }
      }
    }

    // FLUXモデルの場合の推奨サイズログ
    if (modelId.startsWith('flux-')) {
      logger.info('Processing image for FLUX model', {
        sizeInMB: sizeInMB.toFixed(2),
        modelId: modelId,
        aspectRatio: '1:1 (fixed)',
      });
    }
  } catch (error) {
    logger.error('Failed to validate input image size:', error);
    if (error instanceof Error && error.message.includes('画像が大きすぎます')) {
      throw error; // Re-throw size limit errors
    }
  }

  // Upload image to R2 and get HTTP URL
  let imageUrl: string;
  let uploadedImageKey: string | null = null;

  // For local development, try using a public image hosting service as fallback
  const isLocalDev = env?.ENVIRONMENT === 'development';

  // Check if we should use S3 API (preferred) or R2 binding
  const useS3Api =
    env?.R2_ACCESS_KEY_ID &&
    env?.R2_SECRET_ACCESS_KEY &&
    (env?.R2_S3_API_DEV || env?.R2_S3_API_PROD);

  if (useS3Api) {
    // Use S3-compatible API
    try {
      const uploadResult = await uploadToR2S3(imageDataUrl, env, {
        keyPrefix: 'replicate-input',
        expiresIn: 3600, // 1 hour
      });
      imageUrl = uploadResult.url;
      uploadedImageKey = uploadResult.key;
      logger.debug('R2 S3 upload successful:', { url: imageUrl, key: uploadedImageKey });
    } catch (error) {
      logger.error('Failed to upload image to R2 via S3 API:', error);

      // In production, try one more time with a delay
      if (!isLocalDev) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          const uploadResult = await uploadToR2S3(imageDataUrl, env, {
            keyPrefix: 'replicate-input',
            expiresIn: 3600, // 1 hour
          });
          imageUrl = uploadResult.url;
          uploadedImageKey = uploadResult.key;
          logger.info('R2 S3 upload retry successful:', { url: imageUrl, key: uploadedImageKey });
        } catch (retryError) {
          logger.error('R2 S3 upload retry failed:', retryError);
          throw new Error('Failed to prepare image for processing. R2 storage is unavailable.');
        }
      } else {
        throw new Error(
          'Failed to prepare image for processing in development. Please check R2 configuration.'
        );
      }
    }
  } else if (env?.IMAGE_BUCKET && env?.R2_CUSTOM_DOMAIN) {
    // Fallback to R2 binding
    const isR2PubliclyAccessible = !env.R2_CUSTOM_DOMAIN.includes('r2.cloudflarestorage.com');

    if (isR2PubliclyAccessible) {
      try {
        const uploadResult = await uploadToR2(env.IMAGE_BUCKET, imageDataUrl, {
          keyPrefix: 'replicate-input',
          expiresIn: 3600, // 1 hour
          customDomain: env.R2_CUSTOM_DOMAIN,
          env: env,
        });
        imageUrl = uploadResult.url;
        uploadedImageKey = uploadResult.key;
        logger.debug('R2 upload successful:', { url: imageUrl, key: uploadedImageKey });
      } catch (error) {
        logger.error('Failed to upload image to R2:', error);
        throw new Error('Failed to prepare image for processing. R2 storage is unavailable.');
      }
    } else {
      throw new Error('R2 custom domain is not properly configured for public access.');
    }
  } else {
    throw new Error('Image storage is not properly configured. Please check R2 configuration.');
  }

  // Replicate APIに予測リクエストを送信
  const modelConfig = REPLICATE_MODELS[modelId];
  let apiUrl: string;
  let requestBody: Record<string, unknown>;

  if (modelConfig.isOfficial) {
    // Official models use the model endpoint directly without version
    apiUrl = `https://api.replicate.com/v1/models/${modelConfig.name}/predictions`;
    requestBody = {
      input: getModelSpecificInput(modelId, {
        image: imageUrl,
        prompt: prompt,
        options: options,
      }),
    };
  } else {
    // Standard models use the general predictions endpoint with version
    apiUrl = `https://api.replicate.com/v1/predictions`;
    requestBody = {
      version: modelConfig.version,
      input: getModelSpecificInput(modelId, {
        image: imageUrl,
        prompt: prompt,
        options: options,
      }),
    };
  }

  logger.info('Creating Replicate prediction:', {
    model: modelConfig.name,
    version: modelConfig.version,
    isOfficial: modelConfig.isOfficial,
    apiUrl: apiUrl,
    imageUrl: imageUrl,
    promptLength: prompt.length,
    options: options,
  });

  const createResponse = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    logger.error('Replicate API error:', {
      status: createResponse.status,
      error: error,
      model: modelConfig.name,
      url: apiUrl,
    });
    throw new Error(`Replicate API error: ${createResponse.status} - ${error}`);
  }

  const prediction = (await createResponse.json()) as ReplicatePredictionResponse;

  // 予測の完了を待つ（ポーリング）
  let finalPrediction = prediction;
  const maxWaitTime = 90000; // 90秒（メモリ効率的な処理のため時間を延長）
  const pollInterval = 1000; // 1秒
  const endTime = Date.now() + maxWaitTime;

  while (
    finalPrediction.status !== 'succeeded' &&
    finalPrediction.status !== 'failed' &&
    Date.now() < endTime
  ) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));

    const statusResponse = await fetch(finalPrediction.urls.get, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!statusResponse.ok) {
      throw new Error(`Failed to get prediction status: ${statusResponse.status}`);
    }

    finalPrediction = (await statusResponse.json()) as ReplicatePredictionResponse;
  }

  // エラーチェック
  if (finalPrediction.status === 'failed') {
    logger.error('Replicate prediction failed:', {
      error: finalPrediction.error,
      logs: finalPrediction.logs,
      status: finalPrediction.status,
      predictionId: finalPrediction.id,
    });

    // CUDA OOMエラーの特別処理
    if (finalPrediction.error?.includes('CUDA out of memory')) {
      throw new Error(
        '画像生成に必要なメモリが不足しています。' +
          'より小さい画像サイズを使用するか、FluxモデルやDELL-E 3をお試しください。'
      );
    }

    throw new Error(`Image generation failed: ${finalPrediction.error || 'Unknown error'}`);
  }

  if (finalPrediction.status !== 'succeeded') {
    throw new Error('Image generation timed out');
  }

  // 出力画像の取得
  if (!finalPrediction.output || finalPrediction.output.length === 0) {
    throw new Error('No output image generated');
  }

  const outputImageUrl = finalPrediction.output[0];

  // 画像をダウンロードしてBase64に変換（リトライ機能付き）
  const MAX_RETRIES = 3;
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB limit
  let lastError: Error | null = null;
  let imageBuffer: ArrayBuffer | undefined;

  for (let retry = 0; retry < MAX_RETRIES; retry++) {
    try {
      const imageResponse = await fetch(outputImageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download generated image: ${imageResponse.status}`);
      }

      // 画像サイズチェック
      const contentLength = imageResponse.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE) {
        throw new Error('Generated image exceeds size limit (10MB)');
      }

      imageBuffer = await imageResponse.arrayBuffer();

      // バッファサイズの最終チェック
      if (imageBuffer.byteLength > MAX_IMAGE_SIZE) {
        throw new Error('Generated image exceeds size limit (10MB)');
      }

      break; // 成功したのでループを抜ける
    } catch (error) {
      lastError = error as Error;
      if (retry < MAX_RETRIES - 1) {
        // 次のリトライまで待機（指数バックオフ）
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retry + 1)));
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  if (!imageBuffer) {
    throw new Error('Failed to download image after retries');
  }

  // 大きな画像でもスタックオーバーフローを防ぐため、チャンク単位で処理
  const uint8Array = new Uint8Array(imageBuffer);
  let binary = '';
  const chunkSize = 0x8000; // 32KB chunks
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  const base64Image = btoa(binary);

  // Clean up uploaded input image from R2 (only if we actually uploaded to R2)
  if (uploadedImageKey && !isLocalDev) {
    try {
      if (useS3Api) {
        await deleteFromR2S3(uploadedImageKey, env);
      } else if (env?.IMAGE_BUCKET) {
        await env.IMAGE_BUCKET.delete(uploadedImageKey);
      }
    } catch (error) {
      logger.error('Failed to clean up uploaded image:', error);
      // Don't throw here, as the main operation succeeded
    }
  }

  // コスト計算（Replicateの時間ベース課金）
  const predictTime = finalPrediction.metrics?.predict_time || 0;
  // 環境変数でコスト単価を設定可能にする（デフォルト: $0.000225/秒）
  const costPerSecond = 0.000225; // Note: 環境変数対応は将来的に検討
  const cost = predictTime * costPerSecond;

  return {
    image: base64Image,
    generationTime: Date.now() - startTime,
    model: `replicate/${modelId}`,
    cost: {
      amount: Math.round(cost * 1000) / 1000, // 小数点3桁まで
      currency: 'USD',
    },
  };
}

/**
 * 利用可能なReplicateモデルの一覧を取得
 */
export function getAvailableReplicateModels() {
  return [
    {
      id: 'flux-fill',
      name: 'FLUX Fill',
      description: 'Professional inpainting and outpainting model',
      version: REPLICATE_MODELS['flux-fill'].name,
    },
    {
      id: 'flux-variations',
      name: 'FLUX Variations',
      description: 'Create variations of existing images',
      version: REPLICATE_MODELS['flux-variations'].name,
    },
    {
      id: 'flux-canny',
      name: 'FLUX Canny',
      description: 'Edge-guided image generation',
      version: REPLICATE_MODELS['flux-canny'].name,
    },
    {
      id: 'sdxl-img2img',
      name: 'SDXL img2img',
      description: 'Stable Diffusion XL for image-to-image generation',
      version: REPLICATE_MODELS['sdxl-img2img'].name,
    },
  ];
}
