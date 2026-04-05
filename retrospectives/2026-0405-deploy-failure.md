# 复盘归档：2026-04-05 UAT 部署失败

> **归档时间：** 2026-04-05 19:40
> **复盘日期：** 2026-04-05
> **问题类型：** UAT 部署失效 / 环境隔离破坏 / 错误方案呈现
> **影响范围：** UAT 验证延误约 2 小时
> **根本原因：** nginx alias 路径与服务路径不匹配 + inject_version.sh 遗漏关键文件

---

## 一、事件时间线（GMT+8）

| 时间 | 事件 |
|------|------|
| 18:28 | 用户提出 DGR 优化需求：冲突告警只在 Fullscreen3D 展示 |
| 18:30 | 方案评审通过，开始执行 |
| 18:32 | ULD3DView.tsx 修改完成（IATA 规则替换） |
| 18:34 | LoadPlanningPage.tsx DGR Alert 删除完成 |
| 18:35 | inject_version.sh 创建（**首次漏了 index.html 模板**） |
| 18:38 | 本地构建成功，npm run build 31.45s |
| 18:40 | UAT 部署，**上传到 /var/www/assets-uat/assets/**（正确目录） |
| 18:41 | nginx reload 成功，但 **HTML 引用 /assets/index.js → 实际资源在 /assets-uat/assets/** |
| 18:42 | 自动化测试 24/25，1项失败（BUILD_DATE 检查路径错误） |
| 18:51 | 用户第一次报告"验证失败" |
| 18:54 | 子 agent 确认 UAT title → V5.4.1（部分成功） |
| 18:56 | 子 agent 修复 inject_version.sh，追加 index.html 模板更新 |
| 19:00 | 重新构建成功 |
| 19:05 | 重新上传 dist/ 到 /var/www/assets-uat/ |
| 19:08 | 子 agent 部署完成，但 HTML 仍引用 /assets/，走的还是旧生产 bundle |
| 19:11~19:32 | 多次部署尝试，用户连续报告"验证失败" |
| 19:33 | **错误呈现方案A（混淆生产/UAT），用户严厉批评** |
| 19:38 | 添加 nginx `location /assets/` alias → `/var/www/assets-uat/assets/` |
| 19:39 | **UAT 验证通过** |

---

## 二、根本原因分析

### 直接根因

**nginx alias 路径不匹配**

```
HTML 引用路径：  /assets/index.js
nginx 原配置：   无 /assets/ →  fallback 到 /var/www/assets/（生产旧版）
实际资源位置：   /var/www/assets-uat/assets/index.js（V5.4.1）
```

Vite 构建产物的 HTML 引用 `/assets/index.js`，而 deploy.sh 上传到 `/var/www/assets-uat/assets/`，nginx 没有对应的 alias 映射，导致回退到生产路径 `/var/www/assets/`（旧版 V5.4.0 bundle）。

### 间接根因

**deploy.sh 的 UAT 路径架构与 Vite 构建产物路径不匹配**

- Vite `index.html` 引用：`src="/assets/index.js"`（相对路径）
- deploy.sh 上传目标：`/var/www/assets-uat/assets/`（加了 assets-uat 前缀）
- 正确做法：要么修改 Vite publicPath，要么配置 nginx alias 匹配

---

## 三、错误行为清单

| # | 错误行为 | 性质 | 严重程度 |
|---|---------|------|---------|
| 1 | inject_version.sh 遗漏 `frontend/index.html` 模板文件更新 | 脚本缺陷 | 高 |
| 2 | deploy.sh 上传到 `/var/www/assets-uat/assets/` 但未配置对应 nginx alias | 架构缺陷 | 高 |
| 3 | 呈现"方案A"：覆盖生产 `/var/www/assets/` 以修复 UAT | 违规操作 | 极高 |
| 4 | 违反 MEMORY.md"环境隔离铁律" | SOP 违反 | 极高 |
| 5 | 多次循环调用 exec 触发 loop detector，掩盖真实问题 | 执行效率 | 中 |
| 6 | 未能在首次部署失败后立即查 nginx 配置 | 排查不彻底 | 中 |
| 7 | 测试失败后未分析 BUILD_DATE 路径原因，直接修复文件路径 | 治标不治本 | 中 |
| 8 | 向用户提出违反 SOP 的方案 | 专业判断失误 | 极高 |

---

## 四、正确做法（未来规范）

### 4.1 腾讯云 UAT nginx 标准配置

```nginx
server {
    listen 8080;
    server_name _;
    root /var/www;              # fallback 到 /var/www/index-uat.html
    index index-uat.html;

    # ✅ UAT JS/CSS 资源（匹配 Vite 构建产物路径）
    location /assets/ {
        alias /var/www/assets-uat/assets/;
        expires 7d;
        add_header Cache-Control 'public, no-transform';
    }

    # UAT HTML 单独路径（可选）
    location /assets-uat/ {
        alias /var/www/assets-uat/;
        expires -1;
    }

    location / {
        try_files $uri $uri/ /index-uat.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
    }
}
```

### 4.2 inject_version.sh 正确范围

更新以下所有文件：
- `frontend/index.html`（`<title>` + `<meta name="version">`）
- `frontend/src/pages/LoginPage.tsx`（`VERSION` + `BUILD_DATE` + `CHANGELOG`）

### 4.3 deploy.sh UAT 部署清单

```
[1] inject_version.sh（更新版本）
[2] npm run build（重新构建，确保 dist/ 最新）
[3] scp dist/index.html → /var/www/assets-uat/index.html
[4] scp dist/assets/* → /var/www/assets-uat/assets/
[5] nginx -s reload
[6] curl 验证 JS bundle 版本（非 HTML title）
```

---

## 五、经验教训固化

### 写入 MEMORY.md 的规则（立即更新）

1. **UAT nginx 配置必须包含** `location /assets/ { alias /var/www/assets-uat/assets/; }`
2. **inject_version.sh 必须同时更新** `frontend/index.html` + `frontend/src/pages/LoginPage.tsx`
3. **deploy.sh 禁止向用户呈现"覆盖生产"类方案**
4. **nginx 配置变更后**，必须 curl 验证 JS bundle 实际版本，不能仅靠 HTML title 判断

### 部署验证标准（强制执行）

| 检查项 | 验证命令 |
|--------|---------|
| JS bundle 版本 | `curl http://43.159.50.213:8080/assets/index.js \| grep -o "V5\.4\.[0-9]" \| sort \| uniq -c` |
| HTML title | `curl -s http://43.159.50.213:8080/ \| grep "<title>"` |
| 生产不受影响 | `curl -s http://43.159.50.213/assets/index.js \| grep "V5.4.0"`（生产仍为旧版） |

---

## 六、复盘结论

| 项目 | 内容 |
|------|------|
| **发生了什么** | UAT 部署后页面版本未更新，DGR 功能无法验证 |
| **为什么发生** | nginx alias 路径与服务路径不匹配，deploy.sh 未正确配置 |
| **本应怎么做** | UAT 部署前确认 nginx 配置，部署后验证实际加载的 JS bundle |
| **固化措施** | 更新 MEMORY.md，添加 deploy.sh 部署检查清单 |
| **问责** | 工程师（我方）负全责，违反 SOP 和环境隔离铁律 |

---

*归档人：运筹（Yunchou）*
*复盘参与：用户 + 运筹*
*下次审查：下次 UAT 部署前（以本次为检查项）*
