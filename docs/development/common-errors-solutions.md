# よくあるエラーと解決策ガイド

Visual Prompt Builderプロジェクトで頻繁に遭遇するエラーとその解決策をまとめました。

## 目次

1. [環境構築関連](#環境構築関連)
2. [TypeScript/型定義関連](#typescript型定義関連)
3. [React関連](#react関連)
4. [ビルド・バンドル関連](#ビルドバンドル関連)
5. [テスト関連](#テスト関連)
6. [Cloudflare Workers関連](#cloudflare-workers関連)

## 環境構築関連

### 1. Module not found エラー

#### 症状
```bash
Error: Cannot find module 'react-router-dom'
Module not found: Error: Can't resolve '@/components/Button'
```

#### 原因と解決策

**原因1: npm install未実行**
```bash
# 解決策
npm install
# または monorepo の場合
npm install --workspaces
```

**原因2: パスエイリアスの設定ミス**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]  // 正しいパスを設定
    }
  }
}

// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

**原因3: 相対パスの誤り**
```typescript
// ❌ 間違い
import Button from '../../../components/Button';

// ✅ 正解（エイリアス使用）
import Button from '@/components/Button';
```

### 2. peer dependency 警告

#### 症状
```bash
npm WARN peer dep missing: react@^18.0.0, required by some-package
```

#### 解決策
```bash
# peer dependencyを確認して追加
npm ls react  # 現在のバージョン確認
npm install react@^18.0.0  # 必要なバージョンをインストール
```

## TypeScript/型定義関連

### 1. Property does not exist エラー

#### 症状
```typescript
// エラー: Property 'nameEn' does not exist on type 'Selection'
const englishName = selection.nameEn;
```

#### 解決策

**方法1: 型ガードを使用**
```typescript
// マスターデータとの型の違いを吸収
if ('nameEn' in item) {
  // CategoryMaster型として扱える
  return item.nameEn;
} else {
  // Selection型として扱う
  return item.displayName;
}
```

**方法2: ヘルパー関数で抽象化**
```typescript
// getMasterDataById関数を作成
const getMasterDataById = (type: string, id: string) => {
  switch(type) {
    case 'category':
      return CATEGORIES.find(c => c.id === id);
    // ... 他のタイプ
  }
};

// 使用時
const masterData = getMasterDataById('category', selection.predefinedId);
const name = selection.customText || masterData?.nameEn || selection.displayName;
```

### 2. Type assertion エラー

#### 症状
```typescript
// エラー: Type 'unknown' is not assignable to type 'string'
const value = someValue as string;  // エラーになる場合
```

#### 解決策
```typescript
// 安全な型アサーション
const value = String(someValue);  // 文字列に変換

// より厳密な型チェック
if (typeof someValue === 'string') {
  const value: string = someValue;
}
```

### 3. Generic型の不一致

#### 症状
```typescript
// エラー: Type 'Partial<PromptSelections>' is not assignable to type 'PromptSelections'
const selections: PromptSelections = usePromptStore(state => state.selections);
```

#### 解決策
```typescript
// 型を明示的に指定
const selections = usePromptStore(state => state.selections) as PromptSelections;

// またはストアの型定義を修正
interface PromptStore {
  selections: Partial<PromptSelections>;  // Partialを明示
}
```

## React関連

### 1. Router二重ネストエラー

#### 症状
```
Error: You cannot render a <Router> inside another <Router>
```

#### 解決策
```typescript
// ❌ テストで二重ラップ
// App.tsx
export function App() {
  return (
    <BrowserRouter>
      <Routes>...</Routes>
    </BrowserRouter>
  );
}

// test file
render(
  <BrowserRouter>  // ❌ 二重！
    <App />
  </BrowserRouter>
);

// ✅ 正しいテストコード
render(<App />);  // App内でBrowserRouterを使用
```

### 2. Invalid hook call エラー

#### 症状
```
Error: Invalid hook call. Hooks can only be called inside of the body of a function component
```

#### 原因と解決策
```typescript
// ❌ 間違い: 条件文内でフック使用
if (condition) {
  const [state, setState] = useState();  // エラー！
}

// ✅ 正解: トップレベルで使用
const [state, setState] = useState();
if (condition) {
  setState(newValue);
}
```

### 3. JSX要素のネストエラー

#### 症状
```
Unexpected closing tag </div>. Expected </header>
```

#### 解決策
```typescript
// ❌ タグの不一致
<header>
  <div>
  </div>
</header>  // 閉じタグの順序を確認

// ✅ 適切なネスト
<header>
  <div>
  </div>
</header>

// VSCode拡張機能の活用
// - Auto Rename Tag
// - Bracket Pair Colorizer
```

## ビルド・バンドル関連

### 1. Dynamic import エラー

#### 症状
```
Failed to fetch dynamically imported module
```

#### 解決策
```typescript
// ❌ named exportとdefault exportの混在
// CategorySelection.tsx
export function CategorySelection() {}
export { CategorySelection };  // 重複！

// lazyImports.ts
const CategorySelection = lazy(() => 
  import('./pages/CategorySelection').then(m => ({ default: m.CategorySelection }))
);

// ✅ 統一的なexport
// CategorySelection.tsx
export default function CategorySelection() {}

// lazyImports.ts
const CategorySelection = lazy(() => import('./pages/CategorySelection'));
```

### 2. ビルドサイズ警告

#### 症状
```
Warning: Bundle size exceeds 500kb
```

#### 解決策
```typescript
// 1. 未使用の依存関係を削除
npm uninstall @dnd-kit/core @dnd-kit/sortable  // 未使用なら削除

// 2. 動的インポートで分割
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// 3. tree-shakingの最適化
// package.json
{
  "sideEffects": false  // tree-shaking有効化
}
```

## テスト関連

### 1. テストタイムアウト

#### 症状
```
Timeout - Async callback was not invoked within 5000ms
```

#### 解決策
```typescript
// タイムアウト時間を延長
test('async operation', async () => {
  // ...
}, 10000);  // 10秒に延長

// またはグローバル設定
// vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 10000
  }
});
```

### 2. モックが効かない

#### 症状
```typescript
// モックしたのに実際のモジュールが呼ばれる
```

#### 解決策
```typescript
// vitest の場合
vi.mock('@/utils/api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: 'mocked' }))
}));

// モックをクリア
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Cloudflare Workers関連

### 1. KV Namespace エラー

#### 症状
```
Error: KV namespace not found
```

#### 解決策
```bash
# 1. KV namespace を作成
wrangler kv:namespace create "CACHE"

# 2. wrangler.toml に追加
[[kv_namespaces]]
binding = "CACHE"
id = "your-namespace-id"

# 3. ローカル開発用の設定
[[kv_namespaces]]
binding = "CACHE"
id = "your-namespace-id"
preview_id = "preview-namespace-id"
```

### 2. 環境変数アクセスエラー

#### 症状
```typescript
// エラー: process is not defined
const apiKey = process.env.API_KEY;
```

#### 解決策
```typescript
// Cloudflare Workers では env オブジェクトを使用
export default {
  async fetch(request: Request, env: Env) {
    const apiKey = env.API_KEY;  // env から取得
  }
};

// 型定義
interface Env {
  API_KEY: string;
  CACHE: KVNamespace;
}
```

## トラブルシューティングのコツ

### 1. エラーメッセージを読む

```bash
# スタックトレースの重要な部分に注目
Error: Cannot find module '@/components/Button'
  at /Users/project/src/App.tsx:5:15  # ← この行を確認
```

### 2. 段階的に問題を切り分け

```bash
# 1. 最小限の再現コードを作成
# 2. 一つずつ要素を追加
# 3. エラーが発生する瞬間を特定
```

### 3. ログを活用

```typescript
console.log('Current state:', state);
console.log('Type of value:', typeof value);
console.log('Keys:', Object.keys(object));
```

### 4. 開発者ツールの活用

- React Developer Tools
- Redux/Zustand DevTools
- Network タブでAPIリクエスト確認
- Console でエラー詳細確認

## エラー予防のベストプラクティス

1. **型定義を明確に**
   ```typescript
   // 曖昧な型を避ける
   const data: any = {};  // ❌
   const data: UserData = {};  // ✅
   ```

2. **エラーハンドリングを忘れない**
   ```typescript
   try {
     await riskyOperation();
   } catch (error) {
     console.error('Operation failed:', error);
     // ユーザーへの通知
   }
   ```

3. **定期的な依存関係の更新**
   ```bash
   npm outdated  # 古いパッケージ確認
   npm update    # 安全な更新
   ```

4. **テストを書く**
   ```typescript
   // エラーケースもテスト
   it('should handle error gracefully', () => {
     expect(() => riskyFunction()).not.toThrow();
   });
   ```