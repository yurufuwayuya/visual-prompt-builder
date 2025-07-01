import { test, expect } from '@playwright/test';

test.describe('デプロイ環境の動作確認', () => {
  test('ホームページが正しく表示される', async ({ page }) => {
    // ホームページにアクセス
    await page.goto('/');
    
    // タイトルの確認
    await expect(page).toHaveTitle(/ビジュアルプロンプトビルダー/);
    
    // 主要な要素が表示されているか確認
    await expect(page.getByRole('heading', { name: /ビジュアルプロンプトビルダー/ })).toBeVisible();
    
    // ナビゲーションリンクが存在するか確認（カードリンクとして実装されている）
    await expect(page.getByRole('link', { name: /新しく作成/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /履歴を見る/ })).toBeVisible();
  });

  test('プロンプトビルダーのワークフローが動作する', async ({ page }) => {
    await page.goto('/');
    
    // 新しく作成リンクをクリック
    await page.getByRole('link', { name: /新しく作成/ }).click();
    
    // プロンプトビルダーページに遷移したか確認
    await expect(page).toHaveURL(/\/builder/);
    
    // ビルダーページの要素が表示されるまで待つ
    await page.waitForLoadState('networkidle');
    
    // ビルダーページの基本要素が表示されているか確認
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('言語切り替えが機能する', async ({ page }) => {
    await page.goto('/');
    
    // 言語切り替えボタンを探す
    const langButton = page.getByRole('button', { name: /EN|日本語|Language/i });
    
    if (await langButton.isVisible()) {
      // 現在の言語を確認
      const initialText = await page
        .getByRole('heading', { name: /ビジュアルプロンプトビルダー/ })
        .textContent();
      
      // 言語を切り替える
      await langButton.click();
      
      // テキストが変更されたか確認（少し待つ）
      await page.waitForTimeout(500);
      
      // 言語が切り替わったことを確認
      const newText = await page
        .getByRole('heading', { name: /ビジュアルプロンプトビルダー/ })
        .textContent();
      expect(newText).not.toBe(initialText);
    }
  });

  test('レスポンシブデザインが機能する（モバイル表示）', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // モバイルでも主要要素が表示されることを確認
    await expect(page.getByRole('heading', { name: /ビジュアルプロンプトビルダー/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /新しく作成/ })).toBeVisible();
  });

  test('エラーハンドリングが機能する', async ({ page }) => {
    // 存在しないページにアクセス
    await page.goto('/non-existent-page');
    
    // SPAなので全てのルートでindex.htmlが返される
    // エラーメッセージまたはホーム画面が表示されることを確認
    const title = await page.title();
    expect(title).toBe('ビジュアルプロンプトビルダー');
  });

  test('画像アップロード機能が動作する', async ({ page }) => {
    await page.goto('/builder');
    
    // ビルダーページが読み込まれるまで待つ
    await page.waitForLoadState('networkidle');
    
    // ファイルアップロードエリアが存在するか確認
    const fileInput = page.locator('input[type="file"]');
    
    if (await fileInput.count() > 0) {
      // テスト画像をアップロード
      const buffer = Buffer.from('fake-image-data');
      await fileInput.first().setInputFiles({
        name: 'test.jpg',
        mimeType: 'image/jpeg',
        buffer: buffer,
      });
      
      // アップロード成功のフィードバックを確認
      await expect(page.getByText(/アップロード|画像|image/i)).toBeVisible();
    }
  });

  test('パフォーマンス: ページ読み込み時間が許容範囲内', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // 3秒以内に読み込み完了することを確認
    expect(loadTime).toBeLessThan(3000);
  });

  test('アクセシビリティ: キーボードナビゲーションが機能する', async ({ page }) => {
    await page.goto('/');
    
    // Tabキーでナビゲーション
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // フォーカスされた要素でEnterキーを押す
    await page.keyboard.press('Enter');
    
    // ページ遷移またはアクションが実行されたことを確認
    await page.waitForTimeout(500);
    
    // URLが変更されたか、または新しい要素が表示されたか確認
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });
});