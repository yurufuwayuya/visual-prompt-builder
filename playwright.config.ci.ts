import { defineConfig, devices } from '@playwright/test';

/**
 * CI環境用のPlaywright設定
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: true,
  retries: 2,
  workers: 1,
  reporter: [['html'], ['list']],
  
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        headless: true,
      },
    },
  ],

  // CI環境では開発サーバーを起動
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'cd frontend && npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: false,
    timeout: 180 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});