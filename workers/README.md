# Workers Configuration

## Environment Variables

### KV Namespace IDs

KV Namespace
IDsは`wrangler.toml`に直接記述されています。新しい環境を追加する場合は、以下の手順に従ってください：

1. KV Namespaceを作成

```bash
wrangler kv:namespace create "NAMESPACE_NAME"
wrangler kv:namespace create "NAMESPACE_NAME" --preview
```

2. 生成されたIDを`wrangler.toml`に追加

### Secrets

APIキーなどの機密情報は`wrangler secret`で管理します：

```bash
# 開発環境
wrangler secret put IMAGE_API_KEY
wrangler secret put TRANSLATION_API_KEY
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY

# 本番環境
wrangler secret put IMAGE_API_KEY --env production
wrangler secret put TRANSLATION_API_KEY --env production
wrangler secret put R2_ACCESS_KEY_ID --env production
wrangler secret put R2_SECRET_ACCESS_KEY --env production
```

### Environment-specific Variables

環境固有の変数は`wrangler.toml`の`vars`セクションで管理されています：

- `ENVIRONMENT`: "development" | "production"
- `IMAGE_PROVIDER`: 画像生成プロバイダー
- `R2_CUSTOM_DOMAIN`: R2のカスタムドメイン
- `R2_S3_API_DEV`: 開発環境のS3互換API URL
- `R2_S3_API_PROD`: 本番環境のS3互換API URL

## Deployment

### Development

```bash
npm run dev
```

### Production

```bash
npm run deploy
```

## KV Namespace Management

### List all namespaces

```bash
wrangler kv:namespace list
```

### Delete a namespace

```bash
wrangler kv:namespace delete --namespace-id <ID>
```
