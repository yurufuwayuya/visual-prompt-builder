/* eslint-disable no-console */
/**
 * ロガーユーティリティ
 * 開発環境でのみログを出力
 */

interface LoggerOptions {
  prefix?: string;
  env?: { ENVIRONMENT?: string };
}

class Logger {
  private prefix: string;
  private isDevelopment: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || '';
    this.isDevelopment = options.env?.ENVIRONMENT === 'development';
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    const prefix = this.prefix ? `[${this.prefix}] ` : '';
    return `[${timestamp}] ${prefix}[${level}] ${message}`;
  }

  debug(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('DEBUG', message), data || '');
    }
  }

  info(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('INFO', message), data || '');
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.warn(this.formatMessage('WARN', message), data || '');
    }
  }

  error(message: string, error?: unknown): void {
    // エラーは本番環境でも出力
    console.error(this.formatMessage('ERROR', message), error || '');
  }
}

/**
 * ロガーインスタンスを作成
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  return new Logger(options);
}

/**
 * デフォルトロガー（開発環境の判定なし）
 */
export const logger = new Logger();
