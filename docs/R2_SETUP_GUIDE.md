# R2 S3 API セットアップガイド

このガイドでは、Cloudflare R2のS3互換APIを使用するための設定手順を説明します。

## 前提条件

- Cloudflareアカウント
- R2バケット（prompt-builder, prompt-builder-dev）が作成済み
- Wranglerがインストール済み

## 1. R2 APIトークンの作成

### Cloudflareダッシュボードでの手順

1. [Cloudflareダッシュボード](https://dash.cloudflare.com)にログイン
2. 左側メニューから「R2」を選択
3. 「Manage R2 API Tokens」をクリック
4. 「Create API token」をクリック
5. 以下の設定でトークンを作成：
   - **Token name**: `visual-prompt-builder-r2`
   - **Permissions**: `Object Read & Write`
   - **Specify bucket(s)**: 
     - `prompt-builder`
     - `prompt-builder-dev`
   - **TTL**: 必要に応じて設定（推奨: 制限なし）

6. 「Create API Token」をクリック
7. 表示される以下の情報を安全に保存：
   - **Access Key ID**
   - **Secret Access Key**

## 2. Wranglerでシークレットを設定

### 開発環境用

```bash
cd /home/yuya-kitamori/visual-prompt-builder/workers

# アクセスキーIDを設定
wrangler secret put R2_ACCESS_KEY_ID
# プロンプトが表示されたら、先ほど保存したAccess Key IDを入力

# シークレットアクセスキーを設定
wrangler secret put R2_SECRET_ACCESS_KEY
# プロンプトが表示されたら、先ほど保存したSecret Access Keyを入力
```

### 本番環境用

```bash
# 本番環境用のシークレット設定
wrangler secret put R2_ACCESS_KEY_ID --env production
# プロンプトが表示されたら、Access Key IDを入力

wrangler secret put R2_SECRET_ACCESS_KEY --env production
# プロンプトが表示されたら、Secret Access Keyを入力
```

## 3. 設定の確認

シークレットが正しく設定されたか確認：

```bash
# 開発環境のシークレット一覧
wrangler secret list

# 本番環境のシークレット一覧
wrangler secret list --env production
```

期待される出力：
```
[
  {
    "name": "R2_ACCESS_KEY_ID",
    "type": "secret_text"
  },
  {
    "name": "R2_SECRET_ACCESS_KEY",
    "type": "secret_text"
  },
  ...
]
```

## 4. 動作確認

### ローカル開発環境での確認

```bash
# 開発サーバーを起動
npm run dev

# 別のターミナルで画像アップロードをテスト
curl -X POST http://localhost:8787/api/v1/image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "baseImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "prompt": "test image",
    "options": {
      "width": 1024,
      "height": 1024,
      "strength": 0.8,
      "steps": 20,
      "guidanceScale": 7.5,
      "outputFormat": "png"
    }
  }'
```

### リモート開発環境での確認

```bash
# リモート開発環境で実行
npm run dev:remote
```

## 5. トラブルシューティング

### エラー: "R2 credentials are not configured"

R2アクセスキーが正しく設定されていません。手順2を再確認してください。

### エラー: "R2 S3 API endpoint is not configured"

環境変数が正しく設定されていません。`wrangler.toml`を確認してください。

### エラー: "Failed to upload to R2: 403"

- APIトークンの権限を確認（Object Read & Write が必要）
- バケット名が正しいか確認
- トークンが指定されたバケットへのアクセス権を持っているか確認

## 6. セキュリティに関する注意事項

- **APIトークンは絶対に公開しない**
- `.env`ファイルには実際のトークンを記載しない
- Gitにコミットしない
- 本番環境では適切なTTLを設定することを推奨

## 7. パフォーマンス最適化

### キャッシュの活用

画像生成結果は24時間KVストレージにキャッシュされます。同じプロンプトでの再生成時は高速に応答します。

### エンドポイントの選択

- 開発環境: `prompt-builder-dev`バケットを使用
- 本番環境: `prompt-builder`バケットを使用

環境変数により自動的に切り替わります。

## 関連ドキュメント

- [Cloudflare R2ドキュメント](https://developers.cloudflare.com/r2/)
- [R2 S3互換API](https://developers.cloudflare.com/r2/api/s3/api/)
- [Wranglerシークレット管理](https://developers.cloudflare.com/workers/wrangler/commands/#secret)