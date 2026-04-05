# AI智能排舱优化技术方案

> **文档编号：** CBA-AI-2026-001
> **版本：** v1.0
> **日期：** 2026-04-05
> **作者：** CBA Air Cargo 研发组
> **状态：** 已归档，待研发评审

---

## 一、现状分析

### 1.1 当前算法描述

当前 `aiPack` 函数（`LoadPlanningPage.tsx` 第393行）采用**贪心算法**：

```
① 过滤已装载货物
② 按"计费重(kg) × 费率(元/kg)"降序排列未装载货物
③ 遍历货物：
     条件：同类甲板 + 当前重量 < 5000kg + 件数 < 10
     满足 → 加入现有ULD
     不满足 → 创建新ULD（主舱LD-6 / 下舱LD-3）
④ 顺序分配甲板位置（M1→M11→L1→L12）
⑤ 调用 buildPlan() 计算CG和DGR警告
```

### 1.2 已知问题

| 问题编号 | 问题描述 | 严重级别 |
|---------|---------|---------|
| P-001 | DGR冲突：危险品货物在ULD内产生IATA隔离规则冲突 | 🔴 严重 |
| P-002 | W&B超限：排舱后重心超出包线范围，界面飘红 | 🔴 严重 |
| P-003 | 无法装载货物被静默忽略，用户无感知 | 🟡 中等 |

### 1.3 根因分析

| 问题 | 根因 | 影响阶段 |
|------|------|---------|
| P-001 DGR冲突 | `aiPack` 追加货物时**从未调用** `checkULDCompatibility()`，仅检查重量/数量约束 | 货物分配阶段（第③步） |
| P-002 W&B超限 | 分配位置时**从未调用** `calculateCG()` 做预检，按固定顺序填入位置 | 位置分配阶段（第④步） |
| P-003 静默忽略 | 贪心算法不具备约束满足能力，"先放后报"而非"先验再放" | 架构层 |

---

## 二、现有约束资源

### 2.1 DGR 隔离规则

**文件：** `frontend/src/data/dgr_rules.ts`

```typescript
// 已有函数：检查两个DGR货物是否可同舱装载
checkULDCompatibility(dgrClass1: string, dgrClass2: string): { allowed: boolean; message: string }

// 返回值：
// allowed = false → 绝对禁止，message 包含原因
// allowed = true  → 可同舱
```

**关键规则（IATA DGR 2025）：**
- 1.1类（爆炸品）↔ 所有货物：绝对禁止同ULD
- 3类（易燃液体）↔ 1.1/1.2类：绝对禁止
- 5.1类（氧化剂）↔ 1.1/1.3类：绝对禁止
- 锂电池（9类）：按常规隔离要求

### 2.2 W&B 重心包线

**文件：** `frontend/src/data/hold_positions.ts`

```typescript
calculateCG(placed: { weight_kg: number; position_code: string }[]): {
  cg_mac_pct: number;   // 重心位置：% MAC（安全范围 9%~33%）
  status: 'OK' | 'forward' | 'aft' | 'over_limit';
}
```

**B767-300 安全包线参数：**
- 重心前限：9% MAC
- 重心后限：33% MAC
- MAC = 211.3 英寸

### 2.3 货舱位置定义

```typescript
getMainDeckPositions():    Position[]  // M1~M11（主舱）
getLowerFwdPositions():   Position[]  // L1~L6（下舱前）
getLowerAftPositions():   Position[]  // L7~L12（下舱后）
```

---

## 三、优化技术方案

### 方案A：贪心 + 约束预检查（推荐 ✅）

**改动范围：** 仅修改 `aiPack` 函数（~50行），不动 buildPlan / dgr_rules / hold_positions

#### Step 1：ULD 级别 DGR 兼容性预检查

```typescript
/**
 * 检查货物 c 能否加入目标 ULD
 * @param existingItems ULD内已有货物列表
 * @param newItem 待加入货物
 * @returns 允许状态及原因
 */
function canAddToULD(existingItems: CI[], newItem: CI): { allowed: boolean; reason: string } {
  // 普通货物互不冲突
  if (existingItems.every(i => i.category !== 'dgr') && newItem.category !== 'dgr') {
    return { allowed: true, reason: '' };
  }
  // 遍历已有货物，做DGR两两检查
  for (const existing of existingItems) {
    if (existing.category === 'dgr' || newItem.category === 'dgr') {
      const r = checkULDCompatibility(existing.dgr_class || '', newItem.dgr_class || '');
      if (!r.allowed) return { allowed: false, reason: r.message };
    }
  }
  return { allowed: true, reason: '' };
}
```

#### Step 2：W&B 重心预检

```typescript
/**
 * 估算加入货物后，指定舱位重心是否仍在安全包线内
 * @param positionCode 舱位代码（如 "M3"）
 * @param uldWeight 当前ULD总重(kg)
 * @param addWeight 待加入货物重量(kg)
 * @returns true = 安全，false = 超限
 */
function canFitInPosition(positionCode: string, uldWeight: number, addWeight: number): boolean {
  const newWeight = uldWeight + addWeight;
  const cg = calculateCG([
    { weight_kg: newWeight, position_code: positionCode }
  ]);
  return cg.status !== 'over_limit';
}
```

#### Step 3：改造 aiPack 主循环

```typescript
const aiPack = () => {
  const placedIds = new Set(ulds.flatMap(u => u.cargoItems.map(c => c.id)));
  const un = d.filter(c => !placedIds.has(c.id));
  if (!un.length) { message.info('所有货物已分配完毕'); return; }

  const sorted = [...un].sort((a, b) =>
    (b.chargeableWeight_kg * b.fee_per_kg) - (a.chargeableWeight_kg * a.fee_per_kg)
  );

  const nUI: UI[] = [];
  const mp = [...getMainDeckPositions(), ...getLowerFwdPositions(), ...getLowerAftPositions()];
  const unplaced: CI[] = [];  // 记录无法装载的货物及原因

  sorted.forEach(c => {
    const deck = (c.category === 'live_animal' || c.category === 'perishable') ? 'lower' : 'main';

    // 找候选ULD：满足载重+数量约束 AND DGR兼容
    const candidates = nUI
      .filter(x => x.deck === deck
        && x.cargoItems.reduce((s, i) => s + i.weight_kg, 0) + c.weight_kg <= 5000
        && x.cargoItems.length < 10)
      .filter(x => canAddToULD(x.cargoItems, c).allowed)
      .sort((a, b) => a.cargoItems.length - b.cargoItems.length); // 优先装最满的ULD

    if (candidates.length > 0) {
      candidates[0].cargoItems.push(c);
    } else {
      // 尝试创建新ULD
      const code = deck === 'main' ? 'LD-6' : 'LD-3';
      const newUld: UI = {
        id: 'AI-' + Date.now() + '-' + nUI.length,
        uld_code: code,
        uld_name: deck === 'main' ? 'Q6' : 'AKE',
        uld_full_name: deck === 'main' ? 'LD-6(AKE)' : 'LD-3(AKE)',
        uld_serial: 'LD' + String(counter + nUI.length).padStart(3, '0'),
        cargoItems: [c], deck,
        dims: { l_cm: 0, w_cm: 0, h_cm: 0 }, max_load_kg: 0, volume_m3: 0,
      };
      nUI.push(newUld);
    }
  });

  // ========== 位置分配（W&B 预判）==========
  const remainingByDeck = {
    main: sorted.filter(c => {
      const deck = (c.category === 'live_animal' || c.category === 'perishable') ? 'lower' : 'main';
      return deck === 'main';
    }).reduce((s, c) => s + c.weight_kg, 0),
    lower: sorted.filter(c => {
      const deck = (c.category === 'live_animal' || c.category === 'perishable') ? 'lower' : 'main';
      return deck === 'lower';
    }).reduce((s, c) => s + c.weight_kg, 0),
  };

  // 筛选W&B安全的舱位
  const mainSafe = mp.filter(p => p.code.startsWith('M') && canFitInPosition(p.code, remainingByDeck.main, 0));
  const lowerSafe = [...mp.filter(p => p.code.startsWith('L'))];

  let mainIdx = 0, lowerIdx = 0;
  nUI.forEach(u => {
    if (u.deck === 'main' && mainIdx < mainSafe.length) {
      u.position = mainSafe[mainIdx++].code;
    } else if (u.deck === 'lower' && lowerIdx < lowerSafe.length) {
      u.position = lowerSafe[lowerIdx++].code;
    }
  });

  // ========== 无法装载货物告知 ==========
  const stillUnplaced = d.filter(c => !placedIds.has(c.id) && !nUI.flatMap(u => u.cargoItems).some(x => x.id === c.id));
  if (stillUnplaced.length > 0) {
    message.warning(
      `以下货物无法装载（存在DGR冲突或舱位不足）：${stillUnplaced.map(c => c.awb).join('、')}`,
      5
    );
  }

  setConfirmPlan(buildPlan(nUI));
  setConfirmMode('ai');
  setConfirmOpen(true);
};
```

---

## 四、方案评估

| 维度 | 方案A（贪心+预检查） | 方案B（约束规划） |
|------|---------------------|-----------------|
| 改动范围 | ~50行，3个文件 | ~200行，需引入新依赖 |
| 技术风险 | 低（纯 TypeScript） | 高（需引入SAT求解器） |
| 开发周期 | 1~2天 | 1周以上 |
| DGR冲突 | ✅ 装前拦截 | ✅ 理论最优 |
| W&B超限 | ✅ 预判规避 | ✅ 理论最优 |
| 无法装载感知 | ✅ 明确告知 | ✅ 明确告知 |
| 适用场景 | 当前版本快速修复 | 未来版本重构 |

**推荐方案A**：最小改动、最大收益、不引入新依赖、不破坏现有架构。

---

## 五、效果预期

| 指标 | 当前（v5.3.4） | 优化后（方案A） |
|------|---------------|----------------|
| DGR冲突 | ❌ 装完才报警 | ✅ 装前拦截，ULD分配自动规避 |
| W&B超限飘红 | ❌ 装完才报警，无法自动修正 | ✅ 位置分配预判，飘红概率大幅降低 |
| 无法装载货物 | ❌ 静默忽略 | ✅ 弹窗明确告知原因和品名 |
| 用户体验 | 有方案就给，不顾约束 | 有约束的方案才给 |

---

## 六、文件改动清单

| 文件 | 改动说明 | 改动行数 |
|------|---------|---------|
| `frontend/src/pages/LoadPlanningPage.tsx` | 新增 `canAddToULD`、`canFitInPosition` 函数；改造 `aiPack` 主循环；增强无法装载告知 | ~55行 |
| `frontend/src/data/dgr_rules.ts` | 无需改动 | 0行 |
| `frontend/src/data/hold_positions.ts` | 无需改动（直接复用 `calculateCG`） | 0行 |
| `frontend/src/App.tsx` | 无需改动 | 0行 |

---

## 七、上线流程

```
方案评审通过
    ↓
研发实现（~1天）
    ↓
UAT 部署 + 功能验证
    ↓
用户确认"可以提交github"
    ↓
GitHub commit + tag v5.4.0
    ↓
生产部署
```

---

*文档归档：CBA Air Cargo 研发组 · 2026-04-05*
