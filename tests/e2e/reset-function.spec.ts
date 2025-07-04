import { test, expect } from '@playwright/test';

test.describe('リセット機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // プロンプト作成画面へ遷移
    await page.click('text=プロンプトを作成');
    await page.waitForURL('**/builder');
  });

  test('リセットボタンで全ての選択がクリアされる', async ({ page }) => {
    // ステップ1: カテゴリ選択
    await page.click('text=ポートレート');
    await page.click('button:has-text("次へ")');

    // カテゴリが選択されたことを確認
    await expect(page.locator('text=ポートレート').first()).toBeVisible();

    // ステップ2: 詳細選択
    await page.waitForTimeout(500);
    await page.click('text=笑顔');
    await page.click('text=カジュアル');
    await page.click('button:has-text("次へ")');

    // ステップ3: スタイル設定
    await page.waitForTimeout(500);

    // 色を選択
    await page.click('button:has-text("青")');
    await page.click('button:has-text("赤")');

    // スタイルを選択
    await page.click('button:has-text("リアル")');

    // 雰囲気を選択
    await page.click('button[aria-label="楽しい"]');

    // 照明を選択
    await page.click('button[aria-label="自然光"]');

    // プロンプトを生成
    await page.click('button:has-text("プロンプトを生成")');

    // プロンプトが生成されるのを待つ
    await page.waitForSelector('text=生成されたプロンプト', { timeout: 10000 });

    // 確認ダイアログで「OK」をクリックする準備
    page.once('dialog', (dialog) => dialog.accept());

    // リセットボタンをクリック
    await page.click('button:has-text("リセット")');

    // リセット後の確認
    // 1. ページが最上部にスクロールされる
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBe(0);

    // 2. カテゴリの選択がクリアされる
    const categoryButtons = page.locator('text=ポートレート');
    const selectedCategory = await categoryButtons.evaluateAll((buttons) =>
      buttons.filter((btn) => btn.classList.contains('border-primary-600'))
    );
    expect(selectedCategory).toHaveLength(0);

    // 3. ステップ2〜4がグレーアウトされる
    const detailSection = page.locator('section').nth(1);
    await expect(detailSection).toHaveClass(/opacity-30/);

    const styleSection = page.locator('section').nth(2);
    await expect(styleSection).toHaveClass(/opacity-30/);

    const resultSection = page.locator('section').nth(3);
    await expect(resultSection).toHaveClass(/opacity-30/);

    // 4. スタイル設定がリセットされる（再度カテゴリを選択して確認）
    await page.click('text=ポートレート');
    await page.click('button:has-text("次へ")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("次へ")'); // 詳細をスキップ
    await page.waitForTimeout(500);

    // 色の選択がリセットされていることを確認
    const blueButton = page.locator('button:has-text("青")').first();
    await expect(blueButton).not.toHaveClass(/border-primary-600/);

    const redButton = page.locator('button:has-text("赤")').first();
    await expect(redButton).not.toHaveClass(/border-primary-600/);

    // スタイルの選択がリセットされていることを確認
    const styleButton = page.locator('button:has-text("リアル")').first();
    await expect(styleButton).not.toHaveClass(/border-primary-600/);

    // 雰囲気の選択がリセットされていることを確認
    const moodButton = page.locator('button[aria-label="楽しい"]');
    await expect(moodButton).not.toHaveClass(/bg-primary-600/);

    // 照明の選択がリセットされていることを確認
    const lightingButton = page.locator('button[aria-label="自然光"]');
    await expect(lightingButton).not.toHaveClass(/bg-primary-600/);
  });

  test('キャンセルボタンでリセットをキャンセルできる', async ({ page }) => {
    // カテゴリを選択
    await page.click('text=ポートレート');
    await page.click('button:has-text("次へ")');

    // 確認ダイアログで「キャンセル」をクリックする準備
    page.once('dialog', (dialog) => dialog.dismiss());

    // リセットボタンをクリック
    await page.click('button:has-text("リセット")');

    // カテゴリの選択が維持されていることを確認
    await expect(page.locator('text=ポートレート').first()).toBeVisible();
    const categoryButton = page.locator('button').filter({ hasText: 'ポートレート' }).first();
    await expect(categoryButton).toHaveClass(/border-primary-600/);
  });
});
