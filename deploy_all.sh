#!/bin/bash
set -e
KEY="/workspace/cba-air-cargo-agent/deploy_key"
HOST="root@43.159.50.213"
API="http://43.159.50.213/api"

echo "[1] Build frontend..."
cd /workspace/cba-air-cargo-agent/frontend
VITE_API_URL=$API npm run build 2>&1 | tail -3
echo "BUILD_OK"

echo "[2] Verify no localhost refs..."
LOCAL_COUNT=$(grep -o 'localhost:3000' /workspace/cba-air-cargo-agent/frontend/dist/assets/index.js | wc -l)
echo "localhost:3000 count: $LOCAL_COUNT (should be 0)"

echo "[3] Deploy to Tencent Cloud..."
# Clean old assets
ssh -i $KEY -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=20 $HOST "rm -rf /var/www/assets/* && echo CLEANED"

# Copy files
scp -i $KEY -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=60 \
  /workspace/cba-air-cargo-agent/frontend/dist/index.html \
  $HOST:/var/www/index.html

scp -i $KEY -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=120 \
  -r /workspace/cba-air-cargo-agent/frontend/dist/assets/* \
  $HOST:/var/www/assets/

ssh -i $KEY -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=15 $HOST "nginx -s reload && echo NGINX_RELOADED"

echo "[4] Verify deployment..."
RESULT=$(curl -s http://43.159.50.213/ | grep '<title>' | head -1)
echo "Title: $RESULT"
JS_FILE=$(ssh -i $KEY -o StrictHostKeyChecking=no -o BatchMode=yes $HOST "ls /var/www/assets/*.js | head -1" 2>/dev/null)
echo "JS: $JS_FILE"
curl -s http://43.159.50.213/api/health
echo ""

echo "[5] GitHub push..."
cd /workspace/cba-air-cargo-agent
git add -A
git commit -m "feat: CBA v5.0 - B767-300BCF layout, W&B envelope, ULD 3D, dark mode, collapsible menu [$(date +%Y-%m-%d)]"
GIT_SSH_COMMAND="ssh -i $KEY -o StrictHostKeyChecking=no" git push origin main 2>&1
echo "GITHUB_PUSH_OK"

echo "=== ALL DONE ==="
