/**
 * 環境変数と環境判定のユーティリティ
 *
 * NODE_ENV（Node.js/ブラウザ）とENVIRONMENT（Cloudflare Workers）の
 * 両方に対応した統一的な環境判定を提供
 */

export type Environment = 'development' | 'staging' | 'production' | 'test';

/**
 * 環境情報を取得するためのコンテキスト
 * Cloudflare Workersのバインディングまたは通常の環境変数に対応
 */
export interface EnvironmentContext {
  /** Cloudflare Workersのバインディング */
  ENVIRONMENT?: Environment;
  /** その他の環境変数 */
  [key: string]: unknown;
}

/**
 * 現在の環境を判定する（統一的なインターフェース）
 *
 * @param context - Cloudflare Workersのバインディング（オプション）
 * @returns 現在の環境
 */
export function getCurrentEnvironment(context?: EnvironmentContext): Environment {
  // 1. コンテキストから環境を取得（Cloudflare Workers）
  if (context?.ENVIRONMENT) {
    return context.ENVIRONMENT;
  }

  // 2. process.env.NODE_ENVから取得（Node.js環境）
  // @ts-expect-error - processはNode.js環境でのみ存在
  if (typeof process !== 'undefined' && process?.env?.NODE_ENV) {
    // @ts-expect-error - processはNode.js環境でのみ存在
    const nodeEnv = process.env.NODE_ENV;
    // NODE_ENVの値をEnvironmentの値にマッピング
    switch (nodeEnv) {
      case 'development':
      case 'staging':
      case 'production':
      case 'test':
        return nodeEnv as Environment;
      default:
        // 不明な値の場合はdevelopmentとして扱う
        return 'development';
    }
  }

  // 3. デフォルトはdevelopment
  return 'development';
}

/**
 * 本番環境かどうかを判定する
 *
 * @param context - Cloudflare Workersのバインディング（オプション）
 * @returns 本番環境の場合true
 */
export function isProduction(context?: EnvironmentContext): boolean {
  return getCurrentEnvironment(context) === 'production';
}

/**
 * 開発環境かどうかを判定する
 *
 * @param context - Cloudflare Workersのバインディング（オプション）
 * @returns 開発環境の場合true
 */
export function isDevelopment(context?: EnvironmentContext): boolean {
  return getCurrentEnvironment(context) === 'development';
}

/**
 * テスト環境かどうかを判定する
 *
 * @param context - Cloudflare Workersのバインディング（オプション）
 * @returns テスト環境の場合true
 */
export function isTest(context?: EnvironmentContext): boolean {
  return getCurrentEnvironment(context) === 'test';
}

/**
 * ステージング環境かどうかを判定する
 *
 * @param context - Cloudflare Workersのバインディング（オプション）
 * @returns ステージング環境の場合true
 */
export function isStaging(context?: EnvironmentContext): boolean {
  return getCurrentEnvironment(context) === 'staging';
}
