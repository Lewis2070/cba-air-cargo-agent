# CBA Air Cargo 项目 - 持久化配置记录

> 更新：2026-03-27
> 状态：✅ 已全面持久化

---

## 🔐 SSH 密钥（永久有效）

**路径：`/workspace/cba-air-cargo-agent/deploy_key`**
**类型：ED25519，GitHub 和腾讯云共用**

```
私钥文件：/workspace/cba-air-cargo-agent/deploy_key（git repo 内，持久化）
公钥文件：/workspace/cba-air-cargo-agent/deploy_key.pub

GitHub 添加的公钥：ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILH9wWUz1sJPWqM1bK5pQRB6nF3vXQ7bK2pQRB6nF3vXQ7 cba-deploy-key
腾讯云 authorized_keys：同上

⚠️ 重要：这个目录是 git clone 的，挂载了持久化存储
    即使容器重启，只要 /workspace/cba-air-cargo-agent/ 存在，密钥就存在
    不要把这个目录 rm -rf ！！
```

**GitHub 和腾讯云都已添加此公钥，无需再手动添加。**

**Git 推送配置（永久）：**
```bash
git config --global core.sshCommand "ssh -i /workspace/cba-air-cargo-agent/deploy_key -o StrictHostKeyChecking=no"
```

---

## 🖥️ 服务器

- **腾讯云：** root@43.159.50.213
- **SSH 密钥：** `/workspace/cba-air-cargo-agent/deploy_key`
- **GitHub：** git@github.com:Lewis2070/cba-air-cargo-agent.git

---

## 📦 项目路径

```
/workspace/cba-air-cargo-agent/    ← 持久化 git repo（重要！）
├── deploy_key                      ← SSH 密钥（永久，不要删除）
├── deploy_key.pub
├── frontend/
│   ├── src/
│   │   ├── components/             ← v5.0 新增组件
│   │   │   ├── WeightBalanceEnvelope.tsx   ✅
│   │   │   ├── HoldLayout767BCF.tsx       ✅
│   │   │   ├── ULDContainer3D.tsx         ✅
│   │   │   └── ThemeToggle.tsx             ✅
│   │   │   └── CargoHold3D.tsx            ✅
│   │   ├── data/
│   │   │   ├── uld_specs.ts               ✅ IATA ULD标准数据
│   │   │   └── b767_bcf_config.ts         ✅ B767-300BCF配置
│   │   ├── hooks/
│   │   │   └── useLoadValidation.ts        ✅ 装载验证算法
│   │   └── pages/
│   │       └── LoadPlanningPage.tsx        ✅ v5.0 智能排舱页
│   └── dist/                               ← 构建产物（需同步服务器）
```

---

## 🔧 常用命令

```bash
# 部署到腾讯云（用持久化密钥）
scp -i /workspace/cba-air-cargo-agent/deploy_key frontend/dist/index.html root@43.159.50.213:/var/www/
scp -i /workspace/cba-air-cargo-agent/deploy_key -r frontend/dist/assets/* root@43.159.50.213:/var/www/assets/
ssh -i /workspace/cba-air-cargo-agent/deploy_key root@43.159.50.213 "nginx -s reload"

# GitHub 推送
cd /workspace/cba-air-cargo-agent
git add -A && git commit -m "message"
git push origin main

# 构建
cd /workspace/cba-air-cargo-agent/frontend
VITE_API_URL=http://43.159.50.213/api npm run build
```

---

## ⚠️ 经验教训

1. **SSH 密钥必须存 git repo 内**：/workspace/cba-air-cargo-agent/deploy_key 不会随容器重启丢失
2. **构建前查 VITE_API_URL**：`grep localhost dist/assets/index.js` 应为 0
3. **部署后查 index.html 引用**：确认 JS 文件名匹配
4. **密钥存 GitHub 后再推**：避免每次重新添加

---

*最后更新：2026-03-27*
