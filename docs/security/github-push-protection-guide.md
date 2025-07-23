# GitHub Push Protection 対策ガイド

## 概要

GitHub Push
Protectionは、コミットに含まれるシークレット（APIキー、パスワードなど）を検出し、誤ってパブリックリポジトリに公開されることを防ぐセキュリティ機能です。

## 今回検出された問題

- **検出内容**: Replicate APIトークン
- **検出場所**: `workers/docs/R2_ACCESS_KEY_SETUP.md:47`
- **原因**: ドキュメント内のサンプルコードに実際のAPIキーが含まれていた

## 推奨される対策

### 1. プレースホルダーの使用ルール

#### ❌ 避けるべき例

```bash
# 実際のAPIキーを含む例（絶対に使用しないこと）
IMAGE_API_KEY=rk_AbCdEfGhIjKlMnOpQrStUvWxYz1234567890ABCD
```

#### ✅ 推奨される例

```bash
# 明確なプレースホルダーを使用
IMAGE_API_KEY=<your-replicate-api-key>
IMAGE_API_KEY=your-replicate-api-key-here
IMAGE_API_KEY=REPLACE_WITH_YOUR_API_KEY
```

### 2. シークレット管理のベストプラクティス

#### 環境変数テンプレートファイル

1. **`.env.example`** または **`.dev.vars.example`** を作成

   ```bash
   # .dev.vars.example
   IMAGE_API_KEY=your-replicate-api-key
   R2_ACCESS_KEY_ID=your-r2-access-key-id
   R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
   ```

2. **実際の設定ファイルは`.gitignore`に追加**

   ```gitignore
   # 環境変数ファイル
   .env
   .env.local
   .dev.vars
   *.secrets
   ```

3. **READMEでの説明**

   ```markdown
   ## セットアップ

   1. `.dev.vars.example`を`.dev.vars`にコピー
   2. プレースホルダーを実際の値に置き換え
   ```

### 3. pre-commitフックの活用

#### git-secretsの導入

```bash
# インストール
brew install git-secrets  # macOS
# または
git clone https://github.com/awslabs/git-secrets
cd git-secrets && make install

# リポジトリで有効化
git secrets --install
git secrets --register-aws  # AWS関連のパターンを追加

# カスタムパターンの追加
git secrets --add 'r8_[a-zA-Z0-9]{40}'  # Replicate APIキー
git secrets --add '[a-f0-9]{32}'         # 一般的なAPIキー形式
```

#### .gitleaksignoreファイル

```toml
# .gitleaksignore
# 誤検出を防ぐための除外設定
[allow]
paths = [
  "docs/examples/*",
  "*.example",
  "*.sample"
]
```

### 4. CI/CDでのシークレットスキャン

#### GitHub Actions設定

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Run TruffleHog
        uses: trufflesecurity/trufflehog@main
        with:
          extra_args: --only-verified
```

### 5. ドキュメント作成時のチェックリスト

- [ ] APIキーやトークンは全てプレースホルダーに置き換えた
- [ ] サンプルコードに実際の認証情報が含まれていない
- [ ] URLやエンドポイントも必要に応じて汎用化した
- [ ] 個人情報や組織固有の情報が含まれていない

### 6. 既存コードのスキャン

```bash
# リポジトリ全体をスキャン
git secrets --scan

# 特定のファイルをスキャン
git secrets --scan-history

# Gitleaksでのスキャン
gitleaks detect --source . -v
```

### 7. 開発者向けガイドライン

#### コミット前の確認事項

1. **`git diff`で変更内容を確認**

   ```bash
   git diff --staged | grep -E "(api|key|token|secret|password)"
   ```

2. **センシティブな情報のパターン**
   - APIキー: `api_key`, `apiKey`, `API_KEY`
   - トークン: `token`, `auth_token`, `access_token`
   - パスワード: `password`, `pwd`, `pass`
   - シークレット: `secret`, `private_key`

3. **疑わしい文字列パターン**
   - 40文字以上の英数字の羅列
   - Base64エンコードされた長い文字列
   - `-----BEGIN`で始まる秘密鍵

### 8. 緊急時の対応

#### シークレットが公開された場合

1. **即座に無効化**
   - 該当するAPIキーやトークンを即座に無効化
   - 新しいキーを生成

2. **履歴からの削除**

   ```bash
   # BFG Repo-Cleanerを使用
   bfg --delete-files FILE_WITH_SECRET
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

3. **通知と記録**
   - セキュリティチームに通知
   - インシデントレポートの作成
   - 影響範囲の評価

### 9. 推奨ツール

1. **スキャンツール**
   - [Gitleaks](https://github.com/gitleaks/gitleaks)
   - [TruffleHog](https://github.com/trufflesecurity/trufflehog)
   - [git-secrets](https://github.com/awslabs/git-secrets)

2. **IDE拡張**
   - VS Code: GitLens, Git History
   - IntelliJ: Git Secrets Plugin

3. **CI/CDツール**
   - GitHub Secret Scanning
   - GitLab Secret Detection
   - Snyk

### 10. 定期的なセキュリティレビュー

- 月次でリポジトリ全体のシークレットスキャン
- 四半期ごとにアクセスキーのローテーション
- 年次でセキュリティポリシーの見直し

## まとめ

GitHub Push
Protectionは最後の防衛線です。開発プロセスの早い段階でシークレットの混入を防ぐことが重要です。このガイドラインに従って、安全な開発環境を維持しましょう。
