# Playwright E2Eテスト

このディレクトリには、デプロイ環境での動作確認を行うためのPlaywrightテストが含まれています。

## セットアップ

```bash
# Playwrightのインストール
npm install

# ブラウザのインストール
npm run playwright:install
```

## テストの実行

### ローカル環境でのテスト

```bash
# 全てのテストを実行
npm run test:e2e

# UIモードで実行（インタラクティブ）
npm run test:e2e:ui

# デバッグモードで実行
npm run test:e2e:debug

# ヘッドレスモードを無効にして実行（ブラウザが表示される）
npm run test:e2e:headed
```

### デプロイ環境でのテスト

```bash
# 環境変数を設定してテスト実行
DEPLOYMENT_URL=https://your-deployed-app.com npm run test:e2e:deployment

# または、環境変数を事前に設定
export DEPLOYMENT_URL=https://your-deployed-app.com
npm run test:e2e:deployment
```

## テストケース

### deployment.spec.ts
デプロイ環境での基本的な動作確認を行うテストケース：

1. **ホームページの表示確認**
   - タイトルの確認
   - 主要な要素の表示確認
   - ナビゲーションボタンの存在確認

2. **プロンプトビルダーのワークフロー**
   - 新規作成ボタンのクリック
   - ページ遷移の確認
   - カテゴリー選択の動作
   - ステップ間の遷移

3. **言語切り替え機能**
   - 言語切り替えボタンの動作
   - テキストの変更確認

4. **レスポンシブデザイン**
   - モバイルビューポートでの表示確認
   - 主要要素の表示確認

5. **エラーハンドリング**
   - 404ページの処理
   - 適切なリダイレクト

6. **画像アップロード機能**
   - ファイル入力の動作確認
   - アップロード処理の確認

7. **パフォーマンス**
   - ページ読み込み時間の測定
   - 3秒以内の読み込み確認

8. **アクセシビリティ**
   - キーボードナビゲーションの動作
   - フォーカス管理の確認

## 設定

### playwright.config.ts
- 複数のブラウザでのテスト（Chrome、Firefox、Safari）
- モバイルデバイスのエミュレーション
- スクリーンショットの自動取得（失敗時）
- トレースの記録（リトライ時）
- ローカル開発サーバーの自動起動

## トラブルシューティング

### ブラウザがインストールされていない場合
```bash
npm run playwright:install
```

### テストが失敗する場合
1. HTMLレポートを確認
   ```bash
   npx playwright show-report
   ```

2. トレースファイルを確認
   ```bash
   npx playwright show-trace trace.zip
   ```

### タイムアウトエラーが発生する場合
- `playwright.config.ts`でタイムアウト設定を調整
- ネットワーク接続を確認
- デプロイ環境のURLが正しいか確認