/* eslint-disable no-console */
/**
 * フロントエンド用セキュアロガーユーティリティ
 * ブラウザ環境に最適化され、センシティブデータを自動的にサニタイズ
 */

interface SecureLoggerOptions {
  prefix?: string;
}

interface SanitizeOptions {
  maxStringLength?: number;
  redactKeys?: string[];
  redactPatterns?: RegExp[];
}

const DEFAULT_REDACT_KEYS = [
  'password',
  'token',
  'apiKey',
  'api_key',
  'secret',
  'authorization',
  'cookie',
  'session',
  'baseImage',
  'base64',
  'data:image',
  'apiEndpoint',
  'cloudflareAccountId',
];

const DEFAULT_REDACT_PATTERNS = [
  /Bearer\s+[\w-]+/gi, // Bearer tokens
  /data:image\/[^;]+;base64,[^\s,]+/gi, // Base64 images
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Email addresses
  /sk-[a-zA-Z0-9]{48}/g, // OpenAI API keys
  /[a-f0-9]{32}/gi, // API keys that look like hashes
];

class SecureLogger {
  private prefix: string;
  private isDevelopment: boolean;
  private sanitizeOptions: Required<SanitizeOptions>;

  constructor(options: SecureLoggerOptions = {}, sanitizeOptions: SanitizeOptions = {}) {
    this.prefix = options.prefix || '';
    // ブラウザ環境の判定
    this.isDevelopment = import.meta.env.MODE === 'development';
    this.sanitizeOptions = {
      maxStringLength: sanitizeOptions.maxStringLength || 1000,
      redactKeys: [...DEFAULT_REDACT_KEYS, ...(sanitizeOptions.redactKeys || [])],
      redactPatterns: [...DEFAULT_REDACT_PATTERNS, ...(sanitizeOptions.redactPatterns || [])],
    };
  }

  private sanitizeValue(value: unknown, key?: string): unknown {
    // Null or undefined
    if (value == null) {
      return value;
    }

    // Check if key should be redacted
    if (key && this.shouldRedactKey(key)) {
      return '[REDACTED]';
    }

    // Handle different types
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (typeof value === 'object') {
      if (value instanceof Error) {
        return this.sanitizeError(value);
      }
      if (value instanceof File) {
        return this.sanitizeFile(value);
      }
      if (value instanceof FormData) {
        return '[FormData]';
      }
      if (Array.isArray(value)) {
        return value.map((item) => this.sanitizeValue(item));
      }
      return this.sanitizeObject(value);
    }

    return value;
  }

  private shouldRedactKey(key: string): boolean {
    const lowerKey = key.toLowerCase();
    return this.sanitizeOptions.redactKeys.some((redactKey) =>
      lowerKey.includes(redactKey.toLowerCase())
    );
  }

  private sanitizeString(str: string): string {
    let sanitized = str;

    // Apply redaction patterns
    for (const pattern of this.sanitizeOptions.redactPatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    // Truncate long strings
    if (sanitized.length > this.sanitizeOptions.maxStringLength) {
      const truncated = sanitized.substring(0, this.sanitizeOptions.maxStringLength);
      return `${truncated}... [TRUNCATED ${sanitized.length - this.sanitizeOptions.maxStringLength} chars]`;
    }

    return sanitized;
  }

  private sanitizeObject(obj: object): object {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = this.sanitizeValue(value, key);
    }

    return sanitized;
  }

  private sanitizeError(error: Error): object {
    const sanitized: Record<string, unknown> = {
      name: error.name,
      message: this.sanitizeString(error.message),
    };

    // Only include stack trace in development
    if (this.isDevelopment && error.stack) {
      sanitized.stack = error.stack;
    }

    // Handle custom error properties
    for (const key of Object.keys(error)) {
      if (key !== 'name' && key !== 'message' && key !== 'stack') {
        const errorObj = error as unknown as Record<string, unknown>;
        sanitized[key] = this.sanitizeValue(errorObj[key], key);
      }
    }

    return sanitized;
  }

  private sanitizeFile(file: File): object {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    };
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    const prefix = this.prefix ? `[${this.prefix}] ` : '';
    return `[${timestamp}] ${prefix}[${level}] ${message}`;
  }

  private prepareLogData(data: unknown): unknown {
    if (!this.isDevelopment && data !== undefined) {
      return this.sanitizeValue(data);
    }
    return data;
  }

  debug(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('DEBUG', message), data || '');
    }
  }

  info(message: string, data?: unknown): void {
    const sanitizedData = this.prepareLogData(data);
    if (this.isDevelopment) {
      console.log(this.formatMessage('INFO', message), sanitizedData || '');
    }
  }

  warn(message: string, data?: unknown): void {
    const sanitizedData = this.prepareLogData(data);
    console.warn(this.formatMessage('WARN', message), sanitizedData || '');
  }

  error(message: string, error?: unknown): void {
    const sanitizedError = this.prepareLogData(error);
    console.error(this.formatMessage('ERROR', message), sanitizedError || '');
  }

  /**
   * 本番環境でも安全にログを出力する
   */
  safeLog(message: string, data?: unknown): void {
    const sanitizedData = this.sanitizeValue(data);
    console.log(this.formatMessage('LOG', message), sanitizedData || '');
  }

  /**
   * グループログの開始
   */
  group(label: string): void {
    if (this.isDevelopment) {
      console.group(this.formatMessage('GROUP', label));
    }
  }

  /**
   * グループログの終了
   */
  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  /**
   * タイマーの開始
   */
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(`${this.prefix ? `[${this.prefix}] ` : ''}${label}`);
    }
  }

  /**
   * タイマーの終了
   */
  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(`${this.prefix ? `[${this.prefix}] ` : ''}${label}`);
    }
  }
}

/**
 * セキュアロガーインスタンスを作成
 */
export function createSecureLogger(
  options: SecureLoggerOptions = {},
  sanitizeOptions: SanitizeOptions = {}
): SecureLogger {
  return new SecureLogger(options, sanitizeOptions);
}

/**
 * デフォルトセキュアロガー
 */
export const secureLogger = new SecureLogger();

/**
 * 非同期操作をロギング付きで実行
 */
export async function withLogging<T>(
  operation: () => Promise<T>,
  context: string,
  logger: SecureLogger = secureLogger
): Promise<T> {
  try {
    logger.debug(`Starting ${context}`);
    const startTime = performance.now();
    const result = await operation();
    const duration = performance.now() - startTime;
    logger.debug(`Completed ${context}`, { duration: `${duration.toFixed(2)}ms` });
    return result;
  } catch (error) {
    logger.error(`Failed ${context}`, error);
    throw error;
  }
}
