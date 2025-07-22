# API仕様書

## 概要

Visual Prompt Builder API仕様書です。すべてのAPIはJSON形式でリクエスト/レスポンスを行います。

## ベースURL

- 開発環境: `http://localhost:8787`
- 本番環境: `https://api.visual-prompt-builder.workers.dev`

## 認証

現在のバージョンでは認証は実装されていません。将来のバージョンで追加予定です。

## 共通仕様

### リクエストヘッダー

```
Content-Type: application/json
Accept: application/json
```

### レスポンス形式

#### 成功時

```json
{
  "success": true,
  "data": {
    // エンドポイント固有のデータ
  },
  "timestamp": "2025-01-25T10:30:00.000Z"
}
```

#### エラー時

```json
{
  "success": false,
  "error": "エラーメッセージ",
  "timestamp": "2025-01-25T10:30:00.000Z"
}
```

### HTTPステータスコード

- `200 OK`: 成功
- `400 Bad Request`: リクエストパラメータエラー
- `404 Not Found`: リソースが見つからない
- `429 Too Many Requests`: レート制限
- `500 Internal Server Error`: サーバーエラー

## エンドポイント

### 1. ヘルスチェック

#### `GET /health`

サービスの稼働状況を確認します。

**レスポンス例:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "environment": "development"
  },
  "timestamp": "2025-01-25T10:30:00.000Z"
}
```

### 2. プロンプト生成

#### `POST /api/prompt/generate`

選択された要素からプロンプトを生成します。

**リクエストボディ:**

```json
{
  "category": {
    "predefinedId": "animal",
    "displayName": "動物"
  },
  "details": [
    {
      "predefinedId": "cat",
      "displayName": "猫",
      "order": 0
    },
    {
      "predefinedId": "custom-123456",
      "displayName": "ふわふわ",
      "order": 1
    }
  ],
  "colors": [
    {
      "predefinedId": "orange",
      "displayName": "オレンジ",
      "hex": "#FFA500"
    }
  ],
  "style": {
    "predefinedId": "realistic",
    "displayName": "リアル"
  },
  "mood": {
    "predefinedId": "peaceful",
    "displayName": "穏やか"
  },
  "lighting": {
    "predefinedId": "natural",
    "displayName": "自然光"
  },
  "size": {
    "predefinedId": "square",
    "displayName": "正方形",
    "aspectRatio": "1:1"
  },
  "options": {
    "language": "ja",
    "quality": "high",
    "includeNegativePrompt": true
  }
}
```

**パラメータ説明:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| category | object | ✓ | カテゴリ情報 |
| category.predefinedId | string | ✓ | 事前定義されたカテゴリID |
| category.displayName | string | ✓ | 表示名 |
| details | array | ✓ | 詳細情報の配列（最大5個） |
| details[].predefinedId | string | ✓ | 詳細ID（カスタムの場合は"custom-"プレフィックス） |
| details[].displayName | string | ✓ | 表示名 |
| details[].order | number | ✓ | 並び順（0から） |
| colors | array | × | 色情報の配列 |
| style | object | × | スタイル情報 |
| mood | object | × | 雰囲気情報 |
| lighting | object | × | 照明情報 |
| size | object | × | サイズ情報 |
| options | object | × | 生成オプション |
| options.language | string | × | 言語（"ja" または "en"、デフォルト: "ja"） |
| options.quality | string | × | 品質（"low", "medium", "high"、デフォルト: "high"） |
| options.includeNegativePrompt | boolean | × | ネガティブプロンプトを含むか（デフォルト: true） |

**レスポンス例:**

```json
{
  "success": true,
  "data": {
    "prompt": "realistic cat, fluffy, orange color, peaceful atmosphere, natural lighting, high quality, detailed, professional",
    "promptJa": "リアルな猫、ふわふわ、オレンジ色、穏やかな雰囲気、自然光、高品質、詳細な描写、プロフェッショナル",
    "negativePrompt": "low quality, blurry, distorted, amateur, bad anatomy, worst quality",
    "usedKeywords": [
      "realistic cat",
      "fluffy",
      "orange color",
      "peaceful atmosphere",
      "natural lighting",
      "high quality",
      "detailed",
      "professional"
    ],
    "generationTime": 150
  },
  "timestamp": "2025-01-25T10:30:00.000Z"
}
```

**レート制限:**
- 20リクエスト/分

### 3. プロンプトテンプレート一覧

#### `GET /api/prompt/templates`

事前定義されたプロンプトテンプレートの一覧を取得します。

**レスポンス例:**

```json
{
  "success": true,
  "data": {
    "templates": []
  },
  "timestamp": "2025-01-25T10:30:00.000Z"
}
```

*注: 現在未実装のため空配列を返します*

### 4. 翻訳

#### `POST /api/translate`

テキストを翻訳します。

**リクエストボディ:**

```json
{
  "text": "猫",
  "from": "ja",
  "to": "en"
}
```

**レスポンス例:**

```json
{
  "success": true,
  "data": {
    "translatedText": "cat",
    "from": "ja",
    "to": "en"
  },
  "timestamp": "2025-01-25T10:30:00.000Z"
}
```

### 5. 画像生成

#### `POST /api/v1/image/generate`

プロンプトとベース画像からAI画像を生成します。

**リクエストボディ:**

```json
{
  "prompt": "A cute orange cat sitting in natural light",
  "baseImage": "data:image/png;base64,...",
  "model": "flux-fill",
  "options": {
    "steps": 20,
    "guidanceScale": 7.5,
    "strength": 0.8,
    "outputFormat": "png"
  }
}
```

**パラメータ説明:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| prompt | string | ✓ | 生成用プロンプト（英語） |
| baseImage | string | ✓ | ベース画像（data URL形式） |
| model | string | × | 使用するモデル（デフォルト: "flux-fill"） |
| options | object | × | 生成オプション |
| options.steps | number | × | 推論ステップ数（20-50、デフォルト: 20） |
| options.guidanceScale | number | × | ガイダンススケール（1-20、デフォルト: 7.5） |
| options.strength | number | × | 変換強度（0-1、デフォルト: 0.8） |
| options.outputFormat | string | × | 出力形式（"png" または "jpg"、デフォルト: "png"） |

**対応モデル:**
- `flux-fill`: FLUX Fill（インペインティング）
- `flux-variations`: FLUX Variations（バリエーション生成）
- `flux-canny`: FLUX Canny（エッジ検出ベース）
- `sdxl-img2img`: SDXL Image-to-Image

**レスポンス例（成功時）:**

```json
{
  "success": true,
  "data": {
    "image": "data:image/png;base64,...",
    "generationTime": 8523,
    "model": "flux-fill",
    "cost": {
      "amount": 0.005,
      "currency": "USD"
    }
  },
  "timestamp": "2025-01-25T10:30:00.000Z"
}
```

**レスポンス例（エラー時）:**

```json
{
  "success": false,
  "error": "画像生成に失敗しました",
  "details": "Image storage is not properly configured",
  "timestamp": "2025-01-25T10:30:00.000Z"
}
```

**レート制限:**
- 10リクエスト/分
- 最大画像サイズ: 10MB

**注意事項:**
- APIキーが設定されている必要があります
- Cloudflare R2が正しく設定されている必要があります
- 生成には数秒から数十秒かかることがあります

## エラーレスポンス

### バリデーションエラー

```json
{
  "success": false,
  "error": "Invalid request parameters",
  "details": {
    "category": "Required field",
    "details": "Must have at least 1 item"
  },
  "timestamp": "2025-01-25T10:30:00.000Z"
}
```

### レート制限エラー

```json
{
  "success": false,
  "error": "APIレート制限に達しました。しばらくしてから再度お試しください。",
  "retryAfter": 60,
  "timestamp": "2025-01-25T10:30:00.000Z"
}
```

**レスポンスヘッダー:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-01-25T10:31:00.000Z
Retry-After: 60
```

## セキュリティ

### CORS設定

以下のオリジンからのリクエストのみ許可されます：

- `http://localhost:5173`
- `http://localhost:3000`
- `https://visual-prompt-builder.pages.dev`

### セキュリティヘッダー

すべてのレスポンスに以下のヘッダーが含まれます：

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## 今後の予定

- 認証機能の追加
- WebSocket APIの追加
- プロンプト履歴API
- ユーザー設定API
- 複数画像のバッチ生成
- 生成履歴の保存機能