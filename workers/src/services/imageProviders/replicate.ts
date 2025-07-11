/**
 * Replicate API を使用した画像生成サービス
 */

import { createDataUrl } from '../../utils/imageProcessing';

// Replicateの画像生成モデル
const REPLICATE_MODELS = {
  'flux-fill':
    'xlabs-ai/flux-fill:c5c96dff71308ddaf96f8ab683c1329e3b1a15c1b9f82e573419bf4e544cbfdb',
  'flux-variations':
    'black-forest-labs/flux-1.1-pro:8f3e0f24cf10b5a2e97c7067c0fb5a14fe6b8923e455a54e893c30bb450de13f',
  'flux-canny':
    'xlabs-ai/flux-canny:433b22c332dd9e3a8ddb7b7c8e088e4de18d825e2b6bcd853e088bb0f1e0cf11',
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
 * Replicate APIで画像を生成
 */
export async function generateWithReplicate(
  baseImage: string,
  prompt: string,
  options: ReplicateOptions,
  apiKey: string,
  modelId: ModelId = 'flux-fill'
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

  // Replicate APIに予測リクエストを送信
  const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: REPLICATE_MODELS[modelId],
      input: {
        image: imageDataUrl,
        prompt: prompt,
        width: options.width,
        height: options.height,
        strength: options.strength,
        num_inference_steps: options.steps,
        guidance_scale: options.guidanceScale,
        negative_prompt: options.negativePrompt || '',
        output_format: options.outputFormat,
      },
    }),
  });

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

  if (!imageBuffer!) {
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
