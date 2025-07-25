# 納品前最終チェックリスト

## 機能確認

### 基本機能
- [ ] カテゴリ選択が正常に動作する
- [ ] カスタムカテゴリ入力が機能する
- [ ] 詳細選択が最大5個まで制限される
- [ ] 選択順序が表示される
- [ ] スタイル選択が反映される
- [ ] プロンプトが正しく生成される
- [ ] 日本語/英語切り替えが動作する
- [ ] コピー機能が動作する

### データ永続化
- [ ] 自動保存（30秒間隔）が動作する
- [ ] ページリロード後もデータが復元される
- [ ] ストレージ容量表示が正確
- [ ] 容量超過時の警告が表示される

### UI/UX
- [ ] モバイル表示が適切（320px〜）
- [ ] タブレット表示が適切（768px〜）
- [ ] デスクトップ表示が適切（1024px〜）
- [ ] タッチ操作が快適
- [ ] アニメーションがスムーズ
- [ ] ローディング表示が適切

### アクセシビリティ
- [ ] キーボードのみで操作可能
- [ ] スクリーンリーダー対応
- [ ] 色のコントラストが十分
- [ ] フォーカス表示が明確
- [ ] エラーメッセージが分かりやすい

## 技術確認

### ビルド・デプロイ
- [ ] プロダクションビルドが成功する
- [ ] バンドルサイズが適切（< 500KB）
- [ ] 環境変数が正しく設定されている
- [ ] CI/CDパイプラインが動作する

### パフォーマンス
- [ ] 初回読み込み3秒以内
- [ ] ページ遷移がスムーズ
- [ ] メモリリークがない
- [ ] 不要な再レンダリングがない

### エラーハンドリング
- [ ] ネットワークエラー時の表示
- [ ] 予期しないエラー時の復旧
- [ ] エラー境界が機能する

### セキュリティ
- [ ] XSS対策
- [ ] HTTPS通信
- [ ] 適切なCSPヘッダー

## ドキュメント

### 開発者向け
- [ ] README.mdが最新
- [ ] インストール手順が明確
- [ ] API仕様書が完備
- [ ] デプロイ手順が明確

### 利用者向け
- [ ] ユーザーマニュアルが完備
- [ ] よくある質問（FAQ）
- [ ] トラブルシューティング

## 品質保証

### テスト
- [ ] 単体テストがパスする
- [ ] 統合テストがパスする
- [ ] E2Eテスト（手動）完了
- [ ] 複数ブラウザで動作確認

### コード品質
- [ ] ESLintエラーなし
- [ ] TypeScriptエラーなし
- [ ] コードフォーマット統一
- [ ] 不要なconsole.logなし

## 納品物

### ソースコード
- [ ] Gitリポジトリ整備
- [ ] 不要ファイル削除
- [ ] .envファイルの扱い確認

### 成果物
- [ ] ビルド済みファイル一式
- [ ] デプロイ設定ファイル
- [ ] ドキュメント一式

### 引き継ぎ
- [ ] 管理者権限の移譲
- [ ] APIキーの引き継ぎ
- [ ] 運用手順書

## 最終確認

- [ ] 要件定義書の全項目を満たしている
- [ ] 非機能要件を満たしている
- [ ] 想定される利用シーンで問題なく動作する
- [ ] 将来の拡張性が考慮されている

---

確認日: ____年____月____日
確認者: ________________