import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('画像生成機能のE2Eテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('画像生成の完全なフロー', async ({ page }) => {
    // ステップ1: カテゴリ選択
    await page.getByText('キャラクター・人物').click();
    await page.getByText('生き物・動物').click();
    await page.getByRole('button', { name: '次へ' }).click();

    // ステップ2: 詳細選択（キャラクター）
    await page.getByText('女性').first().click();
    await page.getByRole('button', { name: '次へ' }).click();

    // ステップ3: 詳細選択（生き物）
    await page.getByText('猫').first().click();
    await page.getByRole('button', { name: '次へ' }).click();

    // ステップ4: 画像アップロード
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.join(__dirname, '../fixtures/test-image.png');
    await fileInput.setInputFiles(testImagePath);

    // アップロードされた画像が表示されることを確認
    await expect(page.getByAltText('アップロード済み画像')).toBeVisible();
    await page.getByRole('button', { name: '次へ' }).click();

    // ステップ5: プロンプト確認と画像生成
    await expect(page.getByText('生成されたプロンプト')).toBeVisible();

    // AI画像生成セクションまでスクロール
    await page.getByText('AI画像生成 (Image-to-Image)').scrollIntoViewIfNeeded();

    // モデルを選択
    await page.selectOption('select[name="model"]', 'variations');

    // 強度を調整
    const strengthSlider = page.locator('input[type="range"]');
    await strengthSlider.fill('0.5');

    // 画像生成ボタンをクリック
    await page.getByRole('button', { name: '画像を生成' }).click();

    // ローディング状態を確認
    await expect(page.getByText('生成中...')).toBeVisible();

    // 生成結果を確認（モックAPIの場合は即座に完了）
    await expect(page.getByAltText('生成された画像')).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('button', { name: 'ダウンロード' })).toBeVisible();
  });

  test('画像なしでは生成ボタンが無効', async ({ page }) => {
    // プロンプト生成まで進む
    await page.getByText('キャラクター・人物').click();
    await page.getByRole('button', { name: '次へ' }).click();
    await page.getByText('女性').first().click();
    await page.getByRole('button', { name: '次へ' }).click();

    // 画像をアップロードせずに次へ
    await page.getByRole('button', { name: '次へ' }).click();

    // 結果ステップ
    await page.getByRole('button', { name: '次へ' }).click();

    // AI画像生成セクションまでスクロール
    await page.getByText('AI画像生成 (Image-to-Image)').scrollIntoViewIfNeeded();

    // 生成ボタンが無効であることを確認
    const generateButton = page.getByRole('button', { name: '画像を生成' });
    await expect(generateButton).toBeDisabled();
  });

  test('画像アップロード機能の詳細テスト', async ({ page }) => {
    // ステップをスキップして画像アップロードステップへ
    await page.getByText('キャラクター・人物').click();
    await page.getByRole('button', { name: '次へ' }).click();
    await page.getByText('女性').first().click();
    await page.getByRole('button', { name: '次へ' }).click();
    await page.getByRole('button', { name: '次へ' }).click();

    // ドラッグ&ドロップエリアの確認
    await expect(page.getByText('画像をドロップするか、クリックして選択')).toBeVisible();

    // ファイル選択
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.join(__dirname, '../fixtures/test-image.png');
    await fileInput.setInputFiles(testImagePath);

    // アップロード成功を確認
    await expect(page.getByAltText('アップロード済み画像')).toBeVisible();

    // 削除ボタンの確認
    const removeButton = page.getByRole('button', { name: '削除' });
    await expect(removeButton).toBeVisible();

    // 画像を削除
    await removeButton.click();
    await expect(page.getByAltText('アップロード済み画像')).not.toBeVisible();
  });

  test('異なるモデルでの画像生成', async ({ page }) => {
    // 基本的なフローを実行
    await page.getByText('アートスタイル・画風').click();
    await page.getByRole('button', { name: '次へ' }).click();
    await page.getByText('リアリスティック').first().click();
    await page.getByRole('button', { name: '次へ' }).click();

    // 画像アップロード
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.join(__dirname, '../fixtures/test-image.png');
    await fileInput.setInputFiles(testImagePath);
    await page.getByRole('button', { name: '次へ' }).click();

    // AI画像生成セクション
    await page.getByText('AI画像生成 (Image-to-Image)').scrollIntoViewIfNeeded();

    // 各モデルを試す
    const models = ['variations', 'fill', 'canny'];
    for (const model of models) {
      await page.selectOption('select[name="model"]', model);
      await expect(page.locator('select[name="model"]')).toHaveValue(model);
    }
  });

  test('エラーハンドリングの確認', async ({ page }) => {
    // APIキーが設定されていない場合のエラーをシミュレート
    // （実際のテストでは、モックサーバーでエラーレスポンスを返す）

    // 基本的なフローを実行
    await page.getByText('キャラクター・人物').click();
    await page.getByRole('button', { name: '次へ' }).click();
    await page.getByText('女性').first().click();
    await page.getByRole('button', { name: '次へ' }).click();

    // 画像アップロード
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.join(__dirname, '../fixtures/test-image.png');
    await fileInput.setInputFiles(testImagePath);
    await page.getByRole('button', { name: '次へ' }).click();

    // モックサーバーでエラーレスポンスを設定
    await page.route('**/api/v1/image/generate', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'APIキーが設定されていません' }),
      });
    });

    // 画像生成を試行
    await page.getByText('AI画像生成 (Image-to-Image)').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: '画像を生成' }).click();

    // エラーメッセージの確認
    await expect(page.getByText('APIキーが設定されていません')).toBeVisible();
  });

  test('生成画像のダウンロード', async ({ page }) => {
    // 基本的なフローを実行
    await page.getByText('キャラクター・人物').click();
    await page.getByRole('button', { name: '次へ' }).click();
    await page.getByText('女性').first().click();
    await page.getByRole('button', { name: '次へ' }).click();

    // 画像アップロード
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.join(__dirname, '../fixtures/test-image.png');
    await fileInput.setInputFiles(testImagePath);
    await page.getByRole('button', { name: '次へ' }).click();

    // モックサーバーで成功レスポンスを設定
    await page.route('**/api/v1/image/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          generatedImage:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        }),
      });
    });

    // 画像生成
    await page.getByText('AI画像生成 (Image-to-Image)').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: '画像を生成' }).click();

    // ダウンロードボタンの確認
    const downloadButton = page.getByRole('button', { name: 'ダウンロード' });
    await expect(downloadButton).toBeVisible();

    // ダウンロード処理の確認（実際のダウンロードはブラウザの設定に依存）
    const [download] = await Promise.all([page.waitForEvent('download'), downloadButton.click()]);

    // ファイル名の確認
    expect(download.suggestedFilename()).toMatch(/generated-image-\d+\.png/);
  });
});
