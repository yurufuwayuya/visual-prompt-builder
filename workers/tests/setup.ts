/**
 * Vitest セットアップファイル
 */

import { vi } from 'vitest';

// Cloudflare Workers環境のモック
global.Response = Response;
global.Request = Request;
global.Headers = Headers;

// 環境変数のモック
(global as any).env = {
  CACHE: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  ALLOWED_ORIGINS: 'http://localhost:5173',
};
