# 開発ワークフローのベストプラクティス

Visual Prompt Builderプロジェクトの経験から導き出された、効率的で品質の高い開発を実現するためのワークフローガイドです。

## 目次

1. [開発開始前の準備](#開発開始前の準備)
2. [日々の開発フロー](#日々の開発フロー)
3. [コーディング実践](#コーディング実践)
4. [テスト駆動開発](#テスト駆動開発)
5. [コードレビュー](#コードレビュー)
6. [トラブルシューティング](#トラブルシューティング)

## 開発開始前の準備

### 1. 環境セットアップチェックリスト

```bash
# 新規参画時の必須手順
□ リポジトリのクローン
  git clone <repository-url>
  cd visual-prompt-builder

□ 依存関係のインストール（最重要！）
  npm install

□ 環境変数の設定
  cp .env.example .env
  # 必要な値を設定

□ 開発サーバーの起動確認
  npm run dev

□ テストの実行確認
  npm test

□ TypeScriptの型チェック
  npm run type-check

□ Lintの実行
  npm run lint
```

### 2. VSCode推奨設定

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

必須拡張機能:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- Error Lens（エラーをインラインで表示）

## 日々の開発フロー

### 1. Issue駆動開発のワークフロー

```bash
# 1. 作業開始前
/clear  # ターミナルをクリア（見落としがちだが重要）

# 2. Issue確認
gh issue view <issue-number>

# 3. ブランチ作成
git checkout main
git pull origin main
git checkout -b feature/issue-<number>-brief-description

# 4. 実装記録ログに記載
# docs/development/implementation-log.md を更新
# - 作業開始時刻
# - 取り組むIssue
# - 予定作業内容

# 5. 開発作業
# （後述のTDDフロー参照）

# 6. コミット
git add .
git commit -m "feat: implement category selection (#<issue-number>)"

# 7. プッシュ & PR作成
git push origin feature/issue-<number>
gh pr create --fill

# 8. 実装記録ログを完了状態に更新
# - 完了時刻
# - 実施内容
# - 次回の作業予定
```

### 2. コミットメッセージ規約

```bash
# フォーマット: <type>: <subject> (#<issue-number>)

# type:
# - feat: 新機能
# - fix: バグ修正
# - docs: ドキュメントのみの変更
# - style: コードの意味に影響しない変更（空白、フォーマット等）
# - refactor: バグ修正や機能追加を伴わないコード変更
# - test: テストの追加・修正
# - chore: ビルドプロセスやツールの変更

# 例:
git commit -m "feat: add category selection component (#20)"
git commit -m "fix: resolve type error in prompt generator (#25)"
git commit -m "test: add unit tests for user store (#30)"
```

## コーディング実践

### 1. TypeScript実装のベストプラクティス

```typescript
// ❌ 避けるべきパターン
const data: any = fetchData();  // any型の使用
const name = data.name;  // 型チェックなし

// ✅ 推奨パターン
interface UserData {
  name: string;
  email: string;
}

const data: UserData = await fetchData();
const name = data.name;  // 型安全
```

### 2. React コンポーネントの実装

```typescript
// ❌ 避けるべきパターン
export function Button({ onClick, children, ...props }) {
  return <button onClick={onClick} {...props}>{children}</button>;
}

// ✅ 推奨パターン
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  onClick,
  children,
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
}) => {
  return (
    <button
      className={cn(
        buttonVariants({ variant, size }),
        className
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};
```

### 3. 状態管理の実装

```typescript
// Zustand ストアの実装パターン
interface StoreState {
  // State
  items: Item[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchItems: () => Promise<void>;
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;
  clearError: () => void;
}

const useStore = create<StoreState>((set, get) => ({
  // Initial state
  items: [],
  loading: false,
  error: null,
  
  // Actions
  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const items = await api.getItems();
      set({ items, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false 
      });
    }
  },
  
  addItem: (item) => {
    set((state) => ({ items: [...state.items, item] }));
  },
  
  removeItem: (id) => {
    set((state) => ({ 
      items: state.items.filter(item => item.id !== id) 
    }));
  },
  
  clearError: () => set({ error: null }),
}));
```

## テスト駆動開発

### 1. TDDの実践フロー

```bash
# Red → Green → Refactor サイクル

# 1. Red: 失敗するテストを書く
npm test -- --watch CategorySelection.test.tsx

# 2. Green: テストを通す最小限の実装
# 3. Refactor: コードを改善（テストは通ったまま）
```

### 2. テスト実装例

```typescript
// ユニットテスト例
describe('promptGenerator', () => {
  it('should generate prompt with all selections', () => {
    // Arrange
    const selections: PromptSelections = {
      category: {
        predefinedId: 'landscape',
        displayName: '風景',
      },
      details: [
        {
          predefinedId: 'mountain',
          displayName: '山',
        },
      ],
      color: {
        value: '#0000FF',
        displayName: '青',
      },
    };
    
    // Act
    const prompt = generatePrompt(selections);
    
    // Assert
    expect(prompt).toContain('landscape');
    expect(prompt).toContain('mountain');
    expect(prompt).toContain('blue color scheme');
  });
  
  it('should handle custom text inputs', () => {
    // カスタムテキストのテストケース
  });
  
  it('should handle empty selections gracefully', () => {
    // エッジケースのテスト
  });
});
```

### 3. 統合テスト例

```typescript
describe('Category Selection Flow', () => {
  it('should update store when category is selected', async () => {
    // Arrange
    const { getByText, getByRole } = render(<CategorySelection />);
    
    // Act
    const landscapeButton = getByText('風景');
    await userEvent.click(landscapeButton);
    
    // Assert
    expect(getByRole('button', { name: '次へ' })).not.toBeDisabled();
    expect(usePromptStore.getState().selections.category).toEqual({
      predefinedId: 'landscape',
      displayName: '風景',
    });
  });
});
```

## コードレビュー

### 1. セルフレビューチェックリスト

PR作成前に必ず確認:

```markdown
## セルフレビューチェックリスト

- [ ] `npm install` を実行して依存関係を確認
- [ ] `npm run type-check` でTypeScriptエラーがない
- [ ] `npm run lint` でLintエラーがない
- [ ] `npm test` で全テストが通る
- [ ] `npm run dev` で実際に動作確認済み
- [ ] 新機能にはテストを追加
- [ ] ドキュメントを更新（必要な場合）
- [ ] 実装記録ログを更新
- [ ] 不要なconsole.logを削除
- [ ] TODOコメントはIssue化
```

### 2. レビュー観点

レビュアーが確認すべきポイント:

1. **機能性**
   - 要件を満たしているか
   - エッジケースの考慮
   - エラーハンドリング

2. **保守性**
   - コードの可読性
   - 適切な命名
   - 複雑度の管理

3. **パフォーマンス**
   - 不要な再レンダリング
   - 大きなバンドルサイズ
   - N+1問題

4. **セキュリティ**
   - XSS対策
   - 入力値検証
   - 機密情報の扱い

## トラブルシューティング

### 1. 問題解決のアプローチ

```bash
# 1. エラーメッセージを正確に読む
# エラーの核心部分を特定

# 2. 最小再現コードを作成
# 問題を単純化して原因を特定

# 3. ログを活用
console.log('Current state:', state);
console.log('Type:', typeof value);
console.log('Keys:', Object.keys(obj));

# 4. 一時的にTypeScriptを無効化
// @ts-ignore（最終手段）

# 5. 公式ドキュメントを確認
# Stack Overflowより公式ドキュメント優先
```

### 2. よくある問題のクイックフィックス

```bash
# TypeScriptエラーが消えない
rm -rf node_modules/.cache
npm run type-check

# 開発サーバーが起動しない
lsof -ti:5173 | xargs kill  # ポート解放
npm run dev

# テストが失敗する
npm test -- --clearCache
npm test

# Git操作を取り消したい
git reset --soft HEAD~1  # 直前のコミット取り消し
git checkout .           # 全変更を破棄
```

### 3. 感情ログの活用

問題に直面したら感情ログに記録:

```markdown
### 2025-01-25 15:30 - TypeScriptエラーと格闘

また型エラー。なんで`nameEn`が存在しないって言われるんだよ。
あ、そうか。Selectionにはdisplaynameしかないのか。
マスターデータと混同してた。

解決策: predefinedId経由でマスターデータにアクセス
学び: 型定義は最初に全部確認すべき
```

## 継続的改善

### 1. 振り返りの実施

スプリント終了時:
- うまくいったこと
- 改善が必要なこと
- 次に試すこと

### 2. ドキュメントの更新

新しい知見が得られたら:
- CLAUDE.mdに追記
- このガイドを更新
- チームに共有

### 3. ツールの最適化

定期的に見直し:
- 依存関係のアップデート
- 開発ツールの改善
- ワークフローの自動化

## まとめ

効率的な開発の鍵は「基本に忠実であること」です：

1. **準備を怠らない**: npm install、環境設定
2. **小さく作る**: 1-2時間で完了する単位
3. **頻繁に確認**: 型チェック、テスト、動作確認
4. **記録を残す**: 実装ログ、感情ログ、ドキュメント
5. **改善を続ける**: 振り返り、学習、共有

これらの実践により、品質と速度を両立した開発が可能になります。