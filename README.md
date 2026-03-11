# CBA Air Cargo V2 - 系统架构

## 项目结构

```
cba-air-cargo-v2/
├── frontend/                 # 前端应用 (React + TypeScript)
│   ├── src/
│   │   ├── components/      # 公共组件
│   │   ├── pages/          # 页面
│   │   ├── hooks/          # 自定义Hooks
│   │   ├── services/       # API服务
│   │   ├── stores/         # 状态管理
│   │   └── utils/          # 工具函数
│   └── public/
│
├── backend/                 # 后端服务 (NestJS)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── booking/    # 订舱管理
│   │   │   ├── capacity/   # 舱位控制
│   │   │   ├── planning/   # 排舱优化
│   │   │   ├── revenue/    # 收益管理
│   │   │   ├── compliance/ # 合规检查
│   │   │   └── analytics/  # 数据分析
│   │   ├── common/         # 公共模块
│   │   └── config/        # 配置
│   └── test/
│
├── ai-service/             # AI模型服务 (Python FastAPI)
│   ├── models/            # 模型文件
│   │   ├── forecasting/   # 舱位预测模型
│   │   ├── nlp/          # NLP模型 (BERT)
│   │   ├── optimization/ # 优化求解器
│   │   └── vision/       # 计算机视觉
│   ├── services/         # AI服务
│   └── scripts/          # 训练脚本
│
├── data-platform/         # 数据平台
│   ├── etl/              # ETL任务
│   ├── warehouse/        # 数据仓库
│   └── pipeline/         # 数据管道
│
└── docs/                 # 文档
    ├── api/              # API文档
    ├── architecture/     # 架构文档
    └── guides/           # 开发指南
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18, TypeScript, Ant Design, Three.js |
| 后端 | NestJS, Node.js, PostgreSQL, Redis |
| AI | Python 3.11, FastAPI, TensorFlow, PyTorch, OR-Tools |
| 数据 | Kafka, Elasticsearch, TimescaleDB |
| 基础设施 | Docker, K8s, GitLab CI |

## 核心模块

### 1. 智能舱位管理 (Capacity)
- 实时舱位状态大屏
- Booking Curve可视化
- 需求预测 (LSTM + LightGBM)
- 爆舱/空舱预警

### 2. 收益管理 (Revenue)
- Bid Price计算
- 动态定价
- 客户分层
- 超订策略

### 3. 合规检查 (Compliance)
- 品名自动识别 (BERT NLP)
- DGR规则匹配
- 隔离计算

### 4. 智能排舱 (Planning)
- 3D货舱可视化
- CP-SAT优化求解
- 重心计算

### 5. 数据校验 (Verification)
- OCR识别
- NLP差异检测
- 自动修正

### 6. 装载质控 (Quality)
- 3D Bin Packing
- AR辅助引导
- 质量检测

### 7. 智能复盘 (Analytics)
- LLM报告生成
- 归因分析
- 知识图谱
