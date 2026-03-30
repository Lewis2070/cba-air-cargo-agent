#!/bin/bash
#====================================================================
# CBA v5.1 自动化测试脚本
# 用法: bash /workspace/cba-air-cargo-agent/test_automation.sh
# 返回码: 0=全部通过, 1=有失败项
#====================================================================
HOST="http://43.159.50.213"
SSH_KEY="/workspace/cba-air-cargo-agent/deploy_key"
SSH_HOST="root@43.159.50.213"
PASS=0
FAIL=0
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

pass() { echo -e "${GREEN}✅ PASS${NC}  $1"; ((PASS++)); }
fail() { echo -e "${RED}❌ FAIL${NC}  $1"; ((FAIL++)); }
info() { echo -e "${BLUE}ℹ️  INFO${NC} $1"; }

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   CBA Air Cargo v5.1 自动化测试脚本          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ─── 预检：服务器连通性 ────────────────────────────────────────────────
info "Step 0: 服务器连通性检查"

if curl -s --max-time 8 "$HOST/" -o /dev/null; then
  pass "服务器 HTTP 端口可达 ($HOST)"
else
  fail "服务器 HTTP 端口不可达 ($HOST)"
  echo -e "${RED}请检查服务器是否在线${NC}"
  exit 1
fi

if curl -s --max-time 8 "$HOST/api/health" | grep -q "ok"; then
  pass "后端 API Health 检查正常"
else
  fail "后端 API Health 检查失败"
fi

# ─── Test 1: 首页能访问 ────────────────────────────────────────────────
info "Test 1: 首页访问 (/)"
HTTP_CODE=$(curl -s --max-time 10 -o /tmp/cba_index.html "$HOST/" -w "%{http_code}")
if [ "$HTTP_CODE" = "200" ]; then
  pass "首页返回 200 OK"
else
  fail "首页返回 $HTTP_CODE (期望 200)"
fi

# ─── Test 2: 页面标题正确 ───────────────────────────────────────────────
info "Test 2: 页面标题验证"
TITLE=$(grep -o '<title>[^<]*</title>' /tmp/cba_index.html 2>/dev/null | head -1)
if echo "$TITLE" | grep -q "CBA Air Cargo"; then
  pass "页面标题包含 'CBA Air Cargo': $TITLE"
else
  fail "页面标题异常: $TITLE"
fi

# ─── Test 3: JS 资源存在且可加载 ──────────────────────────────────────
info "Test 3: JS 资源存在性"
JS_URL=$(curl -s --max-time 10 "$HOST/" | grep -o '/assets/index\.js' | head -1)
if [ -n "$JS_URL" ]; then
  FULL_URL="${HOST}${JS_URL#/}"
  JS_CODE=$(curl -s --max-time 15 -o /tmp/cba_index.js "$FULL_URL" -w "%{http_code}")
  if [ "$JS_CODE" = "200" ] && [ -s /tmp/cba_index.js ]; then
    JS_SIZE=$(wc -c < /tmp/cba_index.js)
    pass "JS 资源存在且可加载 ($((JS_SIZE/1024))KB)"
    # 检查关键代码片段
    if grep -q "LoadPlanningPage\|AircraftHoldPanel\|uld_specs" /tmp/cba_index.js 2>/dev/null; then
      pass "JS 包含 LoadPlanningPage 相关代码"
    else
      fail "JS 未包含 LoadPlanningPage 代码（可能被错误构建）"
    fi
  else
    fail "JS 资源加载失败 (HTTP $JS_CODE)"
  fi
else
  fail "未找到 index JS 资源"
fi

# ─── Test 4: API Health ─────────────────────────────────────────────────
info "Test 4: 后端 API Health"
HEALTH=$(curl -s --max-time 8 "$HOST/api/health")
if echo "$HEALTH" | grep -q '"ok"\|"status"'; then
  pass "API Health: $HEALTH"
else
  fail "API Health 异常: $HEALTH"
fi

# ─── Test 5: 登录接口可用 ──────────────────────────────────────────────
info "Test 5: 登录接口 (/api/auth/login)"
LOGIN_RESP=$(curl -s --max-time 10 -X POST "$HOST/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cba.com","password":"Admin@2026"}')
if echo "$LOGIN_RESP" | grep -q '"token"\|"user"'; then
  TOKEN=$(echo "$LOGIN_RESP" | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')
  pass "登录成功，Token 获取正常"
  [ -n "$TOKEN" ] && info "Token: ${TOKEN:0:20}..."
else
  fail "登录失败: $LOGIN_RESP"
fi

# ─── Test 6: 登录页显示版本号 ─────────────────────────────────────────
info "Test 6: 登录页版本号 (V5.2)"
LOGIN_HTML=$(curl -s --max-time 10 "$HOST/")
if echo "$LOGIN_HTML" | grep -q "V5.2"; then
  pass "登录页包含版本号 V5.2"
else
  fail "登录页未包含版本号 V5.2"
fi

if echo "$LOGIN_HTML" | grep -q "CBA Air Cargo"; then
  pass "登录页包含系统名称 'CBA Air Cargo'"
else
  fail "登录页未包含系统名称"
fi

# ─── Test 7: 主要页面路由可访问（HTTP 200） ─────────────────────────────
info "Test 7: 主要路由可访问性"
ROUTES=(
  "/"
  "/dashboard"
  "/cargo"
  "/load-planning"
  "/flights"
  "/revenue"
  "/bookings"
)
for route in "${ROUTES[@]}"; do
  CODE=$(curl -s --max-time 8 -o /dev/null -w "%{http_code}" -L "$HOST$route")
  if [ "$CODE" = "200" ]; then
    pass "路由 $route → 200 OK"
  else
    fail "路由 $route → $CODE (期望 200)"
  fi
done

# ─── Test 8: 腾讯云服务器文件完整性 ──────────────────────────────────
info "Test 8: 腾讯云部署文件完整性"
REMOTE_FILES=$(ssh -i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=10 "$SSH_HOST" \
  "ls -la /var/www/index.html /var/www/assets/index.js /var/www/assets/index.css 2>&1" 2>/dev/null)
if echo "$REMOTE_FILES" | grep -q "index.html"; then
  pass "腾讯云 /var/www/index.html 存在"
else
  fail "腾讯云 index.html 不存在"
fi

REMOTE_JS_SIZE=$(ssh -i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=10 "$SSH_HOST" \
  "wc -c < /var/www/assets/index.js 2>/dev/null" 2>/dev/null || echo "0")
if [ "$REMOTE_JS_SIZE" -gt 500000 ]; then
  pass "腾讯云 JS 文件正常 ($((REMOTE_JS_SIZE/1024))KB)"
else
  fail "腾讯云 JS 文件异常 ($REMOTE_JS_SIZE bytes)"
fi

# ─── Test 9: nginx 进程正常运行 ─────────────────────────────────────
info "Test 9: nginx 进程状态"
NGINX_COUNT=$(ssh -i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=10 "$SSH_HOST" \
  "ps aux | grep nginx | grep -v grep | wc -l" 2>/dev/null)
ssh -i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=10 "$SSH_HOST" "nginx -v 2>&1" > /dev/null 2>&1
if [ -n "$NGINX_COUNT" ] && [ "$NGINX_COUNT" -gt 0 ]; then
  pass "nginx 进程正常运行"
else
  fail "nginx 进程异常"
fi

# ─── Test 10: 关键组件代码验证（本地构建） ──────────────────────────────
info "Test 10: 关键组件代码存在性"
LOCAL_FILES=(
  "/workspace/cba-air-cargo-agent/frontend/src/pages/LoadPlanningPage.tsx:dgr_rules"
  "/workspace/cba-air-cargo-agent/frontend/src/pages/LoadPlanningPage.tsx:uld_serial"
  "/workspace/cba-air-cargo-agent/frontend/src/pages/LoginPage.tsx:V5.2"
  "/workspace/cba-air-cargo-agent/frontend/src/data/dgr_rules.ts:DGR_SEGREGATION"
  "/workspace/cba-air-cargo-agent/frontend/src/data/hold_positions.ts:HOLD_POSITIONS"
  "/workspace/cba-air-cargo-agent/frontend/src/data/uld_specs.ts:ULD_TYPES"
)
for item in "${LOCAL_FILES[@]}"; do
  FILE=$(echo "$item" | cut -d: -f1)
  TOKEN=$(echo "$item" | cut -d: -f2)
  if [ -f "$FILE" ]; then
    if grep -q "$TOKEN" "$FILE" 2>/dev/null; then
      pass "本地文件 $FILE 包含 '$TOKEN'"
    else
      fail "本地文件 $FILE 未包含 '$TOKEN'"
    fi
  else
    fail "本地文件不存在: $FILE"
  fi
done

# ─── Test 11: 无 localhost 硬编码（dist） ──────────────────────────────
info "Test 11: dist/index.js 无 localhost 硬编码"
if [ -f /tmp/cba_index.js ]; then
  LOCALHOST_COUNT=$(grep -o 'localhost:3000' /tmp/cba_index.js | wc -l)
  if [ "$LOCALHOST_COUNT" = "0" ]; then
    pass "dist/index.js 无 localhost:3000 硬编码"
  else
    fail "dist/index.js 包含 $LOCALHOST_COUNT 处 localhost:3000"
  fi
fi

# ─── 结果汇总 ─────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║              测试结果汇总                     ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo -e "  ${GREEN}✅ 通过: $PASS${NC}"
echo -e "  ${RED}❌ 失败: $FAIL${NC}"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}🎉 全部测试通过！可以上线部署。${NC}"
  exit 0
else
  echo -e "${RED}⚠️  $FAIL 项测试失败，请修复后再部署。${NC}"
  exit 1
fi
