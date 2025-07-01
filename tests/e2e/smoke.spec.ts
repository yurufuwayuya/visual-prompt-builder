import { test, expect } from '@playwright/test';

test('smoke test - server is accessible', async ({ page }) => {
  console.log('Testing URL:', process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173');
  
  try {
    // タイムアウトを延長してアクセス
    const response = await page.goto('/', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    console.log('Response status:', response?.status());
    console.log('Response URL:', response?.url());
    
    // ステータスコードの確認
    if (response) {
      expect(response.status()).toBeLessThan(500);
    }
    
    // ページのタイトルを取得
    const title = await page.title();
    console.log('Page title:', title);
    
    // bodyが存在することを確認
    const bodyExists = await page.locator('body').count();
    expect(bodyExists).toBeGreaterThan(0);
    
  } catch (error) {
    console.error('Test failed with error:', error);
    throw error;
  }
});