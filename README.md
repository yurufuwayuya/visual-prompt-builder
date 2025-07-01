# Visual Prompt Builder

就労継続支援B型事業所向けのビジュアルプロンプトビルダー

## 概要

このプロジェクトは、障害を持つ方でも簡単にAI画像生成用のプロンプトを作成できるツールです。
直感的なUIで選択肢から選ぶだけで、高品質なプロンプトを生成できます。

## プロジェクト構造

```
visual-prompt-builder/
├── frontend/               # React フロントエンドアプリケーション
├── workers/               # Cloudflare Workers バックエンド
├── shared/                # 共有型定義とユーティリティ
├── tests/                 # E2Eテスト
└── docs/                  # ドキュメント
```

## 技術スタック

- **フロントエンド**: React + TypeScript + Vite + Tailwind CSS
- **バックエンド**: Cloudflare Workers + Hono
- **状態管理**: Zustand
- **デプロイ**: Cloudflare Pages & Workers

## 開発環境セットアップ

### 必要条件

- Node.js v18以上
- npm v9以上
- Wrangler CLI

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# Workers開発サーバーの起動
npm run dev:worker
```

### ビルド

```bash
# 全ワークスペースのビルド
npm run build
```

### テスト

```bash
# 全ワークスペースのテスト実行
npm run test
```

## ライセンス

MIT License