# Visual Prompt Builder 開発から得られた教訓

このドキュメントは、Visual Prompt Builderプロジェクトの実装記録と感情ログから抽出された教訓をまとめたものです。

## 目次

1. [開発プロセスの教訓](#開発プロセスの教訓)
2. [技術的な教訓](#技術的な教訓)
3. [よくある問題と解決策](#よくある問題と解決策)
4. [アンチパターン集](#アンチパターン集)
5. [推奨プラクティス](#推奨プラクティス)

## 開発プロセスの教訓

### 1. 速度と品質のトレードオフ

**問題**: 10時間で42個のIssueを完了するという無謀な速度優先開発
- npm installすら実行せずにコード実装
- 動作確認なしで「理論上動く」コードの量産
- テストを後回しにした結果、多くのバグが潜在

**教訓**:
- 初期の手抜きは必ず後で倍以上の時間として返ってくる
- 最低限の品質チェック（npm install、型チェック、基本動作確認）は必須
- TDDは面倒でも結果的に効率的

### 2. 環境構築の重要性

**問題**: 環境構築を軽視した結果の開発効率低下
- VSCodeのTypeScriptサーバーが動作せず、エラーに気づけない
- 自動補完が効かず、タイポやimportミスが頻発
- 「エラーを見たくない」という逃避行動

**教訓**:
```bash
# プロジェクト開始時の必須手順
git clone <repository>
cd <project>
npm install      # これを最初に！
npm run dev      # 動作確認
npm test         # テスト環境確認
```

### 3. Issue駆動開発の効果

**良かった点**:
- 180個のタスクを適切な粒度（1-2時間）に分割
- 進捗が可視化され、モチベーション維持に貢献
- 後から「何をやったか」が明確

**改善点**:
- 各Issue開始時の `/clear` コマンド実行を忘れがち
- Issue完了時の動作確認を省略しがち

## 技術的な教訓

### 1. 型定義の一貫性

**問題**: name/nameEn/displayNameプロパティの混在
```typescript
// マスターデータ
interface CategoryMaster {
  id: string;
  name: string;      // 日本語名
  nameEn: string;    // 英語名
}

// 選択データ
interface Selection {
  displayName: string;  // 表示名
  predefinedId?: string;
}
```

**解決策**: predefinedIdベースのアクセスパターン統一
```typescript
// マスターデータへのアクセスヘルパー
const getMasterDataById = {
  category: (id: string) => CATEGORIES.find(c => c.id === id),
  // ...
};

// プロンプト生成時の処理
const name = selection.customText || 
  (selection.predefinedId && getMasterData(selection.predefinedId)?.nameEn) ||
  selection.displayName;
```

### 2. Monorepo構造の功罪

**メリット**:
- 共有型定義の一元管理
- 依存関係の明確化
- 統一的なビルド・テスト

**デメリット**:
- 初期設定の複雑さ
- npm workspacesの学習コスト
- 小規模プロジェクトにはオーバーエンジニアリング

### 3. 技術選定の妥当性

**成功した選択**:
- **Vite**: 高速なHMR、開発体験向上
- **Zustand**: Reduxより簡潔、TypeScript親和性高い
- **Tailwind CSS**: 開発速度向上、デザイン一貫性

**課題のある選択**:
- **Cloudflare Workers**: ローカル開発環境の制約
- **HeadlessUI**: スタイリングの手間

## よくある問題と解決策

### 1. Module not found エラー

**原因と対策**:
```bash
# よくある原因
1. npm install未実行
2. import文のパス誤り
3. export形式の不一致（default vs named）

# 対策
npm install
npm ls <package-name>  # パッケージ確認
```

### 2. TypeScript型エラー

**頻出パターン**:
```typescript
// エラー: Property 'nameEn' does not exist
const name = category.nameEn;  // ❌

// 解決: 型ガード or オプショナルチェイン
const name = 'nameEn' in category ? category.nameEn : category.name;  // ✅
```

### 3. React Router二重ネスト

**問題コード**:
```tsx
// App.tsx
<BrowserRouter>
  <Routes>...</Routes>
</BrowserRouter>

// test file
render(
  <BrowserRouter>  // ❌ 二重ネスト！
    <App />
  </BrowserRouter>
);
```

## アンチパターン集

### 1. 「理論上動く」実装

**アンチパターン**:
- コードを書いて満足
- 実行せずに次のタスクへ
- 「たぶん動く」で済ませる

**正しいアプローチ**:
- 小さく作って頻繁にテスト
- 実際に画面で動作確認
- ユーザー視点での検証

### 2. 未使用コードの放置

**アンチパターン**:
```typescript
// 「後で使うかも」で残したコード
import { SortableDetailList } from './SortableDetailList';  // 未使用
import { dndkit } from '@dnd-kit/core';  // 未使用
```

**正しいアプローチ**:
- YAGNI原則の徹底
- 使わないものは即削除
- 必要になったら実装

### 3. エラーハンドリングの欠如

**アンチパターン**:
```typescript
// Happy pathのみ考慮
const data = await fetch('/api/data');
const json = await data.json();  // エラー時は？
```

**正しいアプローチ**:
```typescript
try {
  const data = await fetch('/api/data');
  if (!data.ok) throw new Error(`HTTP ${data.status}`);
  const json = await data.json();
} catch (error) {
  // 適切なエラーハンドリング
}
```

## 推奨プラクティス

### 1. 開発フローの標準化

```bash
# 新機能開発の標準フロー
1. git checkout -b feature/issue-number
2. npm install  # 依存関係確認
3. npm test     # 既存テスト確認
4. # TDDサイクル開始
   - テスト作成（Red）
   - 実装（Green）
   - リファクタリング（Refactor）
5. npm run dev  # 動作確認
6. git add . && git commit
7. gh pr create
```

### 2. コンポーネント設計原則

```typescript
// 良いコンポーネント設計
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

// 単一責任、明確なProps、拡張可能
export const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  onClick,
  children,
  disabled = false,
  className = '',
}) => {
  // 実装
};
```

### 3. テスト戦略

```typescript
// 1. ユニットテスト - ロジックの検証
describe('promptGenerator', () => {
  it('should generate prompt with category', () => {
    // Arrange
    const selections = { category: {...} };
    // Act
    const prompt = generatePrompt(selections);
    // Assert
    expect(prompt).toContain('expected text');
  });
});

// 2. 統合テスト - コンポーネント連携
describe('CategorySelection', () => {
  it('should update store on selection', () => {
    // コンポーネントとストアの連携テスト
  });
});

// 3. E2Eテスト - ユーザーシナリオ
describe('Prompt Creation Flow', () => {
  it('should complete full workflow', () => {
    // カテゴリ選択 → 詳細選択 → プロンプト生成
  });
});
```

### 4. パフォーマンス最適化の指針

1. **測定してから最適化**
   - Lighthouse定期実行
   - React DevToolsでレンダリング確認
   - バンドルサイズ監視

2. **早期の最適化ポイント**
   - 遅延読み込み（コード分割）
   - 画像最適化
   - 不要な再レンダリング防止

3. **避けるべき早すぎる最適化**
   - 過度なメモ化
   - マイクロ最適化
   - 可読性を犠牲にする最適化

## まとめ

このプロジェクトから得られた最大の教訓は、「速度と品質のバランス」の重要性です。初期の手抜きは必ず技術的負債となって返ってきます。以下を心がけることで、持続可能な開発が可能になります：

1. **基本に忠実に**: npm install、型チェック、動作確認
2. **小さく作って頻繁にテスト**: TDDの実践
3. **ドキュメント化**: 実装記録と感情ログの継続
4. **エラーから逃げない**: 早期発見・早期解決
5. **チーム全体の改善**: 個人の経験を共有知に

これらの教訓を活かし、より良い開発プロセスを構築していきましょう。