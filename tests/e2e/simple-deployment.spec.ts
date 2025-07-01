import { test, expect } from '@playwright/test';

test.describe('基本的な動作確認', () => {
  test('アプリケーションが正常に起動する', async ({ page }) => {
    // アプリケーションにアクセス
    await page.goto('/');
    
    // ページが読み込まれることを確認
    await page.waitForLoadState('networkidle');
    
    // 基本的な要素が存在することを確認
    const body = await page.locator('body');
    await expect(body).toBeVisible();
    
    // JavaScriptが動作していることを確認
    const hasReactRoot = await page.evaluate(() => {
      return document.getElementById('root') !== null;
    });
    expect(hasReactRoot).toBe(true);
  });

  test('メインコンテンツが表示される', async ({ page }) => {
    await page.goto('/');
    
    // アプリケーションのルート要素を確認
    const root = page.locator('#root');
    await expect(root).toBeVisible();
    
    // 何らかのコンテンツが表示されていることを確認
    const content = await root.textContent();
    expect(content).toBeTruthy();
    expect(content?.length).toBeGreaterThan(0);
  });

  test('エラーが発生していないことを確認', async ({ page }) => {
    // コンソールエラーを監視
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // ページエラーを監視
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // エラーがないことを確認
    expect(errors).toHaveLength(0);
  });
});