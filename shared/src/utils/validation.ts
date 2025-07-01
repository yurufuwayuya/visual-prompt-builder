/**
 * バリデーション関連のユーティリティ関数
 */

/**
 * 文字列が空でないかチェック
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * 有効なメールアドレスかチェック
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 有効なURLかチェック
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}