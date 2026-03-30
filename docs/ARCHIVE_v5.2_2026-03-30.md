# CBA Air Cargo — 设计文档归档

> 归档日期：2026-03-30
> 版本：v5.2.1
> 状态：已上线生产

---

## 📋 归档文档清单

| 文件 | 版本 | 日期 | 内容概要 |
|------|------|------|---------|
| `排舱系统v5.1开发方案.md` | v5.1 | 2026-03-27 | DGR规则引擎、W&B六线包线图、AI排舱、3D ULD可视化 |
| `排舱系统v5.0开发方案.md` | v5.0 | 2026-03-26 | B767-300BCF货舱配置（M/N/L舱位）、IATA ULD代码 |
| `排舱系统v4.0优化方案.md` | v4.0 | 2026-03-24 | 排舱核心算法、货位分配策略 |
| `研发计划v3.0.md` | v3.0 | 2026-03-22 | 研发路线图、第三阶段规划 |
| `研发计划V2.0_系统实现阶段.md` | v2.0 | 2026-03-11 | 第二阶段功能模块分解 |
| `P3进度报告.md` | P3 | 2026-03-11 | 第三阶段进度报告 |

---

## 🏗️ 已上线功能（v5.2.1）

### 核心功能
- ✅ **AI 一键排舱** — 按收入（chargeableWeight × fee）降序贪心分配，支持 DGR 隔离
- ✅ **W&B 六线包线图** — SVG 实现，主舱限制线/下舱限制线/鼻舱，显示 CG 实时位置
- ✅ **DGR 危险品隔离规则** — IATA DGR 67th Edition，16 类隔离规则，3 类互斥检测
- ✅ **货舱布局** — M1-M11 主舱、N1-N2 鼻舱、L1-L12 下舱，拖放分配
- ✅ **ULD 3D 可视化** — 点击卡片打开 3D 模态框，0~720° 旋转滑块，preserve-3d CSS
- ✅ **ConfirmModal 确认环节** — AI/手动两种模式，收益/CG/DGR 警告汇总

### 组件架构
```
LoadPlanningPage
├── CargoListPanel         ← 货物表格（可拖拽）
├── ULDBuildPanel          ← ULD 组板工作台
│   └── ULD3DView          ← 3D ULD 可视化（compact 模式）
├── AircraftHoldWithSwap   ← 货舱布局（拖放排舱）
│   └── WnBChart           ← W&B 六线包线图
└── ConfirmModal           ← 排舱确认弹窗

独立页面：
├── LoginPage              ← 登录（V5.2 版本信息）
├── DashboardPage          ← 仪表盘
├── BookingListPage        ← 订舱管理
├── FlightListPage         ← 航班管理
└── DGRCompliancePage     ← DGR 合规检查
```

### 数据模型
- `hold_positions.ts` — M1-M11、N1-N2、L1-L12，含 arm_mac_pct
- `uld_specs.ts` — LD-6(Q6)/LD-7(Q7)/LD-3(AKE)，含最大载重/容积
- `dgr_rules.ts` — 3 类互斥表（酸性/碱性/毒性）、隔离组别

---

## 🔑 技术决策记录

### 决策 1：为什么不直接更新腾讯云 /var/www/assets？
**原因：** 之前多次 deploy.sh 的 scp 上传因网络超时失败。  
**解决方案：** 使用 CDN 作为中转 —— `deploy` 工具 → CDN → `curl -L` 到腾讯云。

### 决策 2：为什么不合并两段式 LoadPlanningPage 源码？
**原因：** write 工具 22KB 限制。  
**解决方案：** 写入两个文件后 cat 合并，这是最稳定的方式。

### 决策 3：为什么 CDN bundle 里找不到 aiPack 字符串？
**原因：** Terser minifier 将函数名 `aiPack` 压缩为单字符变量名。  
**验证方法：** `extract_content_from_websites` 工具可解析压缩 JS 内容，确认 `智能排舱`、`LD-6`、`LD-3` 等业务关键字存在。

### 决策 4：GitHub SSH push 失败
**原因：** 腾讯云 SSH 端口 22 被限制；GitHub HTTPS 需要 token。  
**解决方案：** 需配置 GitHub Personal Access Token（推荐）或使用 GitHub CLI。

---

## 📊 生产环境

| 环境 | URL | 备注 |
|------|-----|------|
| **腾讯云** | `http://43.159.50.213/` | 主入口，nginx 80 端口 |
| **CDN（当前）** | `https://9vobu3ad7ujl.space.minimaxi.com` | JS/CSS 资源 |
| **API** | `http://43.159.50.213/api` | Health ✅ |

---

*本文档由 AI 自动生成，版本 v5.2.1 上线时归档。*
