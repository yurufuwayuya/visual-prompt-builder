#!/bin/bash

# Development secrets setup script for Visual Prompt Builder

echo "=== Visual Prompt Builder - 開発環境のシークレット設定 ==="
echo ""
echo "このスクリプトは開発環境用の.envファイルを作成します。"
echo "本番環境では 'wrangler secret put' を使用してください。"
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .envファイルが既に存在します。"
    read -p "上書きしますか？ (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "キャンセルしました。"
        exit 0
    fi
fi

# Copy from example
cp .env.example .env

echo ""
echo "以下の情報を入力してください："
echo ""

# Replicate API Key
echo "1. Replicate APIキー"
echo "   取得方法: https://replicate.com/account"
read -p "   APIキー (r8_xxxxx): " REPLICATE_KEY
if [ ! -z "$REPLICATE_KEY" ]; then
    sed -i.bak "s/your_replicate_api_key/$REPLICATE_KEY/" .env
fi

# OpenAI API Key (optional)
echo ""
echo "2. OpenAI APIキー (オプション - Enterでスキップ)"
echo "   取得方法: https://platform.openai.com/api-keys"
read -p "   APIキー (sk-xxxxx): " OPENAI_KEY
if [ ! -z "$OPENAI_KEY" ]; then
    sed -i.bak "s/your_openai_api_key/$OPENAI_KEY/" .env
fi

# Stability API Key (optional)
echo ""
echo "3. Stability AI APIキー (オプション - Enterでスキップ)"
echo "   取得方法: https://platform.stability.ai/account/keys"
read -p "   APIキー: " STABILITY_KEY
if [ ! -z "$STABILITY_KEY" ]; then
    sed -i.bak "s/your_stability_api_key/$STABILITY_KEY/" .env
fi

# Image Provider
echo ""
echo "4. 使用する画像生成プロバイダー"
echo "   選択肢: replicate, openai, stability"
read -p "   プロバイダー (デフォルト: replicate): " IMAGE_PROVIDER
if [ -z "$IMAGE_PROVIDER" ]; then
    IMAGE_PROVIDER="replicate"
fi
sed -i.bak "s/IMAGE_PROVIDER=replicate/IMAGE_PROVIDER=$IMAGE_PROVIDER/" .env

# Clean up backup files
rm -f .env.bak

echo ""
echo "✅ .envファイルの作成が完了しました！"
echo ""
echo "次のステップ:"
echo "1. npm run dev:all で開発サーバーを起動"
echo "2. http://localhost:5173 にアクセス"
echo "3. 画像生成機能をテスト"
echo ""
echo "⚠️  重要: .envファイルは絶対にGitにコミットしないでください！"