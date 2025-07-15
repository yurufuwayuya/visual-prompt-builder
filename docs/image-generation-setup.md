# 画像生成機能のセットアップガイド

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

### 2. 環境変数の設定

#### 開発環境（ローカル）

`.env`ファイルを作成し、以下を設定：

```bash
# .env
REPLICATE_API_KEY=r8_your_actual_api_key_here
IMAGE_PROVIDER=replicate
```

**重要**: 開発環境では `REPLICATE_API_KEY` を使用しますが、Workers環境では
`IMAGE_API_KEY` として参照されます。この変換は自動的に行われます。

#### 本番環境（Cloudflare Workers）

Wrangler CLIを使用してシークレットを設定：

```bash
# 重要: 本番環境では IMAGE_API_KEY として設定
wrangler secret put IMAGE_API_KEY --env production

# プロンプトが表示されたら、Replicate APIキーを入力
```

**注意**: 本番環境では `IMAGE_API_KEY`
という名前で設定する必要があります。これは複数のプロバイダー（Replicate、OpenAI、Stability
AI）に対応するための設計です。

### 3. 動作確認

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

2. **「画像生成に失敗しました」エラー**
   - APIキーが有効か確認
   - Replicateのクレジットが残っているか確認
   - ネットワーク接続を確認

3. **「タイムアウト」エラー**
   - 画像サイズが大きすぎる可能性
   - ネットワークが遅い可能性

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

## 今後の機能追加予定

- [ ] OpenAI DALL-E統合
- [ ] Stability AI統合
- [ ] バッチ処理機能
- [ ] 生成履歴の保存
- [ ] カスタムモデルの追加
