/**
 * Replicate API を使用した画像生成サービス
 */

import { createDataUrl } from '../../utils/imageProcessing';
import { uploadToR2 } from '../r2Storage';
import type { Bindings } from '../../types';

// Replicateの画像生成モデル
// Using official model names (versions are handled automatically by Replicate)
const REPLICATE_MODELS = {
  'flux-fill': 'black-forest-labs/flux-fill-dev', // Inpainting model
  'flux-variations': 'black-forest-labs/flux-redux-schnell', // Fast image variations
  'flux-canny': 'black-forest-labs/flux-canny-dev', // Edge-guided generation
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
      // flux-fill-pro parameters
      return {
        prompt: prompt,
        image: image,
        steps: options.steps,
        guidance: options.guidanceScale,
        output_format: options.outputFormat,
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

  // Check if R2 domain is properly configured for public access
  const isR2PubliclyAccessible =
    env.R2_CUSTOM_DOMAIN && !env.R2_CUSTOM_DOMAIN.includes('r2.cloudflarestorage.com');

  // Use R2 when custom domain is properly configured
  if (env?.IMAGE_BUCKET && isR2PubliclyAccessible) {
    try {
      const uploadResult = await uploadToR2(env.IMAGE_BUCKET, imageDataUrl, {
        keyPrefix: 'replicate-input',
        expiresIn: 3600, // 1 hour
        customDomain: env.R2_CUSTOM_DOMAIN,
      });
      imageUrl = uploadResult.url;
      uploadedImageKey = uploadResult.key;
      console.log('[DEBUG] R2 upload successful:', { url: imageUrl, key: uploadedImageKey });
    } catch (error) {
      console.error('Failed to upload image to R2:', error);

      // In development, try alternative methods
      if (isLocalDev) {
        console.log('[DEBUG] R2 upload failed in development, trying alternative method');

        try {
          // Try using file.io as a more reliable temporary hosting service
          const base64 = imageDataUrl.split(',')[1];
          const mimeType = imageDataUrl.match(/^data:([^;]+);/)?.[1] || 'image/png';

          const formData = new FormData();
          const blob = new Blob([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], {
            type: mimeType,
          });
          formData.append('file', blob, 'image.png');

          const uploadResponse = await fetch('https://file.io/?expires=1h', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload to file.io: ${uploadResponse.status}`);
          }

          const uploadData = (await uploadResponse.json()) as { success: boolean; link: string };
          if (!uploadData.success || !uploadData.link) {
            throw new Error('file.io upload failed');
          }

          imageUrl = uploadData.link;
          console.log('[DEBUG] Temporary upload successful to file.io:', { url: imageUrl });
        } catch (tempError) {
          console.error('Failed to upload to temporary service:', tempError);
          throw new Error(
            'Failed to prepare image for processing in development. Please ensure R2 is properly configured.'
          );
        }
      } else {
        throw new Error('Failed to prepare image for processing');
      }
    }
  } else {
    // If R2 is not configured or not publicly accessible, use fallback in development
    if (isLocalDev) {
      console.log('[DEBUG] R2 not publicly accessible, using fallback method');

      try {
        // Try using file.io as a more reliable temporary hosting service
        const base64 = imageDataUrl.split(',')[1];
        const mimeType = imageDataUrl.match(/^data:([^;]+);/)?.[1] || 'image/png';

        const formData = new FormData();
        const blob = new Blob([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], {
          type: mimeType,
        });
        formData.append('file', blob, 'image.png');

        const uploadResponse = await fetch('https://file.io/?expires=1h', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload to file.io: ${uploadResponse.status}`);
        }

        const uploadData = (await uploadResponse.json()) as { success: boolean; link: string };
        if (!uploadData.success || !uploadData.link) {
          throw new Error('file.io upload failed');
        }

        imageUrl = uploadData.link;
        console.log('[DEBUG] Temporary upload successful to file.io:', { url: imageUrl });
      } catch (tempError) {
        console.error('Failed to upload to temporary service:', tempError);
        throw new Error(
          'Failed to prepare image for processing in development. Please configure R2 with public access.'
        );
      }
    } else {
      throw new Error(
        'R2 must be configured with public access. Please use a custom domain, not r2.cloudflarestorage.com.'
      );
    }
  }

  // Replicate APIに予測リクエストを送信
  // Official models use the model endpoint directly without version
  const modelName = REPLICATE_MODELS[modelId];
  const createResponse = await fetch(
    `https://api.replicate.com/v1/models/${modelName}/predictions`,
    {
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
    }
  );

  if (!createResponse.ok) {
    const error = await createResponse.text();
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
    console.error('[DEBUG] Replicate prediction failed:', {
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
  let imageBuffer: ArrayBuffer;

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
  if (uploadedImageKey && env?.IMAGE_BUCKET && !isLocalDev) {
    try {
      await env.IMAGE_BUCKET.delete(uploadedImageKey);
    } catch (error) {
      console.error('Failed to clean up uploaded image:', error);
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
