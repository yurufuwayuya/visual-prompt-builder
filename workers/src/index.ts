/**
 * Cloudflare Workers エントリーポイント
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import type { Bindings } from './types';
// import { apiRateLimit } from './middleware/rateLimit';

// ルートのインポート
import { healthRoute } from './routes/health';
import { promptRoute } from './routes/prompt';
import { translationRoute } from './routes/translation';

// Honoアプリケーションの作成
const app = new Hono<{ Bindings: Bindings }>();

// グローバルミドルウェア
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      // 許可するオリジンのリスト
      const allowedOrigins = [
        'http://localhost:5173', // 開発環境
        'http://localhost:3000', // 代替開発環境
        'https://visual-prompt-builder.pages.dev', // 本番環境
        'https://b33e2e63.visual-prompt-builder.pages.dev', // デプロイされたURL
      ];

      // 開発環境では環境変数から追加のオリジンを許可
      const env = c.env as Bindings;
      if (env.ALLOWED_ORIGINS) {
        allowedOrigins.push(...env.ALLOWED_ORIGINS.split(','));
      }

      // pages.devドメインからのアクセスを許可
      if (origin && origin.endsWith('.visual-prompt-builder.pages.dev')) {
        return origin;
      }

      // オリジンがない場合（同一オリジン）は許可
      if (!origin) return '*';

      // 許可リストに含まれているか確認
      return allowedOrigins.includes(origin) ? origin : null;
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400, // 24時間
  })
);
// app.use('*', compress()); // 一時的に無効化 - JSONパースエラー対応
app.use('*', secureHeaders());
app.use('*', prettyJSON());

// APIレート制限（/api/* のパスに適用）
// app.use('/api/*', apiRateLimit); // 一時的に無効化

// エラーハンドラー
app.onError((err, c) => {
  console.error(`Error: ${err.message}`, err);
  return c.json(
    {
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    },
    500
  );
});

// 404ハンドラー
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Not Found',
      path: c.req.path,
      timestamp: new Date().toISOString(),
    },
    404
  );
});

// ルートの登録
app.route('/health', healthRoute);
app.route('/api/v1/prompt', promptRoute);
app.route('/api/v1/translation', translationRoute);

// ルートハンドラー
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Visual Prompt Builder API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

export default app;
