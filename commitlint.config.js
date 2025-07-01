module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新機能
        'fix',      // バグ修正
        'docs',     // ドキュメント
        'style',    // フォーマット、セミコロン追加など
        'refactor', // リファクタリング
        'perf',     // パフォーマンス改善
        'test',     // テスト
        'chore',    // ビルドプロセスやツールの変更
        'revert',   // コミットの取り消し
        'build',    // ビルドシステムの変更
        'ci',       // CI設定の変更
      ],
    ],
    'subject-case': [0], // 日本語対応のため無効化
  },
};