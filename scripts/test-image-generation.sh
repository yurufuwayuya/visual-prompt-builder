#!/bin/bash

# Test script for image generation API

echo "=== 画像生成API テストスクリプト ==="
echo ""

# Check if server is running
if ! curl -s http://localhost:8787/health > /dev/null; then
    echo "❌ APIサーバーが起動していません"
    echo "   'npm run dev:worker' でAPIサーバーを起動してください"
    exit 1
fi

echo "✅ APIサーバーが起動しています"
echo ""

# Test image (small base64 encoded 1x1 pixel PNG)
TEST_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

# Create test request
REQUEST_BODY=$(cat <<EOF
{
  "image": "$TEST_IMAGE",
  "prompt": "A beautiful landscape painting",
  "model": "variations",
  "strength": 0.7
}
EOF
)

echo "画像生成APIをテストしています..."
echo ""

# Make API request
RESPONSE=$(curl -s -X POST http://localhost:8787/api/v1/image/generate \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d "$REQUEST_BODY")

# Check response
if echo "$RESPONSE" | grep -q '"error"'; then
    echo "❌ エラーが発生しました:"
    echo "$RESPONSE" | jq -r '.error'
    echo ""
    echo "考えられる原因:"
    echo "- REPLICATE_API_KEYが設定されていない"
    echo "- APIキーが無効"
    echo "- ネットワーク接続の問題"
    echo ""
    echo "解決方法:"
    echo "1. scripts/setup-dev-secrets.sh を実行して環境変数を設定"
    echo "2. サーバーを再起動 (Ctrl+C で停止後、npm run dev:all)"
    exit 1
fi

if echo "$RESPONSE" | grep -q '"generatedImage"'; then
    echo "✅ 画像生成APIが正常に動作しています！"
    echo ""
    echo "レスポンス:"
    echo "$RESPONSE" | jq '.'
else
    echo "❓ 予期しないレスポンス:"
    echo "$RESPONSE"
fi