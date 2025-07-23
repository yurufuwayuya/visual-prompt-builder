/**
 * 共通のテストセットアップ
 */

import { vi, beforeAll, afterAll } from 'vitest';

/**
 * Cloudflare KV Namespaceのモック
 */
export function mockKVNamespace() {
  return {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue({ keys: [], list_complete: true }),
    getWithMetadata: vi.fn().mockResolvedValue({ value: null, metadata: null }),
  };
}

/**
 * グローバルなfetch APIのモック
 */
export function mockFetch(response: any = {}) {
  const mockResponse = {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(response),
    text: vi.fn().mockResolvedValue(JSON.stringify(response)),
    ...response,
  };

  return vi.fn().mockResolvedValue(mockResponse);
}

/**
 * コンソールエラーの抑制
 */
export function suppressConsoleError() {
  const originalError = console.error;

  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  return {
    getConsoleErrorMock: () => console.error as any,
  };
}
