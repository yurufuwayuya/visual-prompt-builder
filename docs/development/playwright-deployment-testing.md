# Playwright デプロイメント環境テストガイド

## 概要
Playwrightを使用してデプロイ環境での動作確認を行うためのE2Eテストを実装しました。

## セットアップ完了内容

### 1. インストール済みパッケージ
- `@playwright/test`: Playwrightテストフレームワーク
- `playwright`: ブラウザ自動化ライブラリ

### 2. 設定ファイル
- `playwright.config.ts`: Playwright設定（ヘッドレスモード、タイムアウト、レポート設定）
- `.github/workflows/playwright.yml`: GitHub Actions CI/CD設定

### 3. テストファイル
- `tests/e2e/deployment.spec.ts`: 包括的なデプロイメントテスト
- `tests/e2e/simple-deployment.spec.ts`: 基本的な動作確認テスト

## テスト内容

### deployment.spec.ts
1. **ホームページの表示確認**
   - タイトル確認
   - ナビゲーション要素の確認

2. **プロンプトビルダーワークフロー**
   - ページ遷移
   - カテゴリー選択
   - ステップ遷移

3. **言語切り替え機能**
   - 言語切り替えボタンの動作
   - テキスト変更の確認

4. **レスポンシブデザイン**
   - モバイルビューポート対応

5. **エラーハンドリング**
   - 404ページ処理

6. **画像アップロード**
   - ファイル入力機能

7. **パフォーマンス**
   - ページ読み込み時間測定（3秒以内）

8. **アクセシビリティ**
   - キーボードナビゲーション

## 実行方法

### ローカル環境でのテスト

```bash
# 開発サーバーを起動（別ターミナル）
npm run dev

# テスト実行
npm run test:e2e

# UIモードで実行
npm run test:e2e:ui

# デバッグモード
npm run test:e2e:debug
```

### デプロイメント環境でのテスト

```bash
# 環境変数を設定して実行
DEPLOYMENT_URL=https://your-app.pages.dev npm run test:e2e:deployment

# または事前に環境変数を設定
export DEPLOYMENT_URL=https://your-app.pages.dev
npm run test:e2e:deployment
```

### GitHub Actionsでの自動実行

GitHub Actionsは以下のタイミングで自動実行されます：
- `main`ブランチへのプッシュ時
- プルリクエスト作成時
- デプロイメント完了時
- 手動トリガー（Actions画面から）

## トラブルシューティング

### ローカルでブラウザ依存関係エラーが出る場合

WSL環境などでは以下のコマンドで依存関係をインストール：

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y libnspr4 libnss3 libasound2

# または Playwright の依存関係インストールコマンド
sudo npx playwright install-deps
```

### デプロイメント環境でのテスト失敗時

1. **HTMLレポートを確認**
   ```bash
   npx playwright show-report
   ```

2. **スクリーンショットを確認**
   - `test-results/`ディレクトリに失敗時のスクリーンショットが保存されます

3. **トレースファイルを確認**
   ```bash
   npx playwright show-trace trace.zip
   ```

## CI/CD環境での実行

GitHub Actionsワークフローは自動的に：
1. 依存関係をインストール
2. Chromiumブラウザをセットアップ
3. テストを実行
4. レポートをアーティファクトとして保存

## 次のステップ

1. **実際のデプロイメントURLでテスト実行**
   ```bash
   DEPLOYMENT_URL=https://your-actual-url.com npm run test:e2e:deployment
   ```

2. **GitHub Actionsでの自動テスト確認**
   - リポジトリにプッシュ後、Actions画面で実行状況を確認

3. **テストケースの追加**
   - 必要に応じて`tests/e2e/`ディレクトリに新しいテストを追加