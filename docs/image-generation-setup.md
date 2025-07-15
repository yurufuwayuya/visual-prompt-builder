# 画像生成機能のセットアップガイド

## 更新履歴

- 2025-07-15: Cloudflare R2統合を追加（Replicate APIのdata URL制限対応）

## 概要

Visual Prompt
Builderの画像生成（Image-to-Image）機能を使用するための環境設定ガイドです。

## 対応プロバイダー

現在、以下の画像生成AIサービスに対応しています：

1. **Replicate** (推奨)
   - コスト効率的な従量課金制
   - 多様なモデルから選択可能
   - FLUXモデル対応

2. **OpenAI DALL-E** (実装予定)
   - 高品質な画像生成
   - シンプルなAPI

3. **Stability AI** (実装予定)
   - Stable Diffusionモデル
   - 商用利用可能

## セットアップ手順

### 1. Replicate APIキーの取得

1. [Replicate](https://replicate.com/)にアクセス
2. アカウントを作成またはログイン
3. [Account Settings](https://replicate.com/account)ページへ移動
4. APIトークンをコピー

### 2. Cloudflare R2の設定

Replicate APIはHTTP(S) URLのみを受け付けるため、Cloudflare
R2を使用して一時的な画像ストレージを構築します。

#### R2バケットの作成

1. Cloudflareダッシュボードにログイン
2. 「R2」セクションに移動
3. 「Create bucket」をクリック
4. バケット名を設定：
   - 開発環境: `visual-prompt-builder-images-dev`
   - ステージング環境: `visual-prompt-builder-images-staging`
   - 本番環境: `visual-prompt-builder-images`

#### R2カスタムドメインの設定

1. R2バケットの設定画面で「Settings」タブを選択
2. 「Public access」セクションで「Allow public access」を有効化
3. 「Custom domains」セクションで「Connect domain」をクリック
4. サブドメインを設定（例: `images.yourdomain.com`）

### 3. 環境変数の設定

#### 開発環境（ローカル）

`.env`ファイルを作成し、以下を設定：

```bash
# .env
REPLICATE_API_KEY=<YOUR_REPLICATE_API_KEY>
IMAGE_PROVIDER=replicate
R2_CUSTOM_DOMAIN=https://images.yourdomain.com
```

**重要**: 開発環境では `REPLICATE_API_KEY` を使用しますが、Workers環境では
`IMAGE_API_KEY` として参照されます。この変換は自動的に行われます。

#### 本番環境（Cloudflare Workers）

Wrangler CLIを使用してシークレットを設定：

```bash
# 重要: 本番環境では IMAGE_API_KEY として設定
wrangler secret put IMAGE_API_KEY --env production

# R2カスタムドメインを環境変数として設定
wrangler secret put R2_CUSTOM_DOMAIN --env production

# プロンプトが表示されたら、それぞれの値を入力
```

**注意**:

- 本番環境では `IMAGE_API_KEY` という名前で設定する必要があります
- R2_CUSTOM_DOMAIN は必須です（R2バケットへのアクセスに使用）

### 4. 動作確認

1. 開発サーバーを起動：

   ```bash
   npm run dev:all
   ```

2. ブラウザで [http://localhost:5173](http://localhost:5173) にアクセス

3. 画像生成機能をテスト：
   - ステップ1-3でプロンプトを作成
   - ステップ4で画像をアップロード
   - AI画像生成セクションで「画像を生成」をクリック

## トラブルシューティング

### よくあるエラー

1. **「APIキーが設定されていません」エラー**
   - 環境変数が正しく設定されているか確認
   - サーバーを再起動してみる

2. **「R2 configuration missing」エラー**
   - R2_CUSTOM_DOMAIN環境変数が設定されているか確認
   - R2バケットが正しく作成されているか確認
   - カスタムドメインが正しく設定されているか確認

3. **「画像生成に失敗しました」エラー**
   - APIキーが有効か確認
   - Replicateのクレジットが残っているか確認
   - R2バケットへのアクセスが可能か確認
   - ネットワーク接続を確認

4. **「タイムアウト」エラー**
   - 画像サイズが大きすぎる可能性
   - ネットワークが遅い可能性
   - R2へのアップロードが遅い可能性

### デバッグ方法

1. ブラウザのデベロッパーツールでコンソールを確認
2. Networkタブで失敗したリクエストの詳細を確認
3. Workers Logsで詳細なエラーを確認：
   ```bash
   wrangler tail
   ```

## 料金について

### Replicate

- 従量課金制
- FLUX系モデル: 約$0.003〜$0.011/回
- 詳細は[Replicateの料金ページ](https://replicate.com/pricing)参照

## セキュリティ注意事項

1. APIキーを絶対にコミットしない
2. `.env`ファイルは`.gitignore`に含まれていることを確認
3. 本番環境では必ずWrangler secretsを使用する
4. APIキーは定期的に更新する

## 画像生成モデルの選択

現在、以下の3つのモデルが利用可能：

1. **FLUX Variations**
   - 入力画像のバリエーションを生成
   - 元の画像の特徴を保持

2. **FLUX Fill**
   - 画像の一部を変更・補完
   - インペインティング向け

3. **FLUX Canny**
   - エッジ検出を使用した生成
   - 構造を保持しながら変換

## 技術的な詳細

### なぜCloudflare R2が必要か

Replicate APIは画像入力としてHTTP(S) URLのみを受け付けます。data
URL（Base64エンコードされた画像データ）は受け付けられません。そのため：

1. フロントエンドから送信されたdata URLをWorkers側で受信
2. R2バケットに一時的にアップロード
3. R2のカスタムドメイン経由でHTTP URLを生成
4. そのURLをReplicate APIに送信
5. 処理完了後、一時画像を削除

この流れにより、ブラウザから直接画像をアップロードしてAI処理することが可能になります。

### セキュリティ考慮事項

- R2バケットは公開アクセスを許可する必要がありますが、一時的な画像のみを保存
- 画像は処理完了後即座に削除され、24時間後には自動削除される
- URLは推測困難なランダムな名前を使用

## 今後の機能追加予定

- [ ] OpenAI DALL-E統合
- [ ] Stability AI統合
- [ ] バッチ処理機能
- [ ] 生成履歴の保存
- [ ] カスタムモデルの追加
- [x] Cloudflare R2を使用した画像アップロード（2025-07-15実装）
