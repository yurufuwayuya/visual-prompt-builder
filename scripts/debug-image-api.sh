#!/bin/bash

# 本番環境のAPIエンドポイントをテストするスクリプト
# Replicateのレスポンスが正しく処理されているか確認

API_URL="https://visual-prompt-builder.yakyu.workers.dev/api/v1/image/generate"

# テスト用のリクエストボディ
REQUEST_BODY='{
  "prompt": "test image generation",
  "model": "default",
  "provider": "replicate",
  "parameters": {}
}'

echo "Testing image generation API..."
echo "URL: $API_URL"
echo "Request body:"
echo "$REQUEST_BODY"
echo ""
echo "Sending request..."
echo "===================="

# APIリクエストを送信（詳細なレスポンスを表示）
response=$(curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "$REQUEST_BODY" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s)

echo "$response"
echo ""
echo "===================="

# レスポンスからJSONを抽出（HTTPステータス行を除く）
json_response=$(echo "$response" | head -n -2)

# JSONの解析とBase64データの確認
if command -v jq &> /dev/null; then
  echo "Parsing response..."
  echo "$json_response" | jq '.'
  
  # 成功した場合、画像データの情報を表示
  if echo "$json_response" | jq -e '.success == true' > /dev/null 2>&1; then
    echo ""
    echo "Success! Checking image data..."
    image_data=$(echo "$json_response" | jq -r '.image')
    if [ -n "$image_data" ] && [ "$image_data" != "null" ]; then
      # Base64データの最初の50文字を表示
      echo "Image data (first 50 chars): ${image_data:0:50}..."
      echo "Image data length: ${#image_data}"
      
      # data:image/png;base64, プレフィックスがあるか確認
      if [[ $image_data == data:image/* ]]; then
        echo "Image has correct data URI format"
      else
        echo "WARNING: Image data might not have correct format"
      fi
    else
      echo "ERROR: No image data in response"
    fi
    
    # キャッシュ情報
    cached=$(echo "$json_response" | jq -r '.cached')
    echo "Cached: $cached"
  else
    echo ""
    echo "Error in response:"
    echo "$json_response" | jq '.error'
  fi
else
  echo "jq not installed, showing raw response:"
  echo "$json_response"
fi