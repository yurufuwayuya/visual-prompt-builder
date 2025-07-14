import { API_ENDPOINTS } from '@/config/api';

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
          strength: options.strength || 0.8,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      // Handle both simple error strings and complex error objects
      let errorMessage = '画像生成に失敗しました';
      if (typeof errorData.error === 'string') {
        errorMessage = errorData.error;
      } else if (errorData.error && typeof errorData.error === 'object') {
        // Handle Zod validation errors or other error objects
        errorMessage = errorData.error.message || errorData.error.toString() || errorMessage;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
      return {
        success: false,
        error: `${errorMessage} (${response.status})`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      image: data.image,
      cached: data.cached,
    };
  } catch (error) {
    console.error('画像生成エラー:', error);
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
export function validateImageSize(base64: string, maxSizeMB: number = 5): boolean {
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
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  quality: number = 0.9
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
        console.error('画像リサイズエラー:', error);
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    img.src = base64;
  });
}
