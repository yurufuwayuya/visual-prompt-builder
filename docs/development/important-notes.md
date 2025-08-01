# 重要な注意事項まとめ

このファイルは、プロジェクト進行中に受けた重要な指示や注意点をまとめたものです。
開発時は常にこのファイルを参照し、ルールを遵守すること。

## 作業進行ルール

### 1. イシュー処理の基本ルール
- **一つずつ完了**: イシューは必ず一つずつ完了させる（並行作業禁止）
- **ログ更新必須**: 各イシュー完了時に以下を必ず更新
  - `/docs/development/implementation-log.md`
  - `/docs/development/emotion-log.md`
- **ターミナルクリア**: 新しいイシューに取り掛かる前に必ず `/clear` を実行

### 2. 記録の重要性
- **注意事項の記録**: 重要な注意点は必ずドキュメントに記録
- **決定事項の記録**: 技術的な決定や変更は理由と共に記録
- **問題点の記録**: 発生した問題と解決策を詳細に記録

### 3. 疑問点の解決（2025-06-25追加）
- **疑問や注意点は放置しない**: 発見した疑問点はそのままにせず、解決するまで深く考察（think hard）する
- **調査と検証**: 疑問点は必ず調査し、根拠を持って判断する
- **解決策の記録**: 疑問点とその解決策は必ず記録に残す

## プロジェクト固有の注意事項

### 1. ターゲットユーザーの特殊性
- **利用者**: 就労継続支援B型事業所の障害を持つ方
- **用途**: ジグソーパズル製造用の画像生成
- **最優先事項**: 
  - アクセシビリティ（WCAG 2.1 Level AA準拠）
  - 使いやすさ（大きなボタン、分かりやすいUI）
  - エラー時の親切な対応

### 2. 技術的制約
- **Git権限**: commitコマンドの実行権限なし
- **ディレクトリ構造**: visual-prompt-builder内に別のgitリポジトリ存在
- **実行環境**: Cloudflare Workers（Node.js APIは使用不可）
- **ストレージ**: LocalStorage使用（プライバシー保護のため）

### 3. 開発方針（CLAUDE.mdより抜粋）
- **npm install必須**: 作業開始時に必ず実行
- **動作確認必須**: 「理論上動く」は禁止
- **TDD実践**: テスト駆動開発を守る
- **型定義統一**: name/nameEn/displayName問題を避ける

## 品質管理チェックリスト

### 各イシュー完了時の確認事項
- [ ] npm install を実行したか
- [ ] テストを書いたか
- [ ] テストが通るか確認したか
- [ ] 実際に動作確認したか
- [ ] 型エラーがないか確認したか
- [ ] アクセシビリティを考慮したか
- [ ] 実装ログを更新したか
- [ ] 感情ログを更新したか

## 更新履歴
- 2025-06-25: 初版作成（Issue #1-3完了時の注意事項をまとめ）