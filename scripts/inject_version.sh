#!/bin/bash
# inject_version.sh - 自动更新 LoginPage.tsx + index.html 版本信息
# 用法: bash scripts/inject_version.sh <新版本号> <变更说明>
# 示例: bash scripts/inject_version.sh "V5.4.1" "DGR冲突告警：Fullscreen3D顶部红色Tips栏"

set -e

NEW_VERSION="$1"
CHANGE_NOTE="${2:-常规更新}"
TODAY=$(date +%Y-%m-%d)

if [ -z "$NEW_VERSION" ]; then
  echo "用法: bash scripts/inject_version.sh <新版本号> [变更说明]"
  exit 1
fi

LOGIN_PAGE="frontend/src/pages/LoginPage.tsx"
INDEX_HTML="frontend/index.html"
APP_TSX="frontend/src/App.tsx"

# 1. 替换 LoginPage.tsx 的 VERSION
sed -i "s/const VERSION = '[^']*'/const VERSION = '$NEW_VERSION'/" "$LOGIN_PAGE"

# 2. 替换 LoginPage.tsx 的 BUILD_DATE
sed -i "s/const BUILD_DATE = '[^']*'/const BUILD_DATE = '$TODAY'/" "$LOGIN_PAGE"

# 3. 在 CHANGELOG 数组开头追加新条目
INSERT_LINE="  { version: '$NEW_VERSION', date: '$TODAY', note: '$CHANGE_NOTE' },"
sed -i "/const CHANGELOG = \[/a\\$INSERT_LINE" "$LOGIN_PAGE"

# 4. 替换 index.html 的 <title>
sed -i "s|<title>CBA Air Cargo [^<]*</title>|<title>CBA Air Cargo $NEW_VERSION - 国际货运智能管理系统</title>|" "$INDEX_HTML"

# 5. 替换 index.html 的 <meta name="version">
sed -i "s|<meta name=\"version\" content=\"[^\"]*\"|<meta name=\"version\" content=\"$NEW_VERSION\"|" "$INDEX_HTML"

# 6. 替换 App.tsx 的 Header 硬编码版本 Tag
sed -i "s/>V[0-9]\+\.[0-9]\+\.[0-9]\+</>${NEW_VERSION}</" "$APP_TSX"

echo "✅ 版本注入完成: $NEW_VERSION ($TODAY)"
echo "   变更: $CHANGE_NOTE"
