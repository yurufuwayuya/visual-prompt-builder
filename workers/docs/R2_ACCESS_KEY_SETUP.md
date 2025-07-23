# R2アクセスキーの設定方法

## 概要

Cloudflare
R2のS3互換APIを使用するには、アクセスキーの設定が必要です。このドキュメントでは、R2アクセスキーの作成から設定までの手順を説明します。

## 1. Cloudflare R2アクセスキーの作成

### 手順

1. **Cloudflareダッシュボードにログイン**
   - https://dash.cloudflare.com/ にアクセス
   - アカウントにログイン

2. **R2セクションに移動**
   - 左側のメニューから「R2」をクリック
   - 対象のアカウントを選択

3. **R2 API tokensページへ**
   - R2ダッシュボードで「Manage R2 API Tokens」をクリック
   - または直接
     https://dash.cloudflare.com/<account-id>/r2/api-tokens にアクセス

4. **新しいAPIトークンを作成**
   - 「Create API token」ボタンをクリック
   - トークン名を入力（例：`visual-prompt-builder-dev`）
   - 権限を設定：
     - **Object Read & Write**: 画像のアップロード・ダウンロードに必要
     - **特定のバケットのみ**:
       `prompt-builder-dev`（開発用）と`prompt-builder`（本番用）
   - TTL（有効期限）を設定（推奨：無期限または長期間）

5. **トークンの保存**
   - 「Create API Token」をクリック
   - 表示される以下の情報を安全な場所にコピー：
     - **Access Key ID**: `<表示されるアクセスキーID>`
     - **Secret Access Key**: `<表示されるシークレットキー>`
   - ⚠️ **重要**: シークレットキーは一度しか表示されません！

## 2. 開発環境での設定

### .dev.varsファイルの設定

```bash
# workers/.dev.vars
IMAGE_API_KEY=<your-replicate-api-key>
R2_CUSTOM_DOMAIN=https://image-dev.kantanprompt.com
R2_ACCESS_KEY_ID=<Cloudflareで取得したAccess Key ID>
R2_SECRET_ACCESS_KEY=<Cloudflareで取得したSecret Access Key>
```

### 設定の確認

```bash
# ディレクトリ移動
cd workers

# 開発サーバーを起動
npm run dev

# 別のターミナルでテスト
npm run test:r2
```

## 3. 本番環境での設定

### Wrangler Secretsを使用

```bash
# R2アクセスキーID
npx wrangler secret put R2_ACCESS_KEY_ID
# プロンプトが表示されたら、Cloudflareで取得したAccess Key IDを入力

# R2シークレットアクセスキー
npx wrangler secret put R2_SECRET_ACCESS_KEY
# プロンプトが表示されたら、Cloudflareで取得したSecret Access Keyを入力

# 本番環境用（--env productionフラグを追加）
npx wrangler secret put R2_ACCESS_KEY_ID --env production
npx wrangler secret put R2_SECRET_ACCESS_KEY --env production
```

### GitHub Actionsでの設定

GitHubリポジトリの設定で、以下のSecretsを追加：

1. リポジトリの「Settings」→「Secrets and variables」→「Actions」
2. 「New repository secret」をクリック
3. 以下のシークレットを追加：
   - `R2_ACCESS_KEY_ID`: Cloudflareで取得したAccess Key ID
   - `R2_SECRET_ACCESS_KEY`: Cloudflareで取得したSecret Access Key

## 4. セキュリティのベストプラクティス

### ⚠️ 重要な注意事項

1. **シークレットをコミットしない**
   - `.dev.vars`ファイルは`.gitignore`に含まれていることを確認
   - 実際のキーをコードに直接書かない

2. **最小権限の原則**
   - 必要最小限のバケットにのみアクセス権を付与
   - 開発と本番で別のAPIトークンを使用

3. **定期的なキーローテーション**
   - 3-6ヶ月ごとにキーを更新
   - 古いキーは速やかに無効化

4. **アクセスログの監視**
   - Cloudflareダッシュボードで定期的にアクセスログを確認
   - 不審なアクセスがないかチェック

## 5. トラブルシューティング

### よくある問題と解決方法

#### 1. "Invalid credentials"エラー

```
原因: アクセスキーが正しく設定されていない
解決方法:
- キーに余分な空白が含まれていないか確認
- .dev.varsファイルの構文を確認（引用符は不要）
- wrangler secret listで設定されているか確認
```

#### 2. "Access Denied"エラー

```
原因: APIトークンの権限不足
解決方法:
- R2 APIトークンの権限設定を確認
- Object Read & Write権限があるか確認
- 対象バケットへのアクセス権があるか確認
```

#### 3. 開発環境で動作しない

```
原因: .dev.varsファイルが読み込まれていない
解決方法:
- workersディレクトリ内で実行しているか確認
- npm run devを再起動
- wrangler.tomlで環境変数が正しく設定されているか確認
```

## 6. 設定確認スクリプト

以下のスクリプトで設定を確認できます：

```bash
# workers/scripts/check-r2-config.sh
#!/bin/bash

echo "Checking R2 configuration..."

# Check if .dev.vars exists
if [ -f ".dev.vars" ]; then
    echo "✓ .dev.vars file found"

    # Check if R2 keys are set (without showing actual values)
    if grep -q "R2_ACCESS_KEY_ID=" .dev.vars && grep -q "R2_SECRET_ACCESS_KEY=" .dev.vars; then
        echo "✓ R2 access keys are set in .dev.vars"
    else
        echo "✗ R2 access keys are missing in .dev.vars"
    fi
else
    echo "✗ .dev.vars file not found"
fi

# Check wrangler secrets
echo ""
echo "Checking wrangler secrets..."
npx wrangler secret list

echo ""
echo "Configuration check complete!"
```

## まとめ

R2アクセスキーの設定は以下の流れで行います：

1. CloudflareダッシュボードでR2 APIトークンを作成
2. 開発環境では`.dev.vars`に設定
3. 本番環境では`wrangler secret`で設定
4. セキュリティのベストプラクティスに従う

設定後は必ずテストを実行して、正しく動作することを確認してください。
