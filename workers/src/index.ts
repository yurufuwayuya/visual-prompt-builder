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
import { imageRoute } from './routes/image';

// Honoアプリケーションの作成
const app = new Hono<{ Bindings: Bindings }>();

// CORS origin検証関数
const validateOrigin = (origin: string | undefined, env: Bindings): string | null => {
  // 許可するオリジンのリスト
  const allowedOrigins = [
    'http://localhost:5173', // 開発環境
    'http://localhost:3000', // 代替開発環境
    'https://visual-prompt-builder.pages.dev', // 本番環境
    'https://57774477.visual-prompt-builder.pages.dev', // デプロイされたURL
  ];

  // 開発環境では環境変数から追加のオリジンを許可
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
};

// グローバルミドルウェア
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin, c) => validateOrigin(origin, c.env as Bindings),
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
  console.error('[Global Error Handler] Error caught:', err);
  console.error('[Global Error Handler] Error message:', err.message);
  console.error('[Global Error Handler] Error stack:', err.stack);
  console.error('[Global Error Handler] Context env:', c?.env);
  console.error('[Global Error Handler] Request path:', c?.req?.path);

  // 開発環境でのみスタックトレースを露出
  const isDevelopment = c.env.ENVIRONMENT === 'development' || c.req.url.includes('localhost');

  // Handle Zod validation errors specially
  let errorMessage = err.message;
  let statusCode = 500;

  // Check if it's a Zod error (has issues property)
  if (err.name === 'ZodError' && 'issues' in err) {
    statusCode = 400;
    // Extract the first validation error message
    const issues = (err as { issues: Array<{ message: string }> }).issues;
    if (Array.isArray(issues) && issues.length > 0) {
      errorMessage = issues.map((issue: { message: string }) => issue.message).join(', ');
    }
  }

  return c.json(
    {
      success: false,
      error: errorMessage,
      ...(isDevelopment && {
        stack: err.stack,
        name: err.name,
        // Don't include the raw error object to avoid React rendering issues
      }),
      timestamp: new Date().toISOString(),
    },
    statusCode
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
app.route('/api/v1/image', imageRoute);

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
