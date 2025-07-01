import { beforeAll, afterEach, vi } from 'vitest';

// Set up test environment
beforeAll(() => {
  // Any global setup for workers tests
});

// Clean up after each test
afterEach(() => {
  // Reset any mocks or state
});

// Mock KV namespace for tests
export const mockKVNamespace = () => {
  const store = new Map();
  
  return {
    get: vi.fn(async (key: string) => {
      const value = store.get(key);
      return value !== undefined ? value : null;
    }),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
      return undefined;
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    list: vi.fn(async () => ({
      keys: Array.from(store.keys()).map(name => ({ name })),
      list_complete: true,
      cursor: '',
    })),
  };
};