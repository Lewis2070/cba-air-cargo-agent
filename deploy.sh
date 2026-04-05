#!/bin/bash
# CBA Air Cargo - 腾讯云部署脚本
# 用法:
#   bash deploy.sh uat        → 部署到 UAT (http://43.159.50.213:8080)
#   bash deploy.sh production → 部署到生产 (http://43.159.50.213)
#
# 前置检查：部署前必须通过 CORS nginx 层检查
# 后置验证：部署后必须通过 preflight CORS 验证

set -e

KEY="/workspace/cba-air-cargo-agent/deploy_key"
HOST="root@43.159.50.213"
REPO_DIR="/workspace/cba-air-cargo-agent"
API="http://43.159.50.213/api"

TARGET="${1:-production}"

# ─────────────────────────────────────────────
# 前置检查：nginx 禁止设置任何 Access-Control header
# （铁律：CORS 只能后端处理，nginx 纯转发）
# ─────────────────────────────────────────────
echo "=== [前置检查] nginx CORS 安全检查 ==="
SSH="ssh -i $KEY -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=20"

CORS_VIOLATIONS=$($SSH $HOST "
  echo '检查所有 nginx site 配置...'
  for f in /etc/nginx/sites-available/* /etc/nginx/sites-enabled/*; do
    if grep -l 'add_header.*Access-Control' \$f 2>/dev/null; then
      echo \"VIOLATION: \$f\"
      grep 'add_header.*Access-Control' \$f
    fi
  done | grep VIOLATION || echo 'NONE'
" 2>&1)

if echo "$CORS_VIOLATIONS" | grep -q "VIOLATION"; then
  echo "🔴 部署中止：发现 nginx 层违规设置 CORS header！"
  echo "$CORS_VIOLATIONS"
  echo "修复方法：删除 nginx 配置中所有 add_header.*Access-Control 行，然后重载 nginx"
  exit 1
else
  echo "✅ nginx CORS 前置检查通过（无违规 add_header）"
fi

# ─────────────────────────────────────────────
# 部署逻辑
# ─────────────────────────────────────────────
if [[ "$TARGET" == "uat" ]]; then
  ASSETS_DIR="/var/www/assets-uat"
  PORT=8080
  ORIGIN="http://43.159.50.213:8080"
  echo "=== 部署目标：UAT (port 8080) ==="

  # UAT 自动注入：版本号 + 日期 + 变更日志（由 inject_version.sh 完成）
  # inject_version.sh 会同时更新 LoginPage.tsx 和 index.html 模板
  echo "[0/7] UAT 自动注入版本信息..."
  bash $REPO_DIR/scripts/inject_version.sh \
    "V5.4.1" \
    "DGR冲突告警：Fullscreen3D顶部红色Tips栏；IATA 16个class全规则覆盖"
  echo "VERSION_INJECTED"

elif [[ "$TARGET" == "production" ]]; then
  ASSETS_DIR="/var/www/assets"
  PORT=80
  ORIGIN="http://43.159.50.213"
  echo "=== 部署目标：生产 (port 80) ==="
  # ⚠️ 生产环境：禁止自动注入，必须由人工静态更新 LoginPage.tsx
  echo "⚠️ 生产部署：VERSION/BUILD_DATE/CHANGELOG 需人工确认已更新"
else
  echo "用法: bash deploy.sh <uat|production>"
  exit 1
fi

echo "[1/7] 构建前端 (API=$API)..."
cd $REPO_DIR/frontend
VITE_API_URL=$API npm run build 2>&1 | tail -3
echo "BUILD_OK"

echo "[2/7] 腾讯云 — 清理旧资源..."
$SSH $HOST "rm -rf $ASSETS_DIR/* && mkdir -p $ASSETS_DIR/assets && echo CLEANED:$ASSETS_DIR"

echo "[3/7] 上传 index.html..."
scp -i $KEY -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=60 \
  $REPO_DIR/frontend/dist/index.html \
  $HOST:/var/www/index.html
# UAT 需要复制一份到 assets-uat
if [[ "$TARGET" == "uat" ]]; then
  $SSH $HOST "cp /var/www/index.html $ASSETS_DIR/index.html && echo 'uat-index-copied'"
fi
echo "index.html OK"

echo "[4/7] 上传 assets → $ASSETS_DIR ..."
scp -i $KEY -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=120 \
  -r $REPO_DIR/frontend/dist/assets/* \
  $HOST:$ASSETS_DIR/assets/
echo "assets OK"

echo "[5/7] 重载 nginx..."
$SSH $HOST "nginx -s reload && echo NGINX_RELOADED"

# ─────────────────────────────────────────────
# 后置验证：Preflight CORS 验证（模拟浏览器真实行为）
# ─────────────────────────────────────────────
echo "[6/7] CORS preflight 验证（模拟浏览器 OPTIONS 请求）..."

PREFLIGHT_RESP=$(curl -s --max-time 8 -i -X OPTIONS \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  "http://${HOST#*@}$PORT/api/health" 2>&1)

# 提取 Access-Control-Allow-Origin 头的数量（不重复为1，有重复则>1）
AC_HEADER_COUNT=$(echo "$PREFLIGHT_RESP" | grep -i "Access-Control-Allow-Origin" | wc -l)
AC_HEADER_VALUE=$(echo "$PREFLIGHT_RESP" | grep -i "Access-Control-Allow-Origin" | head -1 | tr -d '\r')
HTTP_CODE=$(echo "$PREFLIGHT_RESP" | grep "HTTP/" | head -1)

echo "HTTP 状态: ${HTTP_CODE:-<未获取>}"
echo "CORS 头  : ${AC_HEADER_VALUE:-<未获取>}"

if [[ "$AC_HEADER_COUNT" -gt 1 ]]; then
  echo "🔴 CORS preflight 验证失败：发现 ${AC_HEADER_COUNT} 个 Access-Control-Allow-Origin 头（重复！）"
  echo "常见原因：nginx 层和后端同时设置了 CORS header"
  echo "修复：删除 nginx 配置中所有 add_header.*Access-Control 行"
  exit 1
elif echo "$PREFLIGHT_RESP" | grep -qi "Access-Control-Allow-Origin.*\*"; then
  echo "🔴 CORS preflight 验证失败：后端返回通配符 * （与 credentials 不兼容）"
  exit 1
elif echo "$PREFLIGHT_RESP" | grep -qi "HTTP/1.1 204\|HTTP/2 204"; then
  echo "✅ CORS preflight 验证通过"
else
  echo "⚠️ CORS preflight 响应异常，请人工检查"
fi

# 页面基础验证
TITLE=$(curl -s --max-time 8 "http://${HOST#*@}$PORT/" | grep -o '<title>[^<]*</title>' | head -1)
echo "页面标题: ${TITLE:-<未获取>}"

echo ""
echo "=== 部署完成 ($TARGET) ==="
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
