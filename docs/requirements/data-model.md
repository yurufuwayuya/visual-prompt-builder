# データモデル仕様書

## 1. データモデル概要

本システムでは、利用者のプライバシー保護を最優先とし、個人情報の収集を最小限に抑えた設計を採用しています。主要なデータはブラウザのローカルストレージに保存され、サーバー側では最小限の集計データのみを管理します。

## 2. データ構造

### 2.1 プロンプトデータ（PromptData）

```typescript
interface PromptData {
  id: string;                    // UUID v4
  createdAt: string;             // ISO 8601形式
  updatedAt: string;             // ISO 8601形式
  
  // 選択内容
  selections: {
    category: CategorySelection;
    details: DetailSelection[];
    color: ColorSelection;
    style: StyleSelection;
    mood: MoodSelection;
    lighting: LightingSelection;
    size: SizeSelection;
  };
  
  // 生成結果
  result: {
    positivePrompt: string;      // 生成された英語プロンプト
    negativePrompt: string;      // ネガティブプロンプト
    translatedTexts: {           // 翻訳結果のキャッシュ
      [key: string]: string;
    };
  };
  
  // メタデータ
  metadata: {
    isFavorite: boolean;         // お気に入りフラグ
    usageCount: number;          // 使用回数
    lastUsedAt: string | null;   // 最終使用日時
  };
}
```

### 2.2 カテゴリ選択（CategorySelection）

```typescript
interface CategorySelection {
  predefinedId: string | null;   // 事前定義カテゴリID
  customText: string | null;      // 自由記述テキスト
  displayName: string;            // 表示名
}
```

### 2.3 詳細選択（DetailSelection）

```typescript
interface DetailSelection {
  predefinedId: string | null;   // 事前定義詳細ID
  customText: string | null;      // 自由記述テキスト
  displayName: string;            // 表示名
  order: number;                  // 選択順序（0から開始）
}
```

### 2.4 その他の選択データ

```typescript
// 色選択
interface ColorSelection {
  predefinedId: string | null;
  customText: string | null;
  displayName: string;
  colorSample?: string;           // HEXカラーコード
}

// スタイル選択
interface StyleSelection {
  predefinedId: string | null;
  customText: string | null;
  displayName: string;
}

// 雰囲気選択
interface MoodSelection {
  predefinedId: string | null;
  customText: string | null;
  displayName: string;
}

// 照明選択
interface LightingSelection {
  predefinedId: string | null;
  customText: string | null;
  displayName: string;
}

// サイズ選択
interface SizeSelection {
  predefinedId: string;           // 必須（カスタム不可）
  displayName: string;
  aspectRatio: string;            // "1:1", "16:9" など
  recommendedPieces?: number;     // 推奨パズルピース数
}
```

## 3. マスターデータ

### 3.1 カテゴリマスター

```typescript
interface CategoryMaster {
  categories: {
    id: string;
    name: string;
    nameEn: string;              // 英語名（プロンプト用）
    icon: string;                // アイコンクラス名
    order: number;               // 表示順
    isActive: boolean;           // 有効/無効フラグ
  }[];
}
```

### 3.2 カテゴリ別詳細マスター

```typescript
interface DetailsMaster {
  [categoryId: string]: {
    details: {
      id: string;
      name: string;
      nameEn: string;
      order: number;
      isActive: boolean;
    }[];
  };
}
```

### 3.3 その他のマスターデータ

```typescript
// 色マスター
interface ColorMaster {
  colors: {
    id: string;
    name: string;
    nameEn: string;
    sample: string;              // HEXカラーコード
    order: number;
    isActive: boolean;
  }[];
}

// スタイルマスター
interface StyleMaster {
  styles: {
    id: string;
    name: string;
    nameEn: string;
    description?: string;
    order: number;
    isActive: boolean;
  }[];
}

// 以下、同様の構造で mood, lighting, size のマスターデータを定義
```

## 4. ローカルストレージ構造

### 4.1 保存キー一覧

| キー | 内容 | 形式 | 最大サイズ |
|------|------|------|-----------|
| `vpb_prompt_history` | プロンプト履歴 | JSON配列 | 100件 |
| `vpb_favorites` | お気に入り | JSON配列 | 50件 |
| `vpb_current_work` | 作業中データ | JSONオブジェクト | 1件 |
| `vpb_settings` | ユーザー設定 | JSONオブジェクト | - |
| `vpb_templates` | テンプレート | JSON配列 | 20件 |

### 4.2 データ保存例

```javascript
// プロンプト履歴の保存例
localStorage.setItem('vpb_prompt_history', JSON.stringify([
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    createdAt: "2025-06-24T10:30:00.000Z",
    updatedAt: "2025-06-24T10:30:00.000Z",
    selections: {
      category: {
        predefinedId: "animal",
        customText: null,
        displayName: "動物"
      },
      details: [
        {
          predefinedId: "cat",
          customText: null,
          displayName: "猫",
          order: 0
        }
      ],
      // ... 他の選択データ
    },
    result: {
      positivePrompt: "a cute cat, pastel colors...",
      negativePrompt: "worst quality, low quality...",
      translatedTexts: {
        "category_animal": "animal",
        "detail_cat": "cat"
      }
    },
    metadata: {
      isFavorite: false,
      usageCount: 1,
      lastUsedAt: "2025-06-24T10:30:00.000Z"
    }
  }
  // ... 他の履歴データ
]));
```

## 5. API通信データ

### 5.1 翻訳APIリクエスト

```typescript
interface TranslationRequest {
  texts: string[];               // 翻訳対象テキスト配列
  sourceLang: "ja";              // ソース言語（日本語固定）
  targetLang: "en";              // ターゲット言語（英語固定）
  context?: string;              // 文脈情報（オプション）
}
```

### 5.2 翻訳APIレスポンス

```typescript
interface TranslationResponse {
  translations: {
    original: string;            // 元のテキスト
    translated: string;          // 翻訳結果
    confidence?: number;         // 信頼度（0-1）
  }[];
  status: "success" | "partial" | "error";
  errors?: {
    text: string;
    reason: string;
  }[];
}
```

## 6. セッションデータ

### 6.1 一時保存データ

```typescript
interface SessionData {
  sessionId: string;             // セッションID
  startedAt: string;             // セッション開始時刻
  currentStep: number;           // 現在のステップ（1-7）
  temporarySelections: {         // 一時的な選択状態
    [key: string]: any;
  };
  validationErrors: {            // バリデーションエラー
    [key: string]: string[];
  };
}
```

## 7. 集計データ（サーバー側）

### 7.1 利用統計データ

```typescript
interface UsageStatistics {
  date: string;                  // 日付（YYYY-MM-DD）
  metrics: {
    totalPrompts: number;        // 生成されたプロンプト総数
    uniqueSessions: number;      // ユニークセッション数
    categoryUsage: {             // カテゴリ別利用数
      [categoryId: string]: number;
    };
    styleUsage: {                // スタイル別利用数
      [styleId: string]: number;
    };
    errorCount: number;          // エラー発生数
    averageSteps: number;        // 平均ステップ数
  };
}
```

### 7.2 エラーログ

```typescript
interface ErrorLog {
  id: string;
  timestamp: string;
  errorType: "translation" | "validation" | "system";
  message: string;
  context?: {
    step?: number;
    selection?: string;
    userAgent?: string;
  };
  resolved: boolean;
}
```

## 8. データ管理ポリシー

### 8.1 データ保持期間

| データ種別 | 保持期間 | 削除タイミング |
|-----------|---------|--------------|
| プロンプト履歴 | 90日 | 自動削除または手動削除 |
| お気に入り | 無期限 | 手動削除のみ |
| 作業中データ | 7日 | 自動削除 |
| セッションデータ | 24時間 | セッション終了時 |
| 集計データ | 1年 | 自動アーカイブ |

### 8.2 プライバシー保護

- 個人を特定できる情報は収集しない
- IPアドレスは集計時にハッシュ化
- 作成されたプロンプト内容は集計対象外
- クッキーは最小限の使用（セッション管理のみ）

### 8.3 データエクスポート/インポート

```typescript
// エクスポート形式
interface ExportData {
  version: string;               // データ形式バージョン
  exportedAt: string;            // エクスポート日時
  data: {
    history: PromptData[];
    favorites: PromptData[];
    templates: TemplateData[];
    settings: UserSettings;
  };
}
```

## 9. バリデーションルール

### 9.1 入力値検証

| フィールド | 最大文字数 | 許可文字 | 必須 |
|-----------|-----------|---------|------|
| カスタムカテゴリ | 50 | 日本語、英数字、記号 | No |
| カスタム詳細 | 100 | 日本語、英数字、記号 | No |
| カスタム色 | 50 | 日本語、英数字、記号 | No |
| カスタムスタイル | 50 | 日本語、英数字、記号 | No |
| カスタム雰囲気 | 50 | 日本語、英数字、記号 | No |
| カスタム照明 | 50 | 日本語、英数字、記号 | No |

### 9.2 セキュリティ対策

- XSS対策：全ての入力値をサニタイズ
- SQLインジェクション対策：パラメータ化クエリ使用
- CSRF対策：トークン検証
- 入力値の長さ制限とバリデーション