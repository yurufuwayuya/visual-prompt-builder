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
// Using official model names (versions are handled automatically by Replicate)
const REPLICATE_MODELS = {
  'flux-fill': 'black-forest-labs/flux-schnell', // Fast text-to-image model
  'flux-variations': 'black-forest-labs/flux-redux-schnell', // Fast image variations
  'flux-canny': 'black-forest-labs/flux-dev', // Standard FLUX model
  'sdxl-img2img': 'stability-ai/sdxl', // Stable Diffusion XL img2img
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
      // flux-schnell parameters (text-to-image, uses input image as reference)
      return {
        prompt: `${prompt}, based on the provided image`,
        num_outputs: 1,
        aspect_ratio: '1:1',
        output_format: options.outputFormat,
        output_quality: 90,
        disable_safety_checker: false,
      };

    case 'flux-variations':
      // flux-redux-schnell parameters
      return {
        redux_image: image, // Note: flux-redux uses redux_image, not image
        num_outputs: 1,
        megapixels: '1', // Use 1MP for 1024x1024
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
        output_quality: 90,
      };

    case 'sdxl-img2img':
      // SDXL img2img parameters
      return {
        prompt: prompt,
        image: image,
        refine: 'no_refiner',
        num_inference_steps: Math.min(options.steps, 50),
        guidance_scale: options.guidanceScale,
        prompt_strength: options.strength,
        num_outputs: 1,
        scheduler: 'DPMSolverMultistep',
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

  // 入力画像の準備
  const imageDataUrl = baseImage.startsWith('data:')
    ? baseImage
    : createDataUrl(baseImage, 'image/png');

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
  // Official models use the model endpoint directly without version
  const modelName = REPLICATE_MODELS[modelId];
  const apiUrl = `https://api.replicate.com/v1/models/${modelName}/predictions`;

  logger.info('Creating Replicate prediction:', {
    model: modelName,
    imageUrl: imageUrl,
    prompt: prompt.substring(0, 100) + '...',
    options: options,
  });

  const createResponse = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: getModelSpecificInput(modelId, {
        image: imageUrl, // Use HTTP URL instead of data URL
        prompt: prompt,
        options: options,
      }),
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    logger.error('Replicate API error:', {
      status: createResponse.status,
      error: error,
      model: modelName,
      url: apiUrl,
    });
    throw new Error(`Replicate API error: ${createResponse.status} - ${error}`);
  }

  const prediction = (await createResponse.json()) as ReplicatePredictionResponse;

  // 予測の完了を待つ（ポーリング）
  let finalPrediction = prediction;
  const maxWaitTime = 60000; // 60秒
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
    });
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
      version: REPLICATE_MODELS['flux-fill'],
    },
    {
      id: 'flux-variations',
      name: 'FLUX Variations',
      description: 'Create variations of existing images',
      version: REPLICATE_MODELS['flux-variations'],
    },
    {
      id: 'flux-canny',
      name: 'FLUX Canny',
      description: 'Edge-guided image generation',
      version: REPLICATE_MODELS['flux-canny'],
    },
  ];
}
