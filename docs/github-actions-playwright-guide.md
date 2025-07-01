# GitHub Actions Playwright テストガイド

## 概要
GitHub Actionsを使用してPlaywrightのE2Eテストを自動実行する設定が完了しています。

## 自動実行タイミング

1. **プッシュ時**: `main`または`master`ブランチへのプッシュ
2. **プルリクエスト時**: `main`または`master`ブランチへのPR作成・更新
3. **デプロイメント完了時**: Cloudflare Pagesなどのデプロイ完了通知
4. **手動実行**: GitHub Actions画面から手動トリガー

## テスト実行手順

### 1. コードをGitHubにプッシュ

```bash
# 変更をステージング
git add .

# コミット
git commit -m "feat: Add Playwright E2E tests for deployment verification"

# GitHubにプッシュ
git push origin main
```

### 2. GitHub Actionsで実行状況を確認

1. GitHubリポジトリページを開く
2. "Actions"タブをクリック
3. "Playwright Tests"ワークフローを選択
4. 実行中または完了したワークフローをクリックして詳細を確認

### 3. テスト結果の確認

#### 成功時
- ✅ 緑のチェックマークが表示
- すべてのテストがパス

#### 失敗時
- ❌ 赤のXマークが表示
- 失敗したテストの詳細を確認可能
- "Artifacts"セクションから`playwright-report`をダウンロードして詳細レポートを確認

### 4. 手動実行方法

1. GitHub Actions画面で"Playwright Tests"を選択
2. "Run workflow"ボタンをクリック
3. オプション：デプロイメントURLを入力（任意）
4. "Run workflow"をクリックして実行

## テストレポートの確認

### HTMLレポート
1. Actions実行結果ページの"Artifacts"セクション
2. `playwright-report`をダウンロード
3. ZIPファイルを解凍
4. `index.html`をブラウザで開く

### レポート内容
- テスト実行結果サマリー
- 各テストの詳細（成功/失敗）
- 失敗時のスクリーンショット
- 実行時間
- エラーメッセージとスタックトレース

## デプロイメント環境のテスト

### Cloudflare Pagesとの連携
Cloudflare Pagesのデプロイ完了時に自動的にテストが実行されます：

1. Cloudflare Pagesでデプロイ
2. デプロイ完了通知がGitHubに送信
3. Playwright Testsが自動起動
4. デプロイされたURLに対してテスト実行

### 特定のURLをテスト
手動実行時にURLを指定：

1. Actions画面で"Run workflow"
2. "Deployment URL to test"フィールドにURLを入力
   例: `https://your-app.pages.dev`
3. 実行

## トラブルシューティング

### テストが失敗する場合

1. **タイムアウトエラー**
   - ネットワーク遅延の可能性
   - `playwright.config.ts`でタイムアウト値を調整

2. **要素が見つからない**
   - セレクターを確認
   - ページの読み込み完了を待つ処理を追加

3. **デプロイメントURLへのアクセスエラー**
   - URLが正しいか確認
   - 認証が必要な場合は環境変数を設定

### ワークフローの編集

`.github/workflows/playwright.yml`を編集して設定変更：

- Node.jsバージョン変更
- 追加のブラウザをテスト
- 環境変数の追加
- 並列実行数の調整

## 次のステップ

1. GitHubにプッシュしてテスト実行を確認
2. 必要に応じてテストケースを追加
3. Cloudflare Pagesとの連携設定（デプロイ時の自動テスト）