# Visual Prompt Builder 技術仕様書

## 1. システムアーキテクチャ

### 1.1 全体構成
```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   React     │  │   Zustand   │  │   Router    │ │
│  │ Components  │  │    Store    │  │   (v6)      │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────┬───────────────────────────┘
                         │ HTTPS
┌─────────────────────────┴───────────────────────────┐
│              Cloudflare Workers (Edge)               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │     API     │  │    Cache    │  │   Security  │ │
│  │   Handler   │  │   Manager   │  │ Middleware  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 1.2 Monorepo構造
```
visual-prompt-builder/
├── frontend/          # Reactアプリケーション
├── workers/           # Cloudflare Workers API
├── shared/            # 共通型定義・定数
└── docs/             # ドキュメント
```

**⚠️ 重要: 各ディレクトリでnpm install必須！**

### 1.3 技術スタック

#### フロントエンド
- React 18.2+ (関数コンポーネントのみ)
- TypeScript 5.3+ (strictモード必須)
- Vite 5.0+ (高速ビルド)
- Zustand 4.4+ (状態管理)
- React Router 6.20+ (ルーティング)
- Tailwind CSS 3.3+ (スタイリング)

#### バックエンド
- Cloudflare Workers
- Hono 3.0+ (軽量Webフレームワーク)
- Zod 3.22+ (バリデーション)

#### 開発ツール
- Jest 29.7+ & React Testing Library
- ESLint & Prettier
- npm (yarn/pnpm不可)

## 2. API仕様

### 2.1 エンドポイント

#### ベースURL
- Production: `https://api.visual-prompt-builder.com`
- Development: `http://localhost:8787`

#### テンプレート一覧取得
```http
GET /api/v1/templates?category={categoryId}&search={keyword}&limit={number}&offset={number}
```

**レスポンス例**:
```json
{
  "success": true,
  "data": {
    "templates": [{
      "id": "template_001",
      "name": "基本的な画像説明",
      "nameEn": "Basic Image Description",
      "category": "image-analysis",
      "tags": ["beginner", "image"],
      "usageCount": 150
    }],
    "total": 45,
    "hasMore": true
  }
}
```

#### プロンプト生成
```http
POST /api/v1/prompts/generate
Content-Type: application/json

{
  "templateId": "template_001",
  "parameters": {
    "imageUrl": "data:image/png;base64,...",
    "style": "detailed"
  }
}
```

### 2.2 エラーハンドリング

**統一エラーレスポンス形式**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "カテゴリーIDが無効です",
    "details": { "field": "category" },
    "traceId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**エラーコード一覧**:
- `INVALID_PARAMETER`: パラメータ不正
- `MISSING_REQUIRED_FIELD`: 必須項目不足
- `FILE_TOO_LARGE`: ファイルサイズ超過（5MB）
- `RATE_LIMIT_EXCEEDED`: レート制限
- `INTERNAL_ERROR`: サーバーエラー

## 3. データモデル

### 3.1 型定義規則
**重要**: name/nameEn パターンを厳守（displayName等の混在禁止）

```typescript
// shared/types/template.ts
export interface Template {
  id: string;
  name: string;        // 日本語名（必須）
  nameEn: string;      // 英語名（必須）
  description: string;
  descriptionEn: string;
  category: CategoryId; // predefinedId使用
  parameters: TemplateParameter[];
  createdAt: string;   // ISO 8601
  updatedAt: string;
}

// shared/constants/categories.ts
export const CATEGORIES = [
  {
    predefinedId: 'image-analysis',
    name: '画像解析',
    nameEn: 'Image Analysis',
    icon: 'Image',
    order: 1
  }
] as const;

export type CategoryId = typeof CATEGORIES[number]['predefinedId'];
```

### 3.2 バリデーション
```typescript
import { z } from 'zod';

export const templateSchema = z.object({
  name: z.string().min(1, '必須項目です'),
  nameEn: z.string().min(1, 'Required field'),
  category: z.enum(['image-analysis', 'creative-writing']),
  parameters: z.array(parameterSchema)
});
```

## 4. UI/UX実装仕様

### 4.1 アクセシビリティ要件
- **最小タッチターゲット**: 44px × 44px
- **フォーカス表示**: 明確なアウトライン
- **キーボード操作**: Tab順序の論理的配置
- **ARIA属性**: 適切なラベル付け

```typescript
// 良い例: アクセシブルなボタン
<button
  onClick={handleClick}
  aria-label="テンプレートを削除"
  className="min-h-[44px] min-w-[44px] p-3"
>
  <TrashIcon />
</button>
```

### 4.2 多言語対応
```typescript
// contexts/LanguageContext.tsx
const LanguageContext = createContext<{
  language: 'ja' | 'en';
  setLanguage: (lang: 'ja' | 'en') => void;
  t: (key: string) => string;
}>({
  language: 'ja', // 日本語デフォルト必須
  setLanguage: () => {},
  t: () => ''
});
```

### 4.3 レスポンシブデザイン
```typescript
// Tailwind CSS ブレークポイント
// sm: 640px, md: 768px, lg: 1024px, xl: 1280px

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* カード要素 */}
</div>
```

## 5. 状態管理（Zustand）

```typescript
// stores/templateStore.ts
interface TemplateStore {
  templates: Template[];
  loading: boolean;
  error: string | null;
  
  // アクション
  fetchTemplates: () => Promise<void>;
  toggleFavorite: (id: string) => void;
  reset: () => void;
}

export const useTemplateStore = create<TemplateStore>((set) => ({
  templates: [],
  loading: false,
  error: null,
  
  fetchTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.getTemplates();
      set({ templates: response.data.templates });
    } catch (error) {
      set({ error: 'データの取得に失敗しました' });
    } finally {
      set({ loading: false });
    }
  },
  
  toggleFavorite: (id) => {
    set((state) => ({
      templates: state.templates.map(t =>
        t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
      )
    }));
  },
  
  reset: () => set({ templates: [], loading: false, error: null })
}));
```

## 6. セキュリティ実装

### 6.1 入力検証
```typescript
// すべてのユーザー入力を検証
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
```

### 6.2 ファイルアップロード
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export async function validateImage(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('ファイルサイズは5MB以下にしてください');
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('PNG、JPEG、WebP形式のみ対応');
  }
  
  // マジックナンバーチェック
  const buffer = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return true;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) return true;
  
  throw new Error('無効な画像ファイルです');
}
```

### 6.3 セキュリティヘッダー
```typescript
// workers/middleware/security.ts
export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Content-Security-Policy', 
    "default-src 'self'; script-src 'self' 'unsafe-inline';"
  );
  
  return new Response(response.body, {
    status: response.status,
    headers
  });
}
```

## 7. パフォーマンス最適化

### 7.1 コード分割
```typescript
// 遅延読み込み
const TemplateEditor = lazy(() => import('./pages/TemplateEditor'));

// Suspenseでラップ
<Suspense fallback={<LoadingSpinner />}>
  <TemplateEditor />
</Suspense>
```

### 7.2 メモ化
```typescript
// 高コストな計算をメモ化
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// コンポーネントのメモ化
export const TemplateCard = React.memo(({ template }) => {
  // レンダリング
}, (prev, next) => prev.template.id === next.template.id);
```

### 7.3 画像最適化
```typescript
// 遅延読み込み
<img 
  src={thumbnail} 
  loading="lazy"
  decoding="async"
  alt={template.name}
/>
```

## 8. テスト戦略

### 8.1 TDDサイクル
```typescript
// 1. Red: 失敗するテストを書く
test('should validate file size', () => {
  const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png');
  expect(() => validateImage(largeFile)).toThrow('5MB以下');
});

// 2. Green: 最小限の実装
// 3. Refactor: コードを改善
```

### 8.2 テストカバレッジ目標
- 単体テスト: 80%以上
- 統合テスト: 主要フロー100%
- E2Eテスト: クリティカルパス（将来）

## 9. デプロイメント

### 9.1 ビルド設定
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'utils': ['zod', 'clsx']
        }
      }
    }
  }
});
```

### 9.2 環境変数
```typescript
// 環境別設定
const config = {
  development: {
    apiUrl: 'http://localhost:8787',
    debug: true
  },
  production: {
    apiUrl: 'https://api.visual-prompt-builder.com',
    debug: false
  }
}[import.meta.env.MODE];
```

## 10. 開発ガイドライン

### 10.1 必須ワークフロー
1. **npm install を最初に実行**（忘れると時間を無駄にする）
2. **TDD実践**: テストを先に書く
3. **型安全性**: anyは使用禁止
4. **動作確認**: 「理論上動く」は禁止
5. **ログ更新**: 実装ログ・感情ログ必須

### 10.2 コーディング規約
- インポート順序: 外部 → 内部 → 型 → スタイル
- 関数: 50行以内
- エラー: 必ずtry-catch
- 命名: 明確で一貫性のある名前

---

**最終更新**: 2025-06-25  
**バージョン**: 統合版