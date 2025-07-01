# インストールガイド

Visual Prompt Builderのテストに必要なインストール手順です。

## 前提条件

- Node.js v18以上（推奨: v20以上）
- npm v9以上

## インストール手順

### 1. プロジェクトのルートディレクトリに移動

```bash
cd /home/yuya-kitamori/visual-prompt-builder/visual-prompt-builder
```

### 2. 依存関係のインストール

モノレポ構造のため、ルートディレクトリで一度実行すれば全ワークスペースの依存関係がインストールされます：

```bash
npm install
```

このコマンドで以下がインストールされます：

#### 共通依存関係
- TypeScript
- ESLint + Prettier
- Husky + lint-staged
- commitlint

#### Frontend依存関係
- React 18
- React Router DOM
- Vite
- Tailwind CSS + PostCSS
- Zustand（状態管理）
- HeadlessUI React
- class-variance-authority
- react-sortable-hoc + array-move
- テスト関連: Vitest, @testing-library/react, jsdom

#### Workers依存関係
- Hono（Cloudflare Workers用フレームワーク）
- Cloudflare Workers Types

### 3. インストール後の確認

```bash
# ワークスペースの確認
npm ls --depth=0

# 各ワークスペースのビルド確認
npm run build
```

### 4. 開発サーバーの起動

```bash
# フロントエンドの開発サーバー
npm run dev:frontend

# Workersの開発サーバー（別ターミナルで）
npm run dev:workers

# または両方同時に起動
npm run dev
```

### 5. テストの実行

```bash
# 全テストの実行
npm run test

# フロントエンドテストのみ
npm run test:frontend

# テストをウォッチモードで実行
npm run test:frontend -- --watch
```

## トラブルシューティング

### エラー: peer dependency の警告

```bash
# peer dependencyを強制的にインストール
npm install --force
```

### エラー: モジュールが見つからない

```bash
# node_modulesをクリーンアップして再インストール
rm -rf node_modules package-lock.json
npm install
```

### エラー: Wranglerの認証エラー

```bash
# Cloudflareアカウントでログイン（実際のデプロイ時のみ必要）
npx wrangler login
```

## 開発に必要な拡張機能（VSCode）

以下の拡張機能をインストールすることを推奨：

1. **ESLint** - コードの品質チェック
2. **Prettier** - コードフォーマット
3. **Tailwind CSS IntelliSense** - Tailwindクラスの自動補完
4. **TypeScript Vue Plugin** - TypeScriptサポート

## 注意事項

1. **初回インストール時**：package-lock.jsonがまだないため、依存関係の解決に時間がかかる場合があります
2. **メモリ不足エラー**：大規模な依存関係のため、メモリ不足になる場合は以下を実行：
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm install
   ```
3. **Windows環境**：Husky（Git hooks）が正しく動作しない場合があります。その場合は手動でコミット前にlintを実行してください