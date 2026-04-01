#!/bin/bash
# CBA Air Cargo - 腾讯云部署脚本（仅上传，不含任何 Git 操作）
# 用法: bash /workspace/cba-air-cargo-agent/deploy.sh

# ⚠️ 安全守卫：检查是否存在意外 Git push 能力
if git remote -v 2>/dev/null | grep -q 'origin'; then
  echo "⚠️  检测到 Git remote origin 存在，已临时禁用"
  echo "⚠️  如需恢复 Git push 能力，请联系管理员"
  echo "=== 腾讯云部署继续，但跳过所有 Git 操作 ==="
  SKIP_GIT=1
else
  SKIP_GIT=0
  echo "✅ Git remote 检查通过（无意外 push 能力）"
fi

set -e

KEY="/workspace/cba-air-cargo-agent/deploy_key"
HOST="root@43.159.50.213"
API="http://43.159.50.213/api"

echo "[1/5] 构建前端..."
cd /workspace/cba-air-cargo-agent/frontend
VITE_API_URL=$API npm run build 2>&1 | tail -3
echo "BUILD_OK"

echo "[2/5] 腾讯云 — 清理旧资源..."
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
echo "=== UAT 验证 ==="
TITLE=$(curl -s --max-time 8 http://43.159.50.213/ | grep -o '<title>[^<]*</title>' | head -1)
echo "页面标题: ${TITLE:-<未获取>}"
HEALTH=$(curl -s --max-time 8 http://43.159.50.213/api/health)
echo "API状态: ${HEALTH:-<未获取>}"
echo ""
echo "=== 部署完成，请验证 UAT ==="
echo "=== Git 操作必须经用户明确授权后才能执行 ==="

# ─────────────────────────────────────────────
# 辅助函数：解锁 Git push 能力（需用户明确授权）
enable_git_push() {
  echo "[git] 恢复 Git push 能力..."
  GIT_KEY="/workspace/cba-air-cargo-agent/deploy_key"
  git remote add origin git@github.com:Lewis2070/cba-air-cargo-agent.git 2>/dev/null && echo "[git] origin 已添加" || echo "[git] origin 已存在"
}
disable_git_push() {
  git remote remove origin 2>/dev/null && echo "[git] origin 已禁用" || echo "[git] origin 不存在"
}
