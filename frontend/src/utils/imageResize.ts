/**
 * 画像リサイズユーティリティ
 * ブラウザのCanvas APIを使用して画像をリサイズ
 */

/**
 * 画像の最大サイズを計算
 */
export function calculateMaxSize(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  let newWidth = originalWidth;
  let newHeight = originalHeight;

  // 幅が最大値を超えている場合
  if (originalWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = maxWidth / aspectRatio;
  }

  // 高さが最大値を超えている場合
  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = maxHeight * aspectRatio;
  }

  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight),
  };
}

/**
 * Base64画像をリサイズ
 * @param base64String 元の画像（Base64形式）
 * @param maxWidth 最大幅（デフォルト: 1024px）
 * @param maxHeight 最大高さ（デフォルト: 1024px）
 * @param quality JPEG品質（0-1、デフォルト: 0.9）
 * @returns リサイズされた画像（Base64形式）
 */
export async function resizeImage(
  base64String: string,
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  quality: number = 0.9
): Promise<string> {
  return new Promise((resolve, reject) => {
    let img: HTMLImageElement | null = new Image();
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let blobUrl: string | null = null;

    // クリーンアップ関数
    const cleanup = () => {
      // 画像要素のクリーンアップ
      if (img) {
        img.onload = null;
        img.onerror = null;
        img.src = ''; // メモリから画像データを解放
        img = null;
      }

      // Canvasのクリーンアップ
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
        canvas = null;
      }
      ctx = null;

      // Blob URLのクリーンアップ
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        blobUrl = null;
      }
    };

    img.onload = () => {
      try {
        // 新しいサイズを計算
        const { width, height } = calculateMaxSize(img!.width, img!.height, maxWidth, maxHeight);

        // リサイズが不要な場合は元の画像を返す
        if (width === img!.width && height === img!.height) {
          cleanup();
          resolve(base64String);
          return;
        }

        // Canvas要素を作成
        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d', { alpha: false }); // アルファチャンネルを無効化してメモリ使用量を削減

        if (!ctx) {
          throw new Error('Canvas context が取得できませんでした');
        }

        // Canvasのサイズを設定
        canvas.width = width;
        canvas.height = height;

        // 背景を白に設定（JPEG変換時の透明部分対策）
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // 画像を描画（リサイズ）
        ctx.drawImage(img!, 0, 0, width, height);

        // リサイズされた画像をBase64に変換
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              cleanup();
              reject(new Error('Blob の作成に失敗しました'));
              return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
              cleanup();
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(new Error('Base64への変換に失敗しました'));
              }
            };
            reader.onerror = () => {
              cleanup();
              reject(new Error('Blob の読み込みに失敗しました'));
            };
            reader.readAsDataURL(blob);
          },
          'image/jpeg',
          quality
        );
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error('画像の読み込みに失敗しました'));
    };

    // 画像を読み込む
    img.src = base64String;
  });
}

/**
 * ファイルサイズを推定（Base64から）
 * @param base64String Base64エンコードされた画像
 * @returns 推定ファイルサイズ（バイト）
 */
export function estimateFileSize(base64String: string): number {
  // データURL部分を除去
  const base64 = base64String.includes(',') ? base64String.split(',')[1] : base64String;

  // Base64の長さから実際のバイト数を推定（約3/4）
  return Math.round((base64.length * 3) / 4);
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 * @param bytes バイト数
 * @returns フォーマットされた文字列（例: "1.5 MB"）
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 画像の推奨設定を取得
 * @param fileSize ファイルサイズ（バイト）
 * @returns 推奨される最大サイズと品質
 */
export function getRecommendedSettings(fileSize: number): {
  maxWidth: number;
  maxHeight: number;
  quality: number;
} {
  const MB = 1024 * 1024;

  if (fileSize > 10 * MB) {
    // 10MB以上: 積極的にリサイズ
    return { maxWidth: 1024, maxHeight: 1024, quality: 0.8 };
  } else if (fileSize > 5 * MB) {
    // 5-10MB: 中程度のリサイズ
    return { maxWidth: 1536, maxHeight: 1536, quality: 0.85 };
  } else if (fileSize > 2 * MB) {
    // 2-5MB: 軽度のリサイズ
    return { maxWidth: 2048, maxHeight: 2048, quality: 0.9 };
  } else {
    // 2MB以下: リサイズ不要
    return { maxWidth: 4096, maxHeight: 4096, quality: 0.95 };
  }
}
