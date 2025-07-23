/**
 * Vitest セットアップファイル
 */

import { vi } from 'vitest';

// Cloudflare Workers環境のモック
global.Response = Response;
global.Request = Request;
(global as any).Headers = Headers;

// 環境変数のモック
const globalWithEnv = global as any;
globalWithEnv.env = {
  CACHE: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  ALLOWED_ORIGINS: 'http://localhost:5173',
};
