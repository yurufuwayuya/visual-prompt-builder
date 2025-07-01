/**
 * セキュリティ関連のユーティリティ関数
 */

/**
 * HTMLエスケープを行う
 * @param str エスケープする文字列
 * @returns エスケープされた文字列
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };

  return str.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
}

/**
 * 危険な文字列パターンを検出する
 * @param str チェックする文字列
 * @returns 危険な場合はtrue
 */
export function containsDangerousPattern(str: string): boolean {
  const dangerousPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick=, onerror= など
    /<embed[^>]*>/gi,
    /<object[^>]*>/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
  ];

  return dangerousPatterns.some(pattern => pattern.test(str));
}

/**
 * 安全な文字列に変換する
 * @param str 変換する文字列
 * @param maxLength 最大文字数（デフォルト: 500）
 * @returns 安全な文字列
 */
export function sanitizeInput(str: string, maxLength: number = 500): string {
  // 基本的なトリミング
  let sanitized = str.trim();

  // 文字数制限
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // 危険なパターンが含まれている場合は空文字を返す
  if (containsDangerousPattern(sanitized)) {
    console.warn('Dangerous pattern detected in input:', sanitized);
    return '';
  }

  // 制御文字を除去
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // 連続する空白を1つに
  sanitized = sanitized.replace(/\s+/g, ' ');

  return sanitized;
}

/**
 * URLが安全かチェックする
 * @param url チェックするURL
 * @returns 安全な場合はtrue
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const allowedProtocols = ['http:', 'https:'];
    
    if (!allowedProtocols.includes(parsed.protocol)) {
      return false;
    }

    // ローカルホストや内部IPアドレスへのアクセスをブロック
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * JSONデータを安全にパースする
 * @param jsonString パースするJSON文字列
 * @param fallback エラー時のフォールバック値
 * @returns パースされたオブジェクトまたはフォールバック値
 */
export function safeJsonParse<T = unknown>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
}