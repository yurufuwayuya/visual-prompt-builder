#!/usr/bin/env node

/**
 * R2 S3 API アップロードテストスクリプト
 *
 * 使用方法:
 * 1. R2アクセスキーを環境変数に設定
 *    export R2_ACCESS_KEY_ID="your-access-key"
 *    export R2_SECRET_ACCESS_KEY="your-secret-key"
 *
 * 2. スクリプトを実行
 *    node test-r2-upload.js
 */

import { AwsClient } from 'aws4fetch';

// 設定
const CONFIG = {
  // 開発環境のエンドポイント
  DEV_ENDPOINT:
    process.env.R2_DEV_ENDPOINT ||
    'https://your-account-id.r2.cloudflarestorage.com/prompt-builder-dev',
  // 本番環境のエンドポイント
  PROD_ENDPOINT:
    process.env.R2_PROD_ENDPOINT ||
    'https://your-account-id.r2.cloudflarestorage.com/prompt-builder',
  // テスト用画像（1x1の透明PNG）
  TEST_IMAGE:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
};

/**
 * データURLをUint8Arrayに変換
 */
function dataURLToUint8Array(dataURL) {
  const base64 = dataURL.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * R2にテスト画像をアップロード
 */
async function testR2Upload(environment = 'dev') {
  console.log(`\n=== R2 S3 API Upload Test (${environment}) ===\n`);

  // 環境変数チェック
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    console.error('❌ エラー: R2認証情報が設定されていません');
    console.error('以下のコマンドで環境変数を設定してください:');
    console.error('export R2_ACCESS_KEY_ID="your-access-key"');
    console.error('export R2_SECRET_ACCESS_KEY="your-secret-key"');
    process.exit(1);
  }

  // エンドポイントとバケット名を取得
  const endpoint = environment === 'prod' ? CONFIG.PROD_ENDPOINT : CONFIG.DEV_ENDPOINT;
  const urlParts = endpoint.split('/');
  const bucketName = urlParts[urlParts.length - 1];
  const baseUrl = urlParts.slice(0, -1).join('/');

  console.log(`📍 エンドポイント: ${endpoint}`);
  console.log(`🪣 バケット: ${bucketName}`);

  // AWS4クライアントを作成
  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    region: 'auto',
    service: 's3',
  });

  // テスト画像を準備
  const imageData = dataURLToUint8Array(CONFIG.TEST_IMAGE);
  const timestamp = Date.now();
  const testKey = `test/r2-upload-test-${timestamp}.png`;

  console.log(`\n📤 アップロードテスト開始...`);
  console.log(`🔑 キー: ${testKey}`);

  try {
    // 1. アップロード
    const uploadUrl = `${baseUrl}/${bucketName}/${testKey}`;
    console.log(`📎 URL: ${uploadUrl}`);

    const uploadResponse = await client.fetch(uploadUrl, {
      method: 'PUT',
      body: imageData,
      headers: {
        'Content-Type': 'image/png',
        'x-amz-meta-test': 'true',
        'x-amz-meta-timestamp': timestamp.toString(),
      },
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} - ${error}`);
    }

    console.log(`✅ アップロード成功!`);
    console.log(`   ETag: ${uploadResponse.headers.get('etag')}`);

    // 2. オブジェクトの存在確認（HEAD）
    console.log(`\n🔍 オブジェクト確認中...`);

    const headResponse = await client.fetch(uploadUrl, {
      method: 'HEAD',
    });

    if (headResponse.ok) {
      console.log(`✅ オブジェクト確認成功!`);
      console.log(`   Content-Type: ${headResponse.headers.get('content-type')}`);
      console.log(`   Content-Length: ${headResponse.headers.get('content-length')} bytes`);
    } else {
      console.log(`❌ オブジェクト確認失敗: ${headResponse.status}`);
    }

    // 3. 削除
    console.log(`\n🗑️  クリーンアップ中...`);

    const deleteResponse = await client.fetch(uploadUrl, {
      method: 'DELETE',
    });

    if (deleteResponse.ok || deleteResponse.status === 204) {
      console.log(`✅ 削除成功!`);
    } else {
      console.log(`⚠️  削除失敗: ${deleteResponse.status}`);
    }

    console.log(`\n🎉 テスト完了! R2 S3 APIは正常に動作しています。`);
  } catch (error) {
    console.error(`\n❌ テスト失敗:`, error.message);
    console.error(`\n📝 トラブルシューティング:`);
    console.error(`1. R2 APIトークンの権限を確認（Object Read & Write が必要）`);
    console.error(`2. バケット名が正しいか確認`);
    console.error(`3. エンドポイントURLが正しいか確認`);
    process.exit(1);
  }
}

// コマンドライン引数から環境を取得
const environment = process.argv[2] || 'dev';

if (!['dev', 'prod'].includes(environment)) {
  console.error('❌ 無効な環境: ' + environment);
  console.error('使用方法: node test-r2-upload.js [dev|prod]');
  process.exit(1);
}

// テスト実行
testR2Upload(environment).catch(console.error);
