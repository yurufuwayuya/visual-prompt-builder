# テストファイル配置規約

## 基本ルール

すべてのテストファイルは `__tests__` ディレクトリに配置します。

## ディレクトリ構造

```
frontend/
├── src/
│   ├── components/
│   │   ├── __tests__/           # コンポーネントのテスト
│   │   │   └── Button.test.tsx
│   │   ├── common/
│   │   │   └── __tests__/       # 共通コンポーネントのテスト
│   │   └── steps/
│   │       └── __tests__/       # ステップコンポーネントのテスト
│   └── services/
│       └── __tests__/           # サービスのテスト

workers/
├── src/
│   └── __tests__/
│       ├── routes/              # ルートハンドラーのテスト
│       ├── services/            # サービスのテスト
│       └── utils/               # ユーティリティのテスト

shared/
├── src/
│   └── __tests__/
│       ├── constants/           # 定数のテスト
│       └── utils/               # ユーティリティのテスト
```

## 命名規則

- テストファイルは `*.test.ts` または `*.test.tsx` の拡張子を使用
- テスト対象のファイルと同じ名前を使用（例：`Button.tsx` → `Button.test.tsx`）
- 特定の機能に焦点を当てたテストは、サフィックスを追加（例：`CategoryStep.category-change.test.tsx`）

## テストファイルの統合

- 1つのコンポーネント/モジュールに対して複数のテストファイルがある場合は、可能な限り統合する
- 論理的なグループごとに `describe` ブロックで整理する
- 1つのテストファイルが1000行を超える場合は、機能ごとに分割を検討

## 例

### 統合前

```
ResultStep.test.tsx (600行)
ResultStep.custom.test.tsx (300行)
ResultStep.customTranslation.test.tsx (300行)
```

### 統合後

```
__tests__/ResultStep.test.tsx (1つのファイルに統合)
├── describe('初期表示')
├── describe('プロンプト生成')
├── describe('カスタム項目の処理')
└── describe('カスタムテキストの翻訳')
```
