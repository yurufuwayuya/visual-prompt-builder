/**
 * ヘルスチェックルート
 */

import { Hono } from 'hono';
import type { Bindings } from '../types';
import { createSuccessResponse } from '@visual-prompt-builder/shared';

export const healthRoute = new Hono<{ Bindings: Bindings }>();

// GET /health - 基本的なヘルスチェック
healthRoute.get('/', async (c) => {
  const env = c?.env?.ENVIRONMENT || 'unknown';

  const healthData = {
    status: 'healthy',
    environment: env,
    version: '1.0.0',
  };
  return c.json(createSuccessResponse(healthData));
});

// GET /health/detailed - 詳細なヘルスチェック
healthRoute.get('/detailed', async (c) => {
  const env = c?.env?.ENVIRONMENT || 'unknown';
  const checks = {
    api: true,
    kv_cache: false,
    kv_session: false,
  };

  // KV Namespace の接続確認
  try {
    if (c?.env?.CACHE) {
      await c.env.CACHE.put('health-check', 'ok', { expirationTtl: 60 });
      const value = await c.env.CACHE.get('health-check');
      checks.kv_cache = value === 'ok';
    } else {
      console.warn('CACHE KV namespace not available');
    }
  } catch (error) {
    console.error('Cache KV health check failed:', error);
  }

  try {
    if (c?.env?.SESSION) {
      await c.env.SESSION.put('health-check', 'ok', { expirationTtl: 60 });
      const value = await c.env.SESSION.get('health-check');
      checks.kv_session = value === 'ok';
    } else {
      console.warn('SESSION KV namespace not available');
    }
  } catch (error) {
    console.error('Session KV health check failed:', error);
  }

  const allHealthy = Object.values(checks).every((check) => check === true);

  const detailedHealthData = {
    status: allHealthy ? 'healthy' : 'degraded',
    environment: env,
    checks,
    version: '1.0.0',
  };
  const response = createSuccessResponse(detailedHealthData);
  response.success = allHealthy;
  return c.json(response);
});
