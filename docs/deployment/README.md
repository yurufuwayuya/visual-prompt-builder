# デプロイメントガイド

## 環境変数設定

### 必要な環境変数

1. **GitHub Secrets**に以下を設定:
   - `CLOUDFLARE_API_TOKEN`: Cloudflare APIトークン
   - `CLOUDFLARE_ACCOUNT_ID`: CloudflareアカウントID

2. **Cloudflare Workers**の環境変数:
   ```bash
   # KV Namespace作成
   npx wrangler kv:namespace create "PROMPT_CACHE"
   npx wrangler kv:namespace create "PROMPT_CACHE" --preview
   ```

3. **ローカル開発用** (.env.local):
   ```
   VITE_API_URL=http://localhost:8787
   ```

## デプロイ手順

### 1. 初回セットアップ

```bash
# Cloudflareアカウントでログイン
npx wrangler login

# KV Namespaceの作成
npm run setup:kv
```

### 2. ステージング環境へのデプロイ

```bash
# developブランチにプッシュ
git push origin develop
```

GitHub Actionsが自動的に:
- テスト実行
- ビルド
- プレビュー環境へデプロイ

### 3. 本番環境へのデプロイ

```bash
# mainブランチにマージ
git checkout main
git merge develop
git push origin main
```

GitHub Actionsが自動的に:
- テスト実行
- プロダクションビルド
- Cloudflare Workersへデプロイ
- Cloudflare Pagesへデプロイ

## 動作確認

### ステージング環境
- Frontend: `https://[branch-name].visual-prompt-builder.pages.dev`
- API: `https://visual-prompt-builder-staging.workers.dev`

### 本番環境
- Frontend: `https://visual-prompt-builder.pages.dev`
- API: `https://visual-prompt-builder.workers.dev`

## トラブルシューティング

### ビルドエラー
```bash
# キャッシュクリア
npm run clean
npm install
npm run build
```

### デプロイエラー
1. GitHub Secretsが正しく設定されているか確認
2. Cloudflare API権限を確認
3. KV Namespaceが作成されているか確認

### パフォーマンス問題
```bash
# バンドルサイズ確認
npm run analyze
```