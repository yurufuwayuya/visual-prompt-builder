/**
 * Cloudflare Workers 環境の型定義
 */

export interface Bindings {
  // 環境変数
  ENVIRONMENT: 'development' | 'staging' | 'production';
  TRANSLATION_API_KEY?: string;
  LOGFLARE_API_KEY?: string;
  ALLOWED_ORIGINS?: string;

  // 画像生成API関連
  IMAGE_API_KEY?: string;
  IMAGE_PROVIDER?: 'replicate' | 'openai' | 'stability';

  // R2 設定
  R2_CUSTOM_DOMAIN?: string; // R2バケットのカスタムドメイン

  // KV Namespaces
  CACHE: KVNamespace;
  SESSION: KVNamespace;
  RATE_LIMIT_KV: KVNamespace;
  IMAGE_CACHE?: KVNamespace;

  // R2 Bucket
  IMAGE_BUCKET: R2Bucket;
}

export interface Variables {
  requestId: string;
  startTime: number;
}
