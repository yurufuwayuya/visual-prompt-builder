# デプロイ手順書

## 概要

Visual Prompt BuilderをCloudflare Pages（フロントエンド）とCloudflare Workers（バックエンド）にデプロイする手順を説明します。

## 前提条件

- Cloudflareアカウントを持っていること
- Wrangler CLIがインストールされていること
- GitHubリポジトリが設定されていること

## 準備作業

### 1. Cloudflareアカウントの設定

1. [Cloudflare](https://www.cloudflare.com)にログイン
2. アカウントIDをメモしておく（Workers & Pages > Overview）

### 2. Wrangler CLIのインストールとログイン

```bash
# Wranglerのインストール
npm install -g wrangler

# Cloudflareにログイン
wrangler login
```

### 3. 環境変数の準備

```bash
# Cloudflareアカウント設定
export CLOUDFLARE_ACCOUNT_ID="your-account-id"

# API Keys（必要に応じて）
export TRANSLATION_API_KEY="your-translation-api-key"
```

## バックエンド（Workers）のデプロイ

### 1. KV Namespaceの作成

```bash
# 本番環境用KV Namespace作成
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "SESSION"
wrangler kv:namespace create "RATE_LIMIT_KV"

# 作成されたIDをwrangler.tomlの本番環境セクションに記載
```

### 2. wrangler.tomlの更新

```toml
# wrangler.toml
[env.production]
name = "visual-prompt-builder"
vars = { ENVIRONMENT = "production" }

[[env.production.kv_namespaces]]
binding = "CACHE"
id = "実際のID" # 上記コマンドで取得したID

[[env.production.kv_namespaces]]
binding = "SESSION"
id = "実際のID"

[[env.production.kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "実際のID"
```

### 3. シークレットの設定

```bash
# 本番環境にシークレットを設定
wrangler secret put TRANSLATION_API_KEY --env production
# プロンプトが表示されたらAPIキーを入力

# 許可するオリジンを設定
wrangler secret put ALLOWED_ORIGINS --env production
# 例: https://your-domain.com,https://www.your-domain.com
```

### 4. Workersのデプロイ

```bash
# ビルド
npm run build:worker

# 本番環境にデプロイ
npm run deploy:worker:production

# または直接wranglerコマンド
wrangler deploy --env production
```

### 5. デプロイの確認

```bash
# デプロイされたWorkerのURL確認
wrangler tail --env production

# ヘルスチェック
curl https://visual-prompt-builder.workers.dev/health
```

## フロントエンド（Pages）のデプロイ

### 方法1: GitHub連携（推奨）

1. **Cloudflare Pagesプロジェクトの作成**
   - Cloudflare Dashboard > Pages > Create a project
   - GitHubと連携
   - リポジトリを選択

2. **ビルド設定**
   ```
   Build command: npm run build:frontend
   Build output directory: frontend/dist
   Root directory: /
   ```

3. **環境変数設定**
   ```
   NODE_VERSION=18
   VITE_API_URL=https://visual-prompt-builder.workers.dev
   ```

4. **デプロイトリガー**
   - mainブランチへのpushで自動デプロイ
   - プレビューデプロイ: PRごと

### 方法2: 手動デプロイ

```bash
# フロントエンドのビルド
npm run build:frontend

# Pagesにデプロイ
npx wrangler pages deploy frontend/dist --project-name visual-prompt-builder

# カスタムドメインの設定（オプション）
# Cloudflare Dashboard > Pages > Custom domains
```

## 環境別設定

### 開発環境

```bash
# ローカル開発
npm run dev          # フロントエンド
npm run dev:worker   # バックエンド
```

### ステージング環境

```bash
# ステージング環境へのデプロイ
wrangler deploy --env staging

# ステージング用Pages
npx wrangler pages deploy frontend/dist --project-name visual-prompt-builder-staging
```

### 本番環境

```bash
# 本番環境へのデプロイ
wrangler deploy --env production

# 本番用Pages（GitHub連携推奨）
# mainブランチへのpushで自動デプロイ
```

## デプロイ後の確認事項

### 1. 動作確認チェックリスト

- [ ] ヘルスチェックAPI（/health）が200を返す
- [ ] フロントエンドが正常に表示される
- [ ] プロンプト生成APIが動作する
- [ ] レート制限が機能している
- [ ] CORSが正しく設定されている

### 2. 監視設定

```bash
# Workers Analytics確認
wrangler tail --env production

# エラーログ確認
wrangler tail --env production --format pretty
```

### 3. パフォーマンス確認

- Cloudflare Analytics でリクエスト数確認
- Web Analytics でページビュー確認
- Core Web Vitals の測定

## ロールバック手順

### Workersのロールバック

```bash
# デプロイ履歴確認
wrangler deployments list --env production

# 特定バージョンにロールバック
wrangler rollback [deployment-id] --env production
```

### Pagesのロールバック

1. Cloudflare Dashboard > Pages > Deployments
2. ロールバックしたいデプロイメントを選択
3. "Rollback to this deployment"をクリック

## トラブルシューティング

### よくある問題

#### 1. KV Namespaceエラー

```
Error: KV namespace not found
```

**解決方法:**
- wrangler.tomlのKV IDが正しいか確認
- `wrangler kv:namespace list`で存在確認

#### 2. CORS エラー

```
Access-Control-Allow-Origin error
```

**解決方法:**
- ALLOWED_ORIGINSシークレットを確認
- フロントエンドのURLが含まれているか確認

#### 3. ビルドエラー

```
Build failed
```

**解決方法:**
- Node.jsバージョンを確認（v18以上）
- 依存関係を再インストール（`npm ci`）

### デバッグコマンド

```bash
# リアルタイムログ
wrangler tail --env production

# KV内容確認
wrangler kv:key list --namespace-id [ID]

# シークレット一覧
wrangler secret list --env production
```

## セキュリティ考慮事項

1. **APIキーの管理**
   - シークレットは環境変数経由で設定
   - コードにハードコードしない

2. **アクセス制限**
   - CORS設定で許可オリジンを制限
   - レート制限を適切に設定

3. **HTTPS必須**
   - CloudflareのSSL/TLS設定を「Full」以上に

## メンテナンス

### 定期的な作業

1. **依存関係の更新**
   ```bash
   npm update
   npm audit fix
   ```

2. **KVストレージのクリーンアップ**
   ```bash
   # 期限切れデータの確認と削除
   wrangler kv:key list --namespace-id [ID] --prefix "rate-limit:"
   ```

3. **ログの確認**
   - エラー率の監視
   - パフォーマンスメトリクスの確認

## 災害復旧計画

1. **バックアップ**
   - コードはGitHubで管理
   - KVデータは定期的にエクスポート

2. **復旧手順**
   - GitHubから最新コードを取得
   - 上記デプロイ手順を実行
   - KVデータをインポート（必要に応じて）

## 連絡先

デプロイに関する問題が発生した場合：

- 技術担当: [担当者名]
- メール: [support@example.com]
- 緊急連絡先: [電話番号]