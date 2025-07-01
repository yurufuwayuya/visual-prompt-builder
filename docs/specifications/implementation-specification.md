# 実装方針仕様書

## 1. 概要

本仕様書は、ビジュアルプロンプトビルダーの実装における技術的な方針と開発ガイドラインを定めたものです。要件定義書に基づき、段階的な実装アプローチと品質確保の方法を示します。

## 2. 実装方針

### 2.1 開発アプローチ

#### 2.1.1 段階的リリース戦略

| フェーズ | バージョン | 期間 | 主要機能 | 目標 |
|---------|-----------|------|----------|------|
| MVP | v0.1 | 2週間 | 基本的なプロンプト生成 | 動作確認 |
| Alpha | v0.5 | 4週間 | 全機能実装（基本） | 内部テスト |
| Beta | v0.9 | 2週間 | UI/UX改善、バグ修正 | ユーザーテスト |
| Release | v1.0 | 2週間 | 安定版リリース | 本番運用 |

#### 2.1.2 アジャイル開発

- **スプリント期間**: 1週間
- **デイリースタンドアップ**: 毎朝15分
- **スプリントレビュー**: 金曜午後
- **レトロスペクティブ**: 2週間ごと

### 2.2 技術スタック選定理由

#### 2.2.1 フロントエンド

```
選定技術: React + TypeScript + Vite

理由:
- React: コンポーネント化による再利用性とメンテナンス性
- TypeScript: 型安全性による品質向上とドキュメント性
- Vite: 高速な開発体験とビルド効率
```

#### 2.2.2 バックエンド

```
選定技術: Cloudflare Workers + TypeScript

理由:
- Cloudflare Workers: エッジコンピューティングによる低遅延
- TypeScript: 型安全性とAPI定義の共有
- Hono Framework: Workers最適化された軽量フレームワーク
- Wrangler: Cloudflare公式の開発ツール
```

#### 2.2.3 インフラストラクチャ

```
選定技術: Cloudflare Workers + Pages

理由:
- Cloudflare Workers: グローバルエッジでの実行
- Cloudflare Pages: 静的アセットの配信
- KV Storage: エッジでの高速データアクセス
- D1 Database: SQLiteベースのエッジデータベース（必要時）
```

## 3. アーキテクチャ設計

### 3.1 システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                        ユーザーブラウザ                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 React アプリケーション                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │   │
│  │  │ Components  │  │   Stores    │  │  Services │ │   │
│  │  └─────────────┘  └─────────────┘  └───────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               │
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge Network                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Cloudflare Workers (API)                 │  │
│  │  ┌────────────┐  ┌─────────────┐  ┌──────────────┐ │  │
│  │  │   Router   │  │  Middleware │  │   Handlers   │ │  │
│  │  │   (Hono)   │  │   (Auth)    │  │  (Business)  │ │  │
│  │  └────────────┘  └─────────────┘  └──────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Cloudflare Pages (Static Assets)          │  │
│  │                    React Build Output                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Edge Storage                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │  │
│  │  │  KV Store   │  │  D1 (SQLite)│  │   Cache    │  │  │
│  │  │  (Session)  │  │  (Optional) │  │  (Response)│  │  │
│  │  └─────────────┘  └─────────────┘  └────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌───────────────┐
│  External API │
│  (翻訳サービス) │
└───────────────┘
```

### 3.2 レイヤード・アーキテクチャ

```
┌─────────────────────────────────────┐
│      Presentation Layer             │
│  (React Components / Pages)         │
├─────────────────────────────────────┤
│      Application Layer              │
│  (Business Logic / Use Cases)      │
├─────────────────────────────────────┤
│      Domain Layer                   │
│  (Entities / Value Objects)         │
├─────────────────────────────────────┤
│      Infrastructure Layer           │
│  (API / Storage / External)        │
└─────────────────────────────────────┘
```

## 4. 開発規約

### 4.1 コーディング規約

#### 4.1.1 TypeScript/JavaScript

```typescript
// ファイル名: PascalCase.tsx (コンポーネント), camelCase.ts (その他)

// インポート順序
import React from 'react'; // 1. React関連
import { external } from 'library'; // 2. 外部ライブラリ
import { Component } from '@/components'; // 3. 内部コンポーネント
import { utility } from '@/utils'; // 4. ユーティリティ
import type { Type } from '@/types'; // 5. 型定義

// 命名規則
const CONSTANT_VALUE = 'constant'; // 定数: UPPER_SNAKE_CASE
const variableName = 'variable'; // 変数: camelCase
function functionName() {} // 関数: camelCase
class ClassName {} // クラス: PascalCase
interface InterfaceName {} // インターフェース: PascalCase
type TypeName = {}; // 型エイリアス: PascalCase

// コンポーネント定義
export const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // フックは最上部に記述
  const [state, setState] = useState<string>('');
  
  // イベントハンドラー
  const handleClick = useCallback(() => {
    // 処理
  }, [dependency]);
  
  // レンダリング
  return (
    <div className="component-name">
      {/* JSXコメント */}
    </div>
  );
};
```

#### 4.1.2 CSS/スタイリング

```scss
// BEM記法を採用
.block {
  &__element {
    &--modifier {
      // スタイル定義
    }
  }
}

// CSS変数による一貫性
:root {
  // カラーパレット
  --color-primary: #4A90E2;
  --color-secondary: #7ED321;
  
  // スペーシング
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  
  // フォントサイズ
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 18px;
}
```

### 4.2 ディレクトリ構造

```
visual-prompt-builder/
├── frontend/               # React フロントエンド
│   ├── src/
│   │   ├── components/    # 再利用可能なUIコンポーネント
│   │   │   ├── common/   # 汎用コンポーネント
│   │   │   ├── features/ # 機能別コンポーネント
│   │   │   └── layouts/  # レイアウトコンポーネント
│   │   ├── pages/        # ページコンポーネント
│   │   ├── hooks/        # カスタムフック
│   │   ├── stores/       # 状態管理
│   │   ├── services/     # APIクライアント
│   │   ├── utils/        # ユーティリティ関数
│   │   ├── types/        # TypeScript型定義
│   │   └── constants/    # 定数定義
│   ├── public/           # 公開静的ファイル
│   └── dist/             # ビルド出力
├── workers/               # Cloudflare Workers
│   ├── src/
│   │   ├── handlers/     # APIハンドラー
│   │   ├── middleware/   # ミドルウェア
│   │   ├── services/     # ビジネスロジック
│   │   ├── utils/        # ユーティリティ
│   │   └── index.ts      # エントリーポイント
│   └── test/             # Workers テスト
├── shared/                # 共有コード
│   ├── types/            # 共通型定義
│   └── constants/        # 共通定数
├── tests/                 # E2Eテスト
├── wrangler.toml          # Cloudflare設定
├── package.json           # プロジェクト設定
└── docs/                  # ドキュメント
```

## 5. 状態管理設計

### 5.1 状態管理戦略

```typescript
// Zustandによるグローバル状態管理
interface AppState {
  // プロンプト作成状態
  promptCreation: {
    currentStep: number;
    selections: PromptSelections;
    isValid: boolean;
  };
  
  // UI状態
  ui: {
    isLoading: boolean;
    error: Error | null;
    notification: Notification | null;
  };
  
  // ユーザーデータ
  userData: {
    history: PromptData[];
    favorites: PromptData[];
    settings: UserSettings;
  };
}

// ストア定義例
const usePromptStore = create<PromptStore>((set, get) => ({
  selections: initialSelections,
  
  updateSelection: (key: string, value: any) => {
    set((state) => ({
      selections: {
        ...state.selections,
        [key]: value,
      },
    }));
  },
  
  generatePrompt: async () => {
    const { selections } = get();
    set({ isLoading: true, error: null });
    
    try {
      const result = await promptService.generate(selections);
      set({ result, isLoading: false });
      return result;
    } catch (error) {
      set({ error, isLoading: false });
      throw error;
    }
  },
}));
```

### 5.2 ローカルストレージ管理

```typescript
// ストレージサービス
class StorageService {
  private readonly PREFIX = 'vpb_';
  
  // 型安全な保存
  save<T>(key: string, data: T): void {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(this.PREFIX + key, serialized);
    } catch (error) {
      console.error('Storage save error:', error);
    }
  }
  
  // 型安全な読み込み
  load<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Storage load error:', error);
      return defaultValue;
    }
  }
  
  // 容量管理
  checkStorageQuota(): StorageQuota {
    const usage = new Blob(
      Object.values(localStorage)
    ).size;
    
    return {
      used: usage,
      available: 5 * 1024 * 1024 - usage, // 5MB limit
    };
  }
}
```

## 6. パフォーマンス最適化

### 6.1 フロントエンド最適化

```typescript
// 1. コンポーネントの最適化
const OptimizedComponent = memo(({ data }) => {
  // メモ化されたコンポーネント
  return <div>{data}</div>;
}, (prevProps, nextProps) => {
  // カスタム比較関数
  return prevProps.data.id === nextProps.data.id;
});

// 2. 遅延読み込み
const LazyComponent = lazy(() => 
  import('./components/HeavyComponent')
);

// 3. 仮想化リスト
const VirtualList = ({ items }) => {
  return (
    <VirtualizedList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          {items[index]}
        </div>
      )}
    </VirtualizedList>
  );
};

// 4. デバウンス処理
const useDebouncedValue = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};
```

### 6.2 ネットワーク最適化

```typescript
// Cloudflare Workers用APIクライアント
class EdgeOptimizedAPIClient {
  constructor(
    private env: {
      CACHE: KVNamespace;
      TRANSLATION_API_KEY: string;
    }
  ) {}
  
  async request<T>(
    endpoint: string,
    options?: RequestOptions
  ): Promise<T> {
    // KVキャッシュチェック
    const cacheKey = this.getCacheKey(endpoint, options);
    const cached = await this.env.CACHE.get(cacheKey, 'json');
    
    if (cached) {
      return cached as T;
    }
    
    // Fetch with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(endpoint, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });
      
      const data = await response.json();
      
      // KVキャッシュ保存（TTL付き）
      await this.env.CACHE.put(
        cacheKey,
        JSON.stringify(data),
        { expirationTtl: 300 } // 5分
      );
      
      return data as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
```

## 7. エラーハンドリング

### 7.1 エラー分類と処理

```typescript
// エラー分類
enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  TRANSLATION = 'TRANSLATION',
  STORAGE = 'STORAGE',
  UNKNOWN = 'UNKNOWN',
}

// カスタムエラークラス
class AppError extends Error {
  constructor(
    public type: ErrorType,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
  
  // ユーザー向けメッセージ
  getUserMessage(): string {
    switch (this.type) {
      case ErrorType.NETWORK:
        return 'ネットワークエラーが発生しました。接続を確認してください。';
      case ErrorType.TRANSLATION:
        return '翻訳サービスが一時的に利用できません。';
      case ErrorType.VALIDATION:
        return '入力内容に誤りがあります。';
      default:
        return 'エラーが発生しました。しばらく待ってから再度お試しください。';
    }
  }
}

// エラーバウンダリ
class ErrorBoundary extends Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラーログ送信
    errorReporter.log(error, errorInfo);
    
    // フォールバックUI表示
    this.setState({ hasError: true, error });
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

### 7.2 リトライ戦略

```typescript
// 指数バックオフによるリトライ
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts - 1) {
        throw lastError;
      }
      
      const delay = Math.min(
        initialDelay * Math.pow(factor, attempt),
        maxDelay
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}
```

## 8. テスト戦略

### 8.1 テストピラミッド

```
         /\
        /E2E\        10% - ユーザーシナリオテスト
       /______\
      /        \
     /Integration\   30% - API・コンポーネント統合テスト
    /______________\
   /                \
  /   Unit Tests     \ 60% - 関数・コンポーネント単体テスト
 /____________________\
```

### 8.2 テスト実装例

```typescript
// ユニットテスト例
describe('PromptGenerator', () => {
  it('should generate prompt with all selections', () => {
    const selections = {
      category: { predefinedId: 'animal', displayName: '動物' },
      details: [{ predefinedId: 'cat', displayName: '猫' }],
      // ... その他の選択
    };
    
    const result = generatePrompt(selections);
    
    expect(result).toContain('cat');
    expect(result).toContain('high quality');
    expect(result).toMatch(/^[a-zA-Z\s,]+$/); // 英語のみ
  });
});

// 統合テスト例
describe('PromptCreation Flow', () => {
  it('should complete prompt creation process', async () => {
    const { getByText, getByRole } = render(<App />);
    
    // カテゴリ選択
    fireEvent.click(getByText('動物'));
    
    // 詳細選択
    fireEvent.click(getByText('猫'));
    
    // プロンプト生成
    fireEvent.click(getByRole('button', { name: 'プロンプトを生成' }));
    
    // 結果確認
    await waitFor(() => {
      expect(getByText(/cat/i)).toBeInTheDocument();
    });
  });
});
```

## 9. デプロイメント戦略

### 9.1 CI/CDパイプライン

```yaml
# GitHub Actions設定例
name: CI/CD Pipeline for Cloudflare Workers

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Build Frontend
        run: npm run build
      
      - name: Test Workers
        run: npm run test:workers

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Deploy to Cloudflare Workers (Staging)
        run: |
          npx wrangler deploy --env staging
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
      
      - name: Deploy to Cloudflare Pages (Staging)
        run: |
          npx wrangler pages deploy dist --project-name=vpb-staging
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Deploy to Cloudflare Workers (Production)
        run: |
          npx wrangler deploy --env production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
      
      - name: Deploy to Cloudflare Pages (Production)
        run: |
          npx wrangler pages deploy dist --project-name=vpb-production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
```

### 9.2 環境構成

| 環境 | 用途 | URL | 自動デプロイ |
|------|------|-----|-------------|
| Development | 開発 | localhost:8787 (Wrangler Dev) | - |
| Staging | テスト | vpb-staging.workers.dev | develop ブランチ |
| Production | 本番 | vpb.example.com (カスタムドメイン) | main ブランチ |

### 9.3 Cloudflare Workers設定

```toml
# wrangler.toml
name = "visual-prompt-builder"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.staging]
name = "visual-prompt-builder-staging"
vars = { ENVIRONMENT = "staging" }
kv_namespaces = [
  { binding = "CACHE", id = "xxxxxxxx" },
  { binding = "SESSION", id = "yyyyyyyy" }
]

[env.production]
name = "visual-prompt-builder-production"
vars = { ENVIRONMENT = "production" }
kv_namespaces = [
  { binding = "CACHE", id = "aaaaaaaa" },
  { binding = "SESSION", id = "bbbbbbbb" }
]
routes = [
  { pattern = "vpb.example.com/api/*", zone_name = "example.com" }
]

[[d1_databases]]
binding = "DB"
database_name = "vpb-database"
database_id = "cccccccc"
```

### 9.4 エッジ最適化戦略

```typescript
// Cloudflare Workers用の最適化設定
export const edgeConfig = {
  // キャッシュ戦略
  cache: {
    // 静的アセットの長期キャッシュ
    static: {
      'Cache-Control': 'public, max-age=31536000, immutable'
    },
    // APIレスポンスのキャッシュ
    api: {
      'Cache-Control': 'public, max-age=300, s-maxage=600'
    }
  },
  
  // レート制限
  rateLimit: {
    // IPベースの制限
    perIp: {
      limit: 100,
      window: 60 // 秒
    }
  },
  
  // エッジでのデータ圧縮
  compression: {
    enabled: true,
    types: ['text/html', 'application/json', 'text/css', 'application/javascript']
  }
};
```

## 10. 監視とロギング

### 10.1 監視項目

```typescript
// パフォーマンス監視
const performanceMonitor = {
  // ページロード時間
  measurePageLoad: () => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd,
      loadComplete: navigation.loadEventEnd,
    };
  },
  
  // API応答時間
  measureAPICall: async (name: string, fn: () => Promise<any>) => {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      analytics.track('api_call', {
        name,
        duration,
        success: true,
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      analytics.track('api_call', {
        name,
        duration,
        success: false,
        error: error.message,
      });
      
      throw error;
    }
  },
};
```

### 10.2 ログ設計

```typescript
// Cloudflare Workers用構造化ログ
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: {
    userId?: string;
    sessionId?: string;
    action?: string;
    metadata?: Record<string, any>;
  };
  // Workers固有のコンテキスト
  cf?: {
    colo?: string;
    country?: string;
    requestId?: string;
  };
}

class WorkersLogger {
  constructor(
    private env: {
      LOGFLARE_API_KEY?: string;
      ENVIRONMENT: string;
    },
    private request: Request
  ) {}
  
  async log(entry: LogEntry): Promise<void> {
    // CFプロパティの追加
    const logData = {
      ...entry,
      timestamp: new Date().toISOString(),
      cf: {
        colo: this.request.cf?.colo,
        country: this.request.cf?.country,
        requestId: this.request.headers.get('cf-ray'),
      },
    };
    
    // 開発環境
    if (this.env.ENVIRONMENT === 'development') {
      console[entry.level](JSON.stringify(logData));
    }
    
    // 本番環境 - Logflareなどへ送信
    if (this.env.ENVIRONMENT === 'production' && this.env.LOGFLARE_API_KEY) {
      await fetch('https://api.logflare.app/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.env.LOGFLARE_API_KEY,
        },
        body: JSON.stringify(logData),
      });
    }
  }
}
```

## 11. 実装スケジュール

### 11.1 マイルストーン

| フェーズ | 期間 | 成果物 |
|---------|------|--------|
| Phase 1: 基盤構築 | Week 1-2 | プロジェクトセットアップ、基本UI |
| Phase 2: コア機能 | Week 3-5 | プロンプト生成機能、翻訳連携 |
| Phase 3: データ管理 | Week 6-7 | 履歴・お気に入り機能 |
| Phase 4: 品質向上 | Week 8-9 | テスト、パフォーマンス改善 |
| Phase 5: リリース準備 | Week 10 | デプロイ、ドキュメント整備 |

### 11.2 チェックリスト

- [ ] 開発環境構築完了
- [ ] 基本コンポーネント実装
- [ ] API連携実装
- [ ] 状態管理実装
- [ ] テストカバレッジ70%達成
- [ ] パフォーマンス目標達成
- [ ] セキュリティ監査完了
- [ ] ドキュメント作成完了
- [ ] 本番環境デプロイ