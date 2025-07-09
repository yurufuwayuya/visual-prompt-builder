import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'miniflare',
    environmentOptions: {
      // Miniflare specific options
      kvPersist: false,
      durableObjectsPersist: false,
      bindings: {
        ENVIRONMENT: 'test',
      },
    },
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.*', '**/types.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@visual-prompt-builder/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
});
