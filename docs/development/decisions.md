# 技術的意思決定記録 (ADR - Architecture Decision Records)

このファイルは、プロジェクトにおける重要な技術的意思決定を記録します。

## ADRフォーマット

```
### ADR-XXX: タイトル
**日付**: YYYY-MM-DD
**ステータス**: 提案中 | 承認済み | 却下 | 置き換え済み
**決定者**: @username

#### コンテキスト
なぜこの決定が必要なのか、背景情報

#### 決定事項
実際に決定した内容

#### 選択肢
検討した他の選択肢

#### 結果
この決定によって期待される結果や影響

#### 参考情報
関連するリンクやドキュメント
```

---

## 意思決定記録

### ADR-001: デプロイ先をCloudflare Workersに変更
**日付**: 2024-12-25
**ステータス**: 承認済み
**決定者**: @yurufuwayuya

#### コンテキスト
当初AWS/Vercelでのデプロイを検討していたが、より良いパフォーマンスとコスト効率を求めて再検討。

#### 決定事項
- フロントエンド: Cloudflare Pages
- バックエンド: Cloudflare Workers
- データストア: KV Storage / D1 Database
- フレームワーク: Hono (Workers最適化)

#### 選択肢
1. AWS Lambda + S3 + CloudFront
2. Vercel (Next.js)
3. Cloudflare Workers + Pages

#### 結果
- グローバルエッジでの低遅延配信
- 無料枠が充実（10万リクエスト/日）
- エッジでのデータ処理による高速化
- 統一されたプラットフォームでの運用

#### 参考情報
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev/)

---

### ADR-002: モノレポ構造の採用
**日付**: 2024-12-25
**ステータス**: 承認済み
**決定者**: Claude

#### コンテキスト
フロントエンド、バックエンド、共有コードを効率的に管理する必要がある。

#### 決定事項
npm workspacesを使用したモノレポ構造：
- `/frontend` - React アプリケーション
- `/workers` - Cloudflare Workers API
- `/shared` - 共有型定義・定数

#### 選択肢
1. 個別リポジトリ
2. npm/yarn workspaces
3. Lerna
4. Nx

#### 結果
- 型定義の共有が容易
- 依存関係の一元管理
- CI/CDの簡略化
- 開発環境の統一

#### 参考情報
- [npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces)

---

### ADR-003: 状態管理にZustandを採用
**日付**: 2024-12-25
**ステータス**: 承認済み
**決定者**: Claude

#### コンテキスト
Reactアプリケーションでのグローバル状態管理が必要。

#### 決定事項
Zustandを状態管理ライブラリとして採用。

#### 選択肢
1. Redux Toolkit
2. MobX
3. Zustand
4. Jotai
5. Context API のみ

#### 結果
- 学習曲線が緩やか
- バンドルサイズが小さい（8KB）
- TypeScriptとの相性が良い
- DevToolsサポート

#### 参考情報
- [Zustand GitHub](https://github.com/pmndrs/zustand)

---