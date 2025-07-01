/**
 * レート制限ミドルウェア
 */

import { Context, Next } from 'hono';
import type { Bindings } from '../types';

interface RateLimitOptions {
  /** ウィンドウサイズ（秒） */
  windowMs: number;
  /** ウィンドウ内の最大リクエスト数 */
  max: number;
  /** レート制限時のメッセージ */
  message?: string;
  /** キー生成関数 */
  keyGenerator?: (c: Context) => string;
  /** スキップ判定関数 */
  skip?: (c: Context) => boolean;
}

/**
 * デフォルトのキー生成関数（IPアドレスベース）
 */
function defaultKeyGenerator(c: Context): string {
  // Cloudflare WorkersではCF-Connecting-IPヘッダーで実IPを取得
  const ip = c.req.header('CF-Connecting-IP') || 
             c.req.header('X-Forwarded-For')?.split(',')[0] || 
             'unknown';
  return `rate-limit:${ip}`;
}

/**
 * レート制限ミドルウェアを作成
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs = 60 * 1000, // デフォルト: 1分
    max = 100, // デフォルト: 100リクエスト/分
    message = 'Too many requests, please try again later.',
    keyGenerator = defaultKeyGenerator,
    skip = () => false,
  } = options;

  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    // スキップ判定
    if (skip(c)) {
      return next();
    }

    const key = keyGenerator(c);
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // KV Namespaceからレート制限データを取得
      const kv = c.env.RATE_LIMIT_KV;
      if (!kv) {
        console.warn('RATE_LIMIT_KV not configured, skipping rate limit');
        return next();
      }

      // 既存のレート制限データを取得
      const data = await kv.get(key, 'json') as { requests: number[]; } | null;
      
      // 現在のウィンドウ内のリクエストをフィルタリング
      const requests = data?.requests?.filter(timestamp => timestamp > windowStart) || [];
      
      // レート制限チェック
      if (requests.length >= max) {
        // レート制限ヘッダーを設定
        c.header('X-RateLimit-Limit', max.toString());
        c.header('X-RateLimit-Remaining', '0');
        c.header('X-RateLimit-Reset', new Date(windowStart + windowMs).toISOString());
        c.header('Retry-After', Math.ceil(windowMs / 1000).toString());

        return c.json(
          {
            success: false,
            error: message,
            retryAfter: Math.ceil(windowMs / 1000),
          },
          429
        );
      }

      // リクエストを記録
      requests.push(now);
      
      // KVに保存（TTLを設定）
      await kv.put(
        key,
        JSON.stringify({ requests }),
        { expirationTtl: Math.ceil(windowMs / 1000) }
      );

      // レート制限ヘッダーを設定
      c.header('X-RateLimit-Limit', max.toString());
      c.header('X-RateLimit-Remaining', (max - requests.length).toString());
      c.header('X-RateLimit-Reset', new Date(windowStart + windowMs).toISOString());

      return next();
    } catch (error) {
      console.error('Rate limit error:', error);
      // エラーが発生してもリクエストは通す
      return next();
    }
  };
}

/**
 * API用のレート制限設定
 */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1分
  max: 60, // 60リクエスト/分
  message: 'APIレート制限に達しました。しばらくしてから再度お試しください。',
});

/**
 * プロンプト生成用のレート制限設定（より厳しい）
 */
export const promptRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1分
  max: 20, // 20リクエスト/分
  message: 'プロンプト生成のレート制限に達しました。しばらくしてから再度お試しください。',
});