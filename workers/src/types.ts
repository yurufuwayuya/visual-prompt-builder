/**
 * Cloudflare Workers 環境の型定義
 */

export interface Bindings {
  // 環境変数
  ENVIRONMENT: 'development' | 'staging' | 'production';
  NODE_ENV?: 'development' | 'production';
  TRANSLATION_API_KEY?: string;
  LOGFLARE_API_KEY?: string;
  ALLOWED_ORIGINS?: string;

  // 画像生成API関連
  IMAGE_API_KEY?: string;
  IMAGE_PROVIDER?: 'replicate' | 'openai' | 'stability';

  // R2 設定
  R2_CUSTOM_DOMAIN?: string; // R2バケットのカスタムドメイン
  R2_S3_API_DEV?: string; // 開発環境用S3 APIエンドポイント
  R2_S3_API_PROD?: string; // 本番環境用S3 APIエンドポイント
  R2_ACCESS_KEY_ID?: string; // R2 S3 APIアクセスキー
  R2_SECRET_ACCESS_KEY?: string; // R2 S3 APIシークレットキー

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
