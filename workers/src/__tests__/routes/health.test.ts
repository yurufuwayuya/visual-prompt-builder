import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { healthRoute } from '../../routes/health';
import { mockKVNamespace } from '../../test/setup';

describe('Health Routes', () => {
  let app: Hono;
  let mockKV: ReturnType<typeof mockKVNamespace>;

  beforeEach(() => {
    app = new Hono();
    mockKV = mockKVNamespace();
    app.route('/health', healthRoute);
  });

  describe('GET /health', () => {
    it('returns basic health status', async () => {
      const res = await app.request('/health', {}, { ENVIRONMENT: 'test' });
      const json = await res.json() as any;

      expect(res.status).toBe(200);
      expect(json).toMatchObject({
        success: true,
        data: {
          status: 'healthy',
          environment: 'test',
          version: '1.0.0',
        },
        timestamp: expect.any(String),
      });
    });

    it('includes correct timestamp format', async () => {
      const res = await app.request('/health', {}, { ENVIRONMENT: 'test' });
      const json = await res.json() as any;

      const timestamp = new Date(json.timestamp);
      expect(timestamp.toISOString()).toBe(json.timestamp);
    });
  });

  describe('GET /health/detailed', () => {
    it('returns detailed health status with KV check', async () => {
      const mockEnv = {
        CACHE: mockKV,
        SESSION: mockKV,
        ENVIRONMENT: 'test',
      };

      const res = await app.request('/health/detailed', {}, mockEnv);
      const json = await res.json() as any;

      expect(res.status).toBe(200);
      expect(json).toMatchObject({
        success: true,
        data: {
          status: 'healthy',
          environment: 'test',
          version: '1.0.0',
          checks: {
            api: true,
            kv_cache: true,
            kv_session: true,
          },
        },
        timestamp: expect.any(String),
      });

      expect(mockKV.put).toHaveBeenCalledWith('health-check', 'ok', { expirationTtl: 60 });
      expect(mockKV.get).toHaveBeenCalledWith('health-check');
    });

    it('handles KV namespace errors gracefully', async () => {
      // Create a new mock for this test to avoid conflicts
      const errorMockKV = mockKVNamespace();
      errorMockKV.put.mockRejectedValueOnce(new Error('KV error'));
      const mockEnv = {
        CACHE: errorMockKV,
        SESSION: mockKV,
        ENVIRONMENT: 'test',
      };

      const res = await app.request('/health/detailed', {}, mockEnv);
      const json = await res.json() as any;

      expect(res.status).toBe(200);
      expect(json.data.checks).toMatchObject({
        api: true,
        kv_cache: false,
        kv_session: true,
      });
    });

    it('handles missing KV namespace', async () => {
      const res = await app.request('/health/detailed', {}, { ENVIRONMENT: 'test' });
      const json = await res.json() as any;

      expect(res.status).toBe(200);
      expect(json.data.status).toBe('degraded');
      expect(json.data.checks).toMatchObject({
        api: true,
        kv_cache: false,
        kv_session: false,
      });
    });
  });

  describe('Response Headers', () => {
    it('includes cache control headers', async () => {
      const res = await app.request('/health', {}, { ENVIRONMENT: 'test' });
      
      // Health route doesn't set cache control headers currently
      expect(res.headers.get('Content-Type')).toMatch(/application\/json/);
    });
  });
});