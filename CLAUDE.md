# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## 🚨 最重要ルール - 必ず守ること 🚨

### 実装記録の絶対的義務

**これを守らないと全てが無意味になります。必ず以下の2つのログを更新してください：**

1. **実装記録ログ (`/docs/development/implementation-log.md`)**
   - 作業開始時に必ず記録
   - 作業終了時に必ず更新
   - 実施内容、完成物、課題を詳細に記録
   - 次回の作業予定を明確に記載

2. **感情ログ (`/docs/development/emotion-log.md`)**
   - エラーに遭遇したら即座に本音を記録
   - イライラ、疑問、不満を隠さず書く
   - 「は？」「なんで動かない」「クソ仕様」OK
   - マネジメント改善のための貴重なデータ

**⚠️ 警告: これらのログ更新を忘れたら、作業は「なかったこと」になります**

## Project Overview

This is a visual prompt builder project - a mock/prototype implementation for
creating and managing visual prompts.

## Development Setup

This is a new project directory. Common commands and architecture will be
documented here as the project develops.

### Claude Code Usage Analysis

Use ccusage to track token usage and costs:

```bash
# Quick start (no installation needed)
npx ccusage@latest

# Daily usage report
npx ccusage@latest daily

# Monthly aggregated report
npx ccusage@latest monthly

# Session-based usage tracking
npx ccusage@latest session

# Real-time monitoring dashboard
npx ccusage@latest blocks --live

# Date range filtering
npx ccusage@latest daily --since 20250525 --until 20250530

# JSON output for automation
npx ccusage@latest daily --json

# Per-model cost breakdown
npx ccusage@latest daily --breakdown
```

For more information: https://ccusage.com/

## Architecture

Project architecture will be documented here as components are implemented.

## Issue Management

When completing GitHub issues:

- **IMPORTANT**: Run `/clear` command before starting each new issue to keep the
  terminal clean
- Mark todos as completed as work progresses
- Close the GitHub issue when all tasks are finished
- Use `gh issue close <issue_number>` or close via GitHub web interface

## Development Rules (Based on t-wada's Recommendations)

### Test-Driven Development Approach

- Write tests for all new functionality
- Implement "Developer Testing" - code author writes tests on the same day
- Follow Red-Green-Refactor cycle when appropriate
- Goal: "Working Clean Code" - focus on both functionality and maintainability

### Task Management

- Break down complex tasks into smaller, manageable pieces
- Create TODO lists to identify functional requirements
- Verify code behavior immediately through tests
- Address complexity through simple, clear components that combine well

### Code Quality Principles

- Prioritize readability and understandability over ease of writing
- Design for users (readers) of the code, not just writers
- Maintain clear separation of responsibilities
- Use bottom-up design approach: start simple, then compose

### Practical Guidelines

- Tests must exist before code is considered complete
- Flexible on strict TDD - focus on having automated tests that remain
- Write tests as code (programmable tests)
- Ensure all changes have corresponding test coverage

## 📝 経験から学んだ追加ルール

### 必須作業フロー

1. **npm install を必ず実行**
   - コードを書く前に必ず依存関係をインストール
   - エラーを早期発見するため
   - VSCodeのTypeScriptサーバーを正常に動作させるため

2. **動作確認の徹底**
   - 実装後は必ず `npm run dev` で動作確認
   - テストだけでなく実際の画面で確認
   - ユーザー視点での検証を忘れない

3. **型定義の一貫性**
   - マスターデータと実装の型を必ず一致させる
   - name/nameEn/displayName などのプロパティ名を統一
   - TypeScriptの型チェックを最大限活用

4. **言語対応の統一性**
   - 言語切り替え機能は全コンポーネントで対応
   - デフォルト言語設定を明確に（日本向けアプリは日本語デフォルト）
   - 中途半端な実装は避ける

5. **品質と速度のバランス**
   - 速度優先でも最低限の品質チェックは必須
   - 「理論上動く」ではなく「実際に動く」を確認
   - 技術的負債を作らない意識

### テスト駆動開発の実践

- **赤→緑→リファクタリング**のサイクルを守る
- テストファースト：機能実装前にテストを書く
- モックデータと実データの整合性確保
- E2Eテストも含めた包括的なテスト

### コードレビューチェックリスト

- [ ] npm install実行済み
- [ ] 型定義の整合性確認
- [ ] 言語対応の一貫性確認
- [ ] テストの網羅性確認
- [ ] 実際の動作確認済み
- [ ] エラーハンドリング実装
- [ ] アクセシビリティ対応

### 反省から学ぶ姿勢

- 実装記録ログは詳細に記録
- 感情ログは本音で記録（マネジメント改善のため）
- 失敗から学び、同じミスを繰り返さない
- チーム全体の改善につなげる

### 技術的負債の管理

- TODOコメントは必ず Issue 化
- 未使用コードは即削除
- 設定ファイルの重複は避ける
- 空のディレクトリは作らない

## 📚 実装から得られた教訓と対策

### よく遭遇するエラーと対処法

1. **npm install 忘れ**
   - 症状: `Cannot find module` エラー
   - 対策: 作業開始時の最初のコマンドは必ず `npm install`

2. **型定義の不一致**
   - 症状: TypeScriptエラー、実行時エラー
   - 対策: マスターデータと実装の型を必ず一致させる
   - 特に注意: name/nameEn/displayName の混在

3. **Monorepo での依存関係エラー**
   - 症状: shared パッケージが見つからない
   - 対策: 全ディレクトリで npm install を実行

### 開発ワークフローの改善点

1. **動作確認の徹底**
   - テストだけでなく実際の画面で確認
   - `npm run dev` で即座に動作チェック
   - ユーザー視点での検証を忘れない

2. **速度と品質のバランス**
   - 「理論上動く」ではなく「実際に動く」を確認
   - 急いでいても基本的な品質チェックは必須
   - 技術的負債を作らない意識

### 技術的決定事項とその理由

1. **Monorepo構造**
   - 理由: 共通コンポーネントの再利用性向上
   - 注意点: 環境構築が複雑になる

2. **TypeScript の厳密な型チェック**
   - 理由: 実行時エラーの予防
   - 実践: unknown 型を活用した安全な型ガード

3. **TDD（テスト駆動開発）**
   - 理由: 結果的に開発速度が向上
   - 実践: 赤→緑→リファクタリングのサイクル

### 頻出する問題の回避方法

1. **言語切り替えの実装漏れ**
   - 全コンポーネントで一貫した実装
   - デフォルト言語を明確に設定

2. **エラーハンドリングの不足**
   - try-catch の適切な配置
   - ユーザーフレンドリーなエラーメッセージ

3. **テストの網羅性不足**
   - 正常系だけでなく異常系もテスト
   - エッジケースを意識

### ベストプラクティス集

1. **コミット前チェックリスト**
   - [ ] npm install 実行済み
   - [ ] 型定義の整合性確認
   - [ ] テスト全てパス
   - [ ] 実際の動作確認済み
   - [ ] 実装ログ・感情ログ更新

2. **コードレビューポイント**
   - 型安全性の確保
   - エラーハンドリングの適切性
   - テストカバレッジ
   - パフォーマンスへの配慮

### プロジェクト固有の注意事項

1. **Cloudflare Workers の制約**
   - Node.js API が使えない
   - Web標準APIのみ使用可能

2. **画像管理の方針**
   - Base64エンコード方式の採用
   - キャンバスAPIでの画像処理

3. **状態管理**
   - Zustand による簡潔な実装
   - 過度な最適化は避ける

### 3. 技術的決定事項とその理由

#### アーキテクチャ選定理由

1. **Monorepo構造（npm workspaces）**
   - 理由: 共有型定義の一元管理、依存関係の明確化
   - 注意: 初期設定の複雑さとのトレードオフ

2. **Cloudflare Workers採用**
   - 理由: エッジコンピューティング、グローバル配信
   - 注意: KV Namespaceの制限、ローカル開発環境の整備

3. **Zustand状態管理**
   - 理由: Reduxより簡潔、TypeScript親和性高い
   - 注意: 大規模化時のストア分割戦略

4. **Tailwind CSS**
   - 理由: 開発速度向上、デザインの一貫性
   - 注意: クラス名の長大化、学習コスト

### 4. 頻出する問題の回避方法

#### アンチパターンと対策

1. **「理論上動く」実装**
   - 問題: テストなし、動作確認なしでコード作成
   - 対策: 必ず実行して確認、小さく作って頻繁にテスト

2. **型定義の不整合**
   - 問題: displayName/name/nameEnの混在
   - 対策: マスターデータの型を基準に統一

3. **未使用コードの蓄積**
   - 問題: 「後で使うかも」で残したコード
   - 対策: YAGNI原則、使わないものは即削除

4. **エラーハンドリングの欠如**
   - 問題: Happy pathのみ実装
   - 対策: 最初からエラーケースを考慮

### 5. ベストプラクティス集

#### 実装時の推奨事項

1. **コンポーネント設計**
   - 単一責任の原則を守る
   - Props型定義を明確に
   - アクセシビリティを最初から考慮

2. **状態管理**
   - グローバル状態は最小限に
   - ローカル状態で済むものはローカルに
   - 永続化が必要なものは明確に分離

3. **テスト戦略**
   - ユニットテスト: ロジックの検証
   - 統合テスト: コンポーネント連携
   - E2Eテスト: ユーザーシナリオ

4. **パフォーマンス最適化**
   - 遅延読み込みは早期に実装
   - メモ化は測定してから適用
   - バンドルサイズを定期的に確認

### 6. プロジェクト固有の注意事項

#### Visual Prompt Builder特有の課題

1. **多言語対応**
   - 日本語デフォルト設定を忘れない
   - 全コンポーネントで言語切り替え対応
   - プロンプト生成は言語別ロジック

2. **カテゴリマスターデータ**
   - 144種類の詳細オプション管理
   - predefinedId経由でのアクセス推奨
   - カスタム入力との併用考慮

3. **アクセシビリティ要件**
   - 最小タッチターゲット44px
   - キーボードナビゲーション必須
   - スクリーンリーダー対応

4. **パフォーマンス目標**
   - 初回読み込み2秒以内
   - 早期から最適化を意識
   - Lighthouse定期チェック

### 7. 実装ログから学んだ重要な教訓（2025年1月更新）

#### セキュリティ最優先事項

1. **スタックトレースの露出防止**
   - 本番環境では絶対にスタックトレースを露出させない
   - 環境変数でdevelopment/productionを判定
   - エラーメッセージは最小限の情報のみ

2. **CORS設定の厳密化**
   - 許可するオリジンを明示的に指定
   - Credentialsを使用する場合は特に注意

#### 型定義の一貫性

1. **API通信での型の整合性**
   - フロントエンドとバックエンドで別の型を使用する場合は変換ユーティリティを作成
   - 例: Selection型 ↔ ApiSelectionItem型の変換
   - 型の不一致は実行時エラーの原因

2. **プロパティ名の統一**
   - name/nameEn/displayNameの混在を避ける
   - プロジェクト全体で一貫した命名規則

#### APIルーティングの理解

1. **Honoフレームワークの仕様**

   ```typescript
   // app.route('/api/v1/translation', translationRoute)
   // translationRoute.post('/trans')
   // 実際のパス: /api/v1/trans (NOT /api/v1/translation/trans)
   ```
   - ルートの登録パスとハンドラーパスの組み合わせに注意

2. **エンドポイントの文書化**
   - 実際のAPIパスを明確に文書化
   - デバッグ時はwranglerのログで確認

#### パフォーマンス最適化

1. **React依存配列の慎重な設定**
   - defaultValueなど不要な依存は除外
   - 無限ループや不要な再レンダリングを防ぐ

2. **削除機能の実装**
   - IDベースではなくorderベースで実装（同じIDの複数選択対応）
   - 削除後は必ずorderを再設定

#### エラーハンドリング

1. **ネットワークエラーの詳細な処理**
   - fetch呼び出しは必ずtry-catchでラップ
   - ユーザーフレンドリーなエラーメッセージ
   - フォールバック処理の実装

2. **翻訳APIのレスポンス形式**
   - 単一文字列か配列か、実際のレスポンスを確認
   - 型安全なレスポンス処理

#### 画像生成機能の実装指針

1. **プロバイダー選択**
   - 初期実装はReplicateで（コスト効率）
   - 複数プロバイダー対応のアーキテクチャ設計

2. **Cloudflare Workers制約への対応**
   - Base64エンコード方式の採用
   - KVストレージでのキャッシュ（24時間）
   - Web標準APIのみ使用
