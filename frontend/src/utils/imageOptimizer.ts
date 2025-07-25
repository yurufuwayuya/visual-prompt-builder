/**
 * スマートフォン画像特化の最適化ユーティリティ
 * CUDA OOMエラーを防ぐため、積極的に画像を最適化
 */

import { resizeImage, estimateFileSize, formatFileSize } from './imageResize';
import { createSecureLogger } from './secureLogger';

const logger = createSecureLogger({ prefix: 'ImageOptimizer' });

/**
 * スマートフォン画像の検出基準
 */
interface SmartphoneImageDetection {
  isSmartphone: boolean;
  confidence: number;
  details: {
    resolution?: number;
    aspectRatio?: string;
    fileSize?: number;
    format?: string;
  };
}

/**
 * 画像最適化の設定
 */
interface OptimizationSettings {
  targetSizeKB: number;
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

/**
 * 最適化段階の定義
 */
const OPTIMIZATION_STAGES: OptimizationSettings[] = [
  { targetSizeKB: 500, maxWidth: 1024, maxHeight: 1024, quality: 0.85 },
  { targetSizeKB: 400, maxWidth: 768, maxHeight: 768, quality: 0.8 },
  { targetSizeKB: 300, maxWidth: 640, maxHeight: 640, quality: 0.75 },
  { targetSizeKB: 200, maxWidth: 512, maxHeight: 512, quality: 0.7 },
  { targetSizeKB: 100, maxWidth: 384, maxHeight: 384, quality: 0.65 },
];

/**
 * I2I用のより厳格な最適化段階
 */
const I2I_OPTIMIZATION_STAGES: OptimizationSettings[] = [
  { targetSizeKB: 300, maxWidth: 768, maxHeight: 768, quality: 0.75 },
  { targetSizeKB: 250, maxWidth: 640, maxHeight: 640, quality: 0.7 },
  { targetSizeKB: 200, maxWidth: 512, maxHeight: 512, quality: 0.65 },
  { targetSizeKB: 150, maxWidth: 448, maxHeight: 448, quality: 0.6 },
  { targetSizeKB: 100, maxWidth: 384, maxHeight: 384, quality: 0.55 },
];

/**
 * 画像がスマートフォンからのものかを検出
 */
export async function detectSmartphoneImage(
  base64String: string
): Promise<SmartphoneImageDetection> {
  return new Promise((resolve) => {
    const img = new Image();
    
    // Check for HEIC format indicators
    const isLikelyHEIC =
      base64String.includes('image/heic') ||
      base64String.includes('image/heif');

    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const resolution = width * height;
      const aspectRatio = Math.max(width, height) / Math.min(width, height);
      const fileSize = estimateFileSize(base64String);

      // スマートフォン画像の特徴
      const features = {
        // 3MP以上の解像度
        highResolution: resolution >= 3000000,
        // 一般的なスマホのアスペクト比（4:3, 16:9, 9:16など）
        mobileAspectRatio:
          Math.abs(aspectRatio - 4 / 3) < 0.1 ||
          Math.abs(aspectRatio - 16 / 9) < 0.1 ||
          Math.abs(aspectRatio - 9 / 16) < 0.1,
        // 大きなファイルサイズ（2MB以上）
        largeFileSize: fileSize > 2 * 1024 * 1024,
      };

      // 信頼度の計算
      let confidence = 0;
      if (features.highResolution) confidence += 40;
      if (features.mobileAspectRatio) confidence += 30;
      if (features.largeFileSize) confidence += 30;
      if (isLikelyHEIC) confidence += 20;

      resolve({
        isSmartphone: confidence >= 60 || isLikelyHEIC,
        confidence,
        details: {
          resolution,
          aspectRatio: `${width}:${height}`,
          fileSize,
          format: isLikelyHEIC ? 'HEIC' : 'Unknown',
        },
      });
    };

    img.onerror = () => {
      resolve({
        isSmartphone: false,
        confidence: 0,
        details: {},
      });
    };

    img.src = base64String;
  });
}

/**
 * メタデータを削除して画像を軽量化
 */
export async function stripMetadata(base64String: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });

    const cleanup = () => {
      img.src = ''; // Clear image source
      canvas.width = 0;
      canvas.height = 0;
    };

    img.onload = () => {
      if (!ctx) {
        cleanup();
        resolve(base64String);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // 白背景で描画（透明部分対策）
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // メタデータなしでJPEGに変換
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            cleanup();
            resolve(base64String);
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              cleanup();
              resolve(reader.result);
            } else {
              cleanup();
              resolve(base64String);
            }
          };
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        0.9
      );
    };

    img.onerror = () => {
      cleanup();
      resolve(base64String);
    };

    img.src = base64String;
  });
}

/**
 * 画像を段階的に最適化（CUDA OOM対策）
 */
export async function optimizeImageForGeneration(
  base64String: string,
  options: {
    targetUsage?: 'general' | 'i2i';
    onProgress?: (stage: number, totalStages: number, currentSize: string) => void;
  } = {}
): Promise<{
  optimizedImage: string;
  originalSize: string;
  finalSize: string;
  optimizationStages: number;
  isSmartphoneImage: boolean;
}> {
  const { targetUsage = 'general', onProgress } = options;
  const stages = targetUsage === 'i2i' ? I2I_OPTIMIZATION_STAGES : OPTIMIZATION_STAGES;

  // 元のサイズを記録
  const originalSize = estimateFileSize(base64String);
  const originalSizeFormatted = formatFileSize(originalSize);

  // スマートフォン画像の検出
  const detection = await detectSmartphoneImage(base64String);

  logger.info('画像最適化開始', {
    originalSize: originalSizeFormatted,
    isSmartphone: detection.isSmartphone,
    confidence: detection.confidence,
    details: detection.details,
    targetUsage,
  });

  // まずメタデータを削除
  let currentImage = base64String;
  if (detection.isSmartphone || originalSize > 1024 * 1024) {
    try {
      currentImage = await stripMetadata(currentImage);
      const sizeAfterStrip = estimateFileSize(currentImage);
      const reduction = ((originalSize - sizeAfterStrip) / originalSize) * 100;

      logger.info('メタデータ削除完了', {
        before: originalSizeFormatted,
        after: formatFileSize(sizeAfterStrip),
        reduction: `${reduction.toFixed(1)}%`,
      });
    } catch (error) {
      logger.warn('メタデータ削除に失敗', error);
    }
  }

  // 段階的に最適化
  let optimizationStage = 0;

  for (const stage of stages) {
    const currentSize = estimateFileSize(currentImage);
    const currentSizeKB = currentSize / 1024;

    // 目標サイズに到達したら終了
    if (currentSizeKB <= stage.targetSizeKB) {
      logger.info('目標サイズ達成', {
        targetKB: stage.targetSizeKB,
        actualKB: currentSizeKB.toFixed(1),
      });
      break;
    }

    optimizationStage++;

    // 進捗をコールバック
    if (onProgress) {
      onProgress(optimizationStage, stages.length, formatFileSize(currentSize));
    }

    try {
      // リサイズと圧縮
      currentImage = await resizeImage(
        currentImage,
        stage.maxWidth,
        stage.maxHeight,
        stage.quality
      );

      const newSize = estimateFileSize(currentImage);
      logger.info(`最適化ステージ ${optimizationStage} 完了`, {
        settings: stage,
        before: formatFileSize(currentSize),
        after: formatFileSize(newSize),
      });
    } catch (error) {
      logger.error(`最適化ステージ ${optimizationStage} で失敗`, error);
      // エラーが発生しても現在の画像を返す
      break;
    }
  }

  const finalSize = estimateFileSize(currentImage);
  const finalSizeFormatted = formatFileSize(finalSize);

  logger.info('画像最適化完了', {
    originalSize: originalSizeFormatted,
    finalSize: finalSizeFormatted,
    reduction: `${(((originalSize - finalSize) / originalSize) * 100).toFixed(1)}%`,
    stages: optimizationStage,
  });

  return {
    optimizedImage: currentImage,
    originalSize: originalSizeFormatted,
    finalSize: finalSizeFormatted,
    optimizationStages: optimizationStage,
    isSmartphoneImage: detection.isSmartphone,
  };
}

/**
 * 画像サイズに基づく推奨設定を取得（よりアグレッシブ）
 */
export function getAggressiveOptimizationSettings(fileSizeBytes: number): OptimizationSettings {
  const MB = 1024 * 1024;

  if (fileSizeBytes > 10 * MB) {
    return { targetSizeKB: 300, maxWidth: 512, maxHeight: 512, quality: 0.6 };
  } else if (fileSizeBytes > 5 * MB) {
    return { targetSizeKB: 400, maxWidth: 640, maxHeight: 640, quality: 0.65 };
  } else if (fileSizeBytes > 2 * MB) {
    return { targetSizeKB: 500, maxWidth: 768, maxHeight: 768, quality: 0.7 };
  } else {
    return { targetSizeKB: 600, maxWidth: 1024, maxHeight: 1024, quality: 0.75 };
  }
}
