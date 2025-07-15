#!/bin/bash
set -euo pipefail  # Exit on error, undefined variables, and pipe failures

# Development environment setup script
# Maps REPLICATE_API_KEY to IMAGE_API_KEY for wrangler

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ wranglerがインストールされていません"
    echo "   npm install -g wrangler を実行してください"
    exit 1
fi

echo "=== 開発環境の環境変数設定 ==="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .envファイルが見つかりません"
    echo "   scripts/setup-dev-secrets.sh を実行してください"
    exit 1
fi

# Source .env file safely
set -a
source .env
set +a

# Map REPLICATE_API_KEY to IMAGE_API_KEY for wrangler
if [ -n "${REPLICATE_API_KEY:-}" ]; then
    export IMAGE_API_KEY="${REPLICATE_API_KEY}"
    echo "✅ IMAGE_API_KEY を設定しました"
else
    echo "⚠️  REPLICATE_API_KEY が設定されていません"
fi

# Start wrangler with environment variables
echo ""
echo "Wranglerを起動しています..."
exec wrangler dev