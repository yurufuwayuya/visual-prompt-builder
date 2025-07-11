/**
 * 画像処理ユーティリティ
 * Cloudflare Workers環境で動作するWeb標準APIのみを使用
 */

/**
 * Base64文字列から画像のメタデータを取得
 */
export function getImageMetadata(base64String: string): {
  mimeType: string;
  extension: string;
} {
  // データURLの場合は解析
  if (base64String.startsWith('data:')) {
    const matches = base64String.match(/^data:image\/(\w+);base64,/);
    if (matches) {
      const extension = matches[1];
      return {
        mimeType: `image/${extension}`,
        extension: extension === 'jpeg' ? 'jpg' : extension,
      };
    }
  }

  // デフォルトはPNG
  return {
    mimeType: 'image/png',
    extension: 'png',
  };
}

/**
 * Base64文字列をクリーンアップ（データURL部分を除去）
 */
export function cleanBase64(base64String: string): string {
  if (base64String.startsWith('data:')) {
    return base64String.split(',')[1] || base64String;
  }
  return base64String;
}

/**
 * Base64文字列をArrayBufferに変換
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const cleanedBase64 = cleanBase64(base64);
  const binaryString = atob(cleanedBase64);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
}

/**
 * ArrayBufferをBase64文字列に変換
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

/**
 * 画像サイズの検証
 */
export function validateImageSize(base64String: string, maxSizeMB: number = 10): boolean {
  const cleanedBase64 = cleanBase64(base64String);
  // Base64文字列のサイズから実際のバイト数を推定（約3/4）
  const estimatedBytes = (cleanedBase64.length * 3) / 4;
  const maxBytes = maxSizeMB * 1024 * 1024;

  return estimatedBytes <= maxBytes;
}

/**
 * 画像のBase64データURLを作成
 */
export function createDataUrl(base64: string, mimeType: string): string {
  const cleanedBase64 = cleanBase64(base64);
  return `data:${mimeType};base64,${cleanedBase64}`;
}

/**
 * 画像のサイズを推定（Base64から）
 */
export function estimateImageDimensions(_base64String: string): Promise<{
  width: number;
  height: number;
} | null> {
  return new Promise((resolve) => {
    try {
      // Cloudflare Workers環境ではImageオブジェクトが利用できないため
      // 画像サイズの取得はスキップ
      resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * 画像形式の検証
 */
export function isValidImageFormat(mimeType: string): boolean {
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return supportedFormats.includes(mimeType.toLowerCase());
}

/**
 * エラーメッセージのフォーマット
 */
export function formatImageError(error: unknown): string {
  if (error instanceof Error) {
    return `画像処理エラー: ${error.message}`;
  }
  return '画像処理中に予期しないエラーが発生しました';
}
