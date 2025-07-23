/* eslint-disable no-console */
// リセット機能の動作確認スクリプト

const baseUrl = 'http://localhost:5174';

async function testResetFunction() {
  console.log('リセット機能のテストを開始します...');

  // 1. プロンプトビルダーページにアクセス
  console.log(`アクセス中: ${baseUrl}/builder`);

  // テスト手順
  console.log('\n=== 手動テスト手順 ===');
  console.log('1. ブラウザで http://localhost:5174/builder を開く');
  console.log('2. カテゴリ（例：ポートレート）を選択');
  console.log('3. 「次へ」をクリック');
  console.log('4. 詳細を選択（例：笑顔、カジュアル）');
  console.log('5. 「次へ」をクリック');
  console.log('6. スタイル設定を行う（色、スタイル、雰囲気、照明）');
  console.log('7. 「プロンプトを生成」をクリック');
  console.log('8. プロンプトが生成されることを確認');
  console.log('9. 「リセット」ボタンをクリック');
  console.log('10. 確認ダイアログで「OK」をクリック');
  console.log('\n=== 期待される動作 ===');
  console.log('- ページが最上部にスクロールされる');
  console.log('- カテゴリの選択がクリアされる');
  console.log('- ステップ2〜4がグレーアウトされる');
  console.log('- 生成されたプロンプトがクリアされる');
  console.log('\n=== 確認ポイント ===');
  console.log('- ResultStepのローカルステートもリセットされているか');
  console.log('- エラーが発生していないか');
}

testResetFunction();
