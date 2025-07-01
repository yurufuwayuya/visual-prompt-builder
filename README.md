# Visual Prompt Builder

就労継続支援B型事業所向けのビジュアルプロンプトビルダー

## 📋 概要

このプロジェクトは、障害を持つ方でも簡単にAI画像生成用のプロンプトを作成できるツールです。
直感的なUIで選択肢から選ぶだけで、高品質なプロンプトを生成できます。

### 主な機能

- 🎨 **ビジュアルプロンプト生成**: カテゴリ、詳細、スタイルを選択して画像生成用プロンプトを作成
- 📱 **レスポンシブデザイン**: モバイル、タブレット、デスクトップに完全対応
- ♿ **アクセシビリティ**: WCAG 2.1 Level AA準拠、スクリーンリーダー対応
- 🔒 **セキュリティ**: XSS対策、レート制限、CSP設定
- 🌐 **多言語対応**: 日本語・英語切り替え可能

## 🏗️ プロジェクト構造

```
visual-prompt-builder/
├── frontend/              # React フロントエンドアプリケーション
│   ├── src/
│   │   ├── components/    # UIコンポーネント
│   │   ├── pages/        # ページコンポーネント
│   │   ├── stores/       # Zustand ストア
│   │   ├── hooks/        # カスタムフック
│   │   └── lib/          # ユーティリティ
│   └── public/           # 静的ファイル
├── workers/              # Cloudflare Workers バックエンド
│   └── src/
│       ├── routes/       # APIルート
│       ├── services/     # ビジネスロジック
│       └── middleware/   # ミドルウェア
├── shared/               # 共有型定義とユーティリティ
│   └── src/
│       ├── types/        # TypeScript型定義
│       └── constants/    # 定数（マスターデータ）
├── tests/                # E2Eテスト
└── docs/                 # ドキュメント
```

## 🚀 技術スタック

### フロントエンド
- **フレームワーク**: React 18.3.1
- **ビルドツール**: Vite 5.3.1
- **言語**: TypeScript 5.4.5
- **スタイリング**: Tailwind CSS 3.4.4
- **状態管理**: Zustand 4.5.2
- **ルーティング**: React Router 6.23.1
- **UIライブラリ**: Lucide React (アイコン)
- **アクセシビリティ**: @axe-core/react

### バックエンド
- **ランタイム**: Cloudflare Workers
- **フレームワーク**: Hono 4.6.14
- **バリデーション**: Zod 3.24.1
- **ストレージ**: Cloudflare KV

### 開発ツール
- **パッケージ管理**: npm workspaces (Monorepo)
- **コード品質**: ESLint, Prettier
- **テスト**: Vitest, Testing Library
- **CI/CD**: GitHub Actions

## 📦 開発環境セットアップ

### 必要条件

- Node.js v18以上
- npm v9以上
- Git

### インストール手順

1. **リポジトリのクローン**
```bash
git clone https://github.com/your-org/visual-prompt-builder.git
cd visual-prompt-builder
```

2. **依存関係のインストール**
```bash
# ルートディレクトリで実行（全ワークスペースの依存関係をインストール）
npm install
```

3. **環境変数の設定**
```bash
# .env.exampleをコピー
cp .env.example .env

# 必要に応じて編集
vi .env
```

4. **開発サーバーの起動**
```bash
# フロントエンド開発サーバー（http://localhost:5173）
npm run dev

# 別ターミナルでバックエンド開発サーバー（http://localhost:8787）
npm run dev:worker
```

### ビルド

```bash
# 全ワークスペースのビルド
npm run build

# 個別ビルド
npm run build:frontend
npm run build:worker
npm run build:shared
```

### テスト

```bash
# 全テストの実行
npm run test

# 監視モードでテスト
npm run test:watch

# カバレッジレポート生成
npm run test:coverage
```

### リンティング

```bash
# ESLintの実行
npm run lint

# Prettierでフォーマット
npm run format
```

## 🔧 アーキテクチャ

### フロントエンドアーキテクチャ

```
フロントエンド
├── Pages（ルーティング）
│   ├── Home
│   ├── PromptBuilder
│   └── History
├── Components（UI部品）
│   ├── common/（共通コンポーネント）
│   ├── steps/（ステップコンポーネント）
│   └── a11y/（アクセシビリティ）
├── Stores（状態管理）
│   ├── promptStore（プロンプトデータ）
│   └── toastStore（通知）
└── Hooks（カスタムフック）
    ├── useSwipe（スワイプ操作）
    └── useKeyboardShortcuts（キーボード）
```

### バックエンドアーキテクチャ

```
Workers
├── Routes（APIエンドポイント）
│   ├── /api/prompt/generate
│   ├── /api/translate
│   └── /health
├── Services（ビジネスロジック）
│   ├── promptGenerator
│   └── translator
├── Middleware（横断的処理）
│   ├── cors
│   ├── rateLimit
│   └── secureHeaders
└── Storage
    └── KV Namespace
```

## 🔐 セキュリティ

- **XSS対策**: 入力サニタイズ、CSP設定
- **CORS**: オリジンホワイトリスト方式
- **レート制限**: IP単位での制限（60req/分）
- **セキュリティヘッダー**: X-Frame-Options, X-Content-Type-Options等

## ♿ アクセシビリティ

- **WCAG 2.1 Level AA準拠**
- **セマンティックHTML**: 適切な要素とランドマーク
- **ARIA属性**: role, aria-label, aria-live等
- **キーボードナビゲーション**: Tab順序、フォーカス管理
- **スクリーンリーダー対応**: 音声読み上げ最適化

## 📖 API仕様

詳細は[API仕様書](./docs/api-specification.md)を参照してください。

## 🚀 デプロイ

詳細は[デプロイ手順書](./docs/deployment-guide.md)を参照してください。

## 📘 操作マニュアル

エンドユーザー向けの詳細な操作方法は[操作マニュアル](./docs/user-manual.md)を参照してください。

## 🤝 コントリビューション

1. Issueを作成して機能提案やバグ報告
2. フォークしてブランチを作成
3. 変更をコミット
4. プルリクエストを送信

## 📝 ライセンス

MIT License

## 🙏 謝辞

このプロジェクトは就労継続支援B型事業所の利用者様とスタッフの皆様のご協力により開発されました。