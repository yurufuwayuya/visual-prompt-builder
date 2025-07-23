#!/usr/bin/env node

/**
 * R2 S3 API アップロードテストスクリプト（開発環境用）
 * .dev.varsファイルから設定を読み込む
 */

import { AwsClient } from 'aws4fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .dev.varsファイルを読み込む
function loadDevVars() {
  const devVarsPath = path.join(__dirname, '.dev.vars');
  if (!fs.existsSync(devVarsPath)) {
    console.error('❌ エラー: .dev.varsファイルが見つかりません');
    process.exit(1);
  }

  const content = fs.readFileSync(devVarsPath, 'utf-8');
  const vars = {};

  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        vars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return vars;
}

// 設定を読み込む
const devVars = loadDevVars();

const CONFIG = {
  // 開発環境のエンドポイント
  DEV_ENDPOINT:
    'https://1b154d8dab68e47be1d8dc7734f1d802.r2.cloudflarestorage.com/prompt-builder-dev',
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
async function testR2Upload() {
  console.log(`\n=== R2 S3 API Upload Test (dev) ===\n`);

  // 環境変数チェック
  const accessKeyId = devVars.R2_ACCESS_KEY_ID;
  const secretAccessKey = devVars.R2_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    console.error('❌ エラー: R2認証情報が.dev.varsに設定されていません');
    process.exit(1);
  }

  // エンドポイントとバケット名を取得
  const endpoint = CONFIG.DEV_ENDPOINT;
  const urlParts = endpoint.split('/');
  const bucketName = urlParts[urlParts.length - 1];
  const baseUrl = urlParts.slice(0, -1).join('/');

  console.log(`📍 エンドポイント: ${endpoint}`);
  console.log(`🪣 バケット: ${bucketName}`);
  console.log(`🔑 Access Key ID: ${accessKeyId.substring(0, 8)}...`);

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

    console.log(`📡 レスポンスステータス: ${uploadResponse.status}`);

    if (uploadResponse.ok) {
      console.log('✅ アップロード成功！');
    } else {
      const errorText = await uploadResponse.text();
      console.error('❌ アップロード失敗:', errorText);
      return;
    }

    // 2. オブジェクトの存在確認
    console.log(`\n🔍 オブジェクトの存在確認...`);
    const headResponse = await client.fetch(uploadUrl, {
      method: 'HEAD',
    });

    if (headResponse.ok) {
      console.log('✅ オブジェクトが存在します');
      console.log(`📏 Content-Length: ${headResponse.headers.get('content-length')}`);
      console.log(`📝 Content-Type: ${headResponse.headers.get('content-type')}`);
    } else {
      console.error('❌ オブジェクトが見つかりません');
    }

    // 3. 削除
    console.log(`\n🗑️ テストファイルを削除...`);
    const deleteResponse = await client.fetch(uploadUrl, {
      method: 'DELETE',
    });

    if (deleteResponse.ok || deleteResponse.status === 204) {
      console.log('✅ 削除成功！');
    } else {
      console.error('❌ 削除失敗');
    }

    console.log(`\n✨ R2 S3 API テスト完了！`);
    console.log('R2への接続が正常に動作しています。');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// メイン実行
testR2Upload().catch(console.error);
