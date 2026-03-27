#!/bin/bash
# CBA v5.0 一键部署脚本
# 用法: bash /workspace/cba-air-cargo-agent/deploy.sh
set -e

KEY="/workspace/cba-air-cargo-agent/deploy_key"
HOST="root@43.159.50.213"
API="http://43.159.50.213/api"

echo "[1/5] 构建前端..."
cd /workspace/cba-air-cargo-agent/frontend
VITE_API_URL=$API npm run build 2>&1 | tail -2
echo "BUILD_OK"

echo "[2/5] 部署到腾讯云 — 清理旧资源..."
ssh -i $KEY -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=30 $HOST \
  "rm -rf /var/www/assets/* && mkdir -p /var/www/assets && echo CLEANED"

echo "[3/5] 上传 index.html..."
scp -i $KEY -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=60 \
  /workspace/cba-air-cargo-agent/frontend/dist/index.html \
  $HOST:/var/www/index.html
echo "index.html OK"

echo "[4/5] 上传 assets..."
scp -i $KEY -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=120 \
  -r /workspace/cba-air-cargo-agent/frontend/dist/assets/* \
  $HOST:/var/www/assets/
echo "assets OK"

echo "[5/5] 重载 nginx..."
ssh -i $KEY -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=20 $HOST \
  "nginx -s reload && echo NGINX_RELOADED"

echo ""
echo "=== 验证 ==="
curl -s http://43.159.50.213/ | grep -o '<title>[^<]*</title>'
curl -s http://43.159.50.213/api/health
echo ""
echo "=== GitHub Push ==="
cd /workspace/cba-air-cargo-agent
git add -A
git commit -m "deploy: [$(date +%Y-%m-%d)]"
GIT_SSH_COMMAND="ssh -i $KEY -o StrictHostKeyChecking=no" \
  git push origin main 2>&1
echo "=== ALL DONE ==="
