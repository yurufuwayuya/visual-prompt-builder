#!/bin/bash

# Cloudflare Workers APIサーバーを起動
echo "Starting Cloudflare Workers API server..."
cd workers && npm run dev &
WORKER_PID=$!

# フロントエンドサーバーを起動
echo "Starting frontend server..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "Development servers started!"
echo "Worker API: http://localhost:8787"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"

# Ctrl+Cで両方のプロセスを終了
trap 'kill $WORKER_PID $FRONTEND_PID' INT

# プロセスが終了するまで待機
wait