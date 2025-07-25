/**
 * CUDA OOMリスク評価ユーティリティ
 * 画像生成前にメモリ不足のリスクを評価し、最適化を提案
 */

import { createLogger } from './logger';

const logger = createLogger({ prefix: 'ImageValidator' });

/**
 * リスク評価の結果
 */
export interface CudaOomRiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'very-high';
  riskScore: number; // 0-100
  factors: {
    fileSize: number;
    resolution: number;
    model: number;
    parameters: number;
  };
  recommendations: {
    shouldOptimize: boolean;
    suggestedMaxSize: number;
    suggestedQuality: number;
    suggestedSteps: number;
    suggestedGuidance: number;
    alternativeModel?: string;
  };
  warnings: string[];
}

/**
 * モデルごとのメモリ使用量係数
 */
const MODEL_MEMORY_FACTORS: Record<string, number> = {
  'flux-fill': 15,
  'flux-variations': 12,
  'flux-canny': 10,
  'sdxl-img2img': 20,
  dalle3: 5, // 外部APIなのでローカルメモリは使わない
  midjourney: 5,
};

/**
 * 画像サイズからメガピクセルを計算
 */
function calculateMegapixels(base64String: string): Promise<number> {
  return new Promise((resolve) => {
    try {
      // Note: This is a heuristic estimation due to Cloudflare Workers environment limitations
      // where DOM APIs like Image are not available for accurate dimension parsing.
      
      // Clean base64 string and get byte size
      const cleanBase64 = base64String.replace(/^data:image\/[^;]+;base64,/, '');
      const sizeInBytes = (cleanBase64.length * 3) / 4;
      
      // Detect image format for better compression ratio estimation
      let compressionRatio = 10; // Default JPEG ratio
      if (base64String.includes('data:image/png')) {
        compressionRatio = 3; // PNG is less compressed
      } else if (base64String.includes('data:image/webp')) {
        compressionRatio = 15; // WebP is more compressed
      }
      
      // Conservative estimation: assume higher quality/less compression
      const estimatedPixels = (sizeInBytes * compressionRatio) / 3; // RGB 3 bytes per pixel
      const megapixels = estimatedPixels / 1_000_000;
      
      // Apply reasonable bounds and bias toward higher estimates for safety
      const boundedMegapixels = Math.max(
        Math.min(megapixels * 1.2, 50), // 20% safety margin, max 50MP
        0.1 // Minimum 0.1MP
      );
      
      logger.debug('Megapixel estimation', {
        fileSize: sizeInBytes,
        compressionRatio,
        estimatedMegapixels: boundedMegapixels
      });
      
      resolve(boundedMegapixels);
    } catch (error) {
      logger.error('メガピクセル計算エラー', error);
      resolve(8); // Conservative fallback: 8MP
    }
  });
}

/**
 * CUDA OOMリスクを評価
 */
export async function assessCudaOomRisk(
  base64Image: string,
  modelId: string,
  options: {
    steps?: number;
    guidanceScale?: number;
    strength?: number;
    width?: number;
    height?: number;
  } = {}
): Promise<CudaOomRiskAssessment> {
  const { steps = 20, guidanceScale = 7.5, strength = 0.8 } = options;

  // ファイルサイズの評価（MB単位）
  const fileSizeBytes = (base64Image.length * 3) / 4;
  const fileSizeMB = fileSizeBytes / (1024 * 1024);

  // 解像度の評価
  const megapixels = await calculateMegapixels(base64Image);

  // リスクスコアの計算
  let riskScore = 0;
  const factors = {
    fileSize: 0,
    resolution: 0,
    model: 0,
    parameters: 0,
  };

  // ファイルサイズによるリスク（0-30点）
  if (fileSizeMB > 5) {
    factors.fileSize = 30;
  } else if (fileSizeMB > 3) {
    factors.fileSize = 20;
  } else if (fileSizeMB > 1) {
    factors.fileSize = 10;
  } else {
    factors.fileSize = 5;
  }

  // 解像度によるリスク（0-30点）
  if (megapixels > 8) {
    factors.resolution = 30;
  } else if (megapixels > 4) {
    factors.resolution = 20;
  } else if (megapixels > 2) {
    factors.resolution = 10;
  } else {
    factors.resolution = 5;
  }

  // モデルによるリスク（0-20点）
  const modelFactor = MODEL_MEMORY_FACTORS[modelId] || 10;
  factors.model = Math.min(modelFactor, 20);

  // パラメータによるリスク（0-20点）
  const paramScore = (steps / 50) * 10 + (guidanceScale / 20) * 5 + (strength / 1) * 5;
  factors.parameters = Math.min(Math.round(paramScore), 20);

  // 合計スコア
  riskScore = factors.fileSize + factors.resolution + factors.model + factors.parameters;

  // リスクレベルの判定
  let riskLevel: CudaOomRiskAssessment['riskLevel'];
  if (riskScore >= 60) {
    riskLevel = 'very-high';
  } else if (riskScore >= 40) {
    riskLevel = 'high';
  } else if (riskScore >= 20) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  // 推奨設定の計算
  const recommendations = {
    shouldOptimize: riskScore >= 30,
    suggestedMaxSize: riskScore >= 60 ? 384 : riskScore >= 40 ? 512 : riskScore >= 20 ? 768 : 1024,
    suggestedQuality: riskScore >= 60 ? 0.6 : riskScore >= 40 ? 0.7 : riskScore >= 20 ? 0.8 : 0.85,
    suggestedSteps: Math.max(10, Math.min(steps, 30 - Math.floor(riskScore / 10))),
    suggestedGuidance: Math.max(3, Math.min(guidanceScale, 10 - Math.floor(riskScore / 20))),
    alternativeModel: undefined as string | undefined,
  };

  // 代替モデルの提案
  if (riskLevel === 'very-high' && modelId === 'sdxl-img2img') {
    recommendations.alternativeModel = 'flux-variations';
  }

  // 警告メッセージの生成
  const warnings: string[] = [];

  if (fileSizeMB > 5) {
    warnings.push(
      `画像サイズが大きすぎます（${fileSizeMB.toFixed(1)}MB）。500KB以下に最適化することを推奨します。`
    );
  }

  if (megapixels > 8) {
    warnings.push(
      `解像度が高すぎます（約${megapixels.toFixed(1)}MP）。2MP以下に縮小することを推奨します。`
    );
  }

  if (riskLevel === 'very-high') {
    warnings.push('CUDA OOMエラーの可能性が非常に高いです。画像の最適化が必要です。');
  } else if (riskLevel === 'high') {
    warnings.push('メモリ不足のリスクがあります。パラメータの調整を推奨します。');
  }

  logger.info('CUDA OOMリスク評価完了', {
    riskLevel,
    riskScore,
    factors,
    fileSizeMB: fileSizeMB.toFixed(2),
    megapixels: megapixels.toFixed(2),
    modelId,
  });

  return {
    riskLevel,
    riskScore,
    factors,
    recommendations,
    warnings,
  };
}

/**
 * リスク評価に基づいてパラメータを自動調整
 */
export function applyRiskMitigation<T extends Record<string, unknown>>(
  originalParams: T,
  assessment: CudaOomRiskAssessment
): T {
  if (!assessment.recommendations.shouldOptimize) {
    return originalParams;
  }

  const adjusted = { ...originalParams };

  // ステップ数の調整
  if ('steps' in adjusted && typeof adjusted.steps === 'number') {
    adjusted.steps = Math.min(adjusted.steps, assessment.recommendations.suggestedSteps);
  }

  // ガイダンススケールの調整
  if ('guidanceScale' in adjusted && typeof adjusted.guidanceScale === 'number') {
    adjusted.guidanceScale = Math.min(
      adjusted.guidanceScale,
      assessment.recommendations.suggestedGuidance
    );
  }
  if ('guidance' in adjusted && typeof adjusted.guidance === 'number') {
    adjusted.guidance = Math.min(adjusted.guidance, assessment.recommendations.suggestedGuidance);
  }

  // 解像度の調整
  if ('width' in adjusted && typeof adjusted.width === 'number') {
    adjusted.width = Math.min(adjusted.width, assessment.recommendations.suggestedMaxSize);
  }
  if ('height' in adjusted && typeof adjusted.height === 'number') {
    adjusted.height = Math.min(adjusted.height, assessment.recommendations.suggestedMaxSize);
  }

  // 品質の調整
  if ('quality' in adjusted && typeof adjusted.quality === 'number') {
    adjusted.quality = Math.min(adjusted.quality, assessment.recommendations.suggestedQuality);
  }
  if ('output_quality' in adjusted && typeof adjusted.output_quality === 'number') {
    adjusted.output_quality = Math.min(
      adjusted.output_quality,
      assessment.recommendations.suggestedQuality * 100
    );
  }

  logger.info('リスク軽減のためパラメータを自動調整', {
    original: originalParams,
    adjusted,
    riskLevel: assessment.riskLevel,
  });

  return adjusted;
}
