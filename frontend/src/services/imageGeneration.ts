import { API_ENDPOINTS } from '@/config/api';
import { createSecureLogger } from '@/utils/secureLogger';

const logger = createSecureLogger({ prefix: 'ImageGeneration' });

export interface ImageGenerationOptions {
  prompt: string;
  referenceImage?: string | null;
  model?: 'flux-fill' | 'flux-variations' | 'flux-canny';
  strength?: number;
}

export interface ImageGenerationResponse {
  success: boolean;
  image?: string; // Base64エンコードされた画像
  error?: string;
  cached?: boolean;
  imageUrl?: string; // R2に保存された画像のURL
  imageKey?: string; // R2に保存された画像のキー
  suggestions?: string[]; // エラー時の提案
}

/**
 * 画像生成APIを呼び出す
 */
export async function generateImage(
  options: ImageGenerationOptions
): Promise<ImageGenerationResponse> {
  try {
    // 参考画像がない場合はエラー（i2i専用）
    if (!options.referenceImage) {
      return {
        success: false,
        error: '参考画像が必要です',
      };
    }

    const response = await fetch(API_ENDPOINTS.generateImage, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: options.prompt,
        baseImage: options.referenceImage, // Backend expects 'baseImage', not 'referenceImage'
        options: {
          model: options.model || 'flux-variations',
          strength: options.strength || 0.7, // CUDA OOM対策でデフォルト値を下げる
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      // Handle both simple error strings and complex error objects
      let errorMessage = '画像生成に失敗しました';
      let suggestions: string[] | undefined;

      if (typeof errorData.error === 'string') {
        errorMessage = errorData.error;
      } else if (errorData.error && typeof errorData.error === 'object') {
        // Handle Zod validation errors or other error objects
        errorMessage = errorData.error.message || errorData.error.toString() || errorMessage;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }

      // 提案が含まれている場合
      if (errorData.suggestions) {
        suggestions = errorData.suggestions;
      }

      // CUDA OOMエラーの特別処理
      if (response.status === 507 || errorMessage.includes('メモリ')) {
        return {
          success: false,
          error: errorMessage,
          suggestions: suggestions || [
            '画像サイズを小さくしてください',
            'パラメータを調整してください',
            '他のモデルを試してください',
          ],
        };
      }

      return {
        success: false,
        error: `${errorMessage} (${response.status})`,
        suggestions,
      };
    }

    const responseData = await response.json();
    // APIはcreateSuccessResponseでラップされたレスポンスを返す
    const data = responseData.data || responseData;
    return {
      success: true,
      image: data.image,
      cached: data.cached,
      imageUrl: data.imageUrl,
      imageKey: data.imageKey,
    };
  } catch (error) {
    logger.error('画像生成エラー', error);
    // ネットワークエラーの詳細情報を提供
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      logger.debug('APIエンドポイント', { endpoint: API_ENDPOINTS.generateImage });
      return {
        success: false,
        error: 'APIサーバーに接続できません。ワーカーが起動していることを確認してください。',
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : '画像生成中にエラーが発生しました',
    };
  }
}

/**
 * 画像をBase64形式に変換
 */
export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('画像の読み込みに失敗しました'));
      }
    };
    reader.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    reader.readAsDataURL(file);
  });
}

/**
 * Base64画像のサイズを検証
 */
export function validateImageSize(base64: string, maxSizeMB: number = 3): boolean {
  // CUDA OOM対策でデフォルトを3MBに
  // Base64のヘッダー部分を除去
  const base64Data = base64.split(',')[1] || base64;
  // Base64のサイズから実際のバイト数を計算（約3/4）
  const sizeInBytes = (base64Data.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  return sizeInMB <= maxSizeMB;
}

/**
 * 画像をリサイズしてBase64形式で返す
 * @param base64 元のBase64画像
 * @param maxWidth 最大幅
 * @param maxHeight 最大高さ
 * @param quality 画質 (0.0 - 1.0)
 */
export async function resizeImage(
  base64: string,
  maxWidth: number = 768, // CUDA OOM対策でデフォルト値を下げる
  maxHeight: number = 768, // CUDA OOM対策でデフォルト値を下げる
  quality: number = 0.7 // CUDA OOM対策で品質を下げる
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // アスペクト比を維持してリサイズ
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width > height) {
            width = maxWidth;
            height = maxWidth / aspectRatio;
          } else {
            height = maxHeight;
            width = maxHeight * aspectRatio;
          }
        }

        // Canvas でリサイズ
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas context が取得できませんでした');
        }

        // 画像を描画
        ctx.drawImage(img, 0, 0, width, height);

        // Base64に変換
        const resizedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(resizedBase64);
      } catch (error) {
        logger.error('画像リサイズエラー', error);
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    img.src = base64;
  });
}
