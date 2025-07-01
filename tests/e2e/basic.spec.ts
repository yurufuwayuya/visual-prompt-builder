import { test, expect } from '@playwright/test';

test.describe('基本的な動作確認', () => {
  test('アプリケーションがアクセス可能', async ({ page }) => {
    // アプリケーションにアクセス
    const response = await page.goto('/');
    
    // ページが正常に読み込まれることを確認
    expect(response?.status()).toBeLessThan(400);
    
    // 何らかのコンテンツが表示されることを確認
    await page.waitForTimeout(2000); // 念のため待機
    
    const title = await page.title();
    console.log('Page title:', title);
    
    // タイトルが空でないことを確認
    expect(title).toBeTruthy();
  });
});