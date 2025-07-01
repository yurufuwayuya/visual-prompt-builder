/**
 * Cloudflare Workers 環境の型定義
 */

export interface Bindings {
  // 環境変数
  ENVIRONMENT: 'development' | 'staging' | 'production';
  TRANSLATION_API_KEY?: string;
  LOGFLARE_API_KEY?: string;
  ALLOWED_ORIGINS?: string;
  
  // KV Namespaces
  CACHE: KVNamespace;
  SESSION: KVNamespace;
  RATE_LIMIT_KV: KVNamespace;
}

export interface Variables {
  requestId: string;
  startTime: number;
}