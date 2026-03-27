// dgr_rules.ts - IATA DGR 危险品隔离规则 (2025版)
// 数据来源：IATA Dangerous Goods Regulations 66th Edition
// 用途：货运系统货物兼容性校验

export type DGRClass = '1.1' | '1.2' | '1.3' | '2.1' | '2.2' | '3' | '4.1' | '4.2' | '4.3' | '5.1' | '5.2' | '6.1' | '6.2' | '7' | '8' | '9';

export interface DGRCategory {
  class: DGRClass;
  label: string;           // 显示名称
  color: string;           // UI 颜色
  un_range: string;        // UN编号范围
  packing_group?: 'I' | 'II' | 'III';
  description: string;
}

export const DGR_CATEGORIES: DGRCategory[] = [
  { class: '1.1', label: '1.1 爆炸品', color: '#FF0000', un_range: 'UN0021-UN0303', description: '具有大规模爆炸特性的物质' },
  { class: '1.2', label: '1.2 爆炸品', color: '#FF0000', un_range: 'UN0081-UN0082', description: '有射出危险但不具有大规模爆炸特性' },
  { class: '1.3', label: '1.3 爆炸品', color: '#FF6600', un_range: 'UN0094-UN0105', description: '火灭危险、轻微爆炸或射出危险' },
  { class: '2.1', label: '2.1 易燃气体', color: '#FF6600', un_range: 'UN1011-UN1075', description: '易燃气体（甲烷、丙烷、氢气等）' },
  { class: '2.2', label: '2.2 非易燃气体', color: '#00AA00', un_range: 'UN1951-UN1982', description: '非易燃、无毒气体（氮气、氧气等）' },
  { class: '3',   label: '3 易燃液体', color: '#FF0000', un_range: 'UN1093-UN1993', description: '易燃液体（汽油、酒精、丙酮等）' },
  { class: '4.1', label: '4.1 易燃固体', color: '#FF0000', un_range: 'UN1325-UN3179', description: '易燃固体、自反应物质' },
  { class: '4.2', label: '4.2 易自燃物质', color: '#FF0000', un_range: 'UN1361-UN1374', description: '易自燃或在正常条件下可自燃的物质' },
  { class: '4.3', label: '4.3 遇水释放易燃气体', color: '#FF6600', un_range: 'UN1389-UN1421', description: '与水反应释放危险量易燃气体' },
  { class: '5.1', label: '5.1 氧化剂', color: '#FF9900', un_range: 'UN1942-UN2627', description: '氧化剂（高锰酸钾、过氧化氢等）' },
  { class: '5.2', label: '5.2 有机过氧化物', color: '#FF0000', un_range: 'UN3101-UN3129', description: '有机过氧化物（引发剂）' },
  { class: '6.1', label: '6.1 毒性物质', color: '#CC0000', un_range: 'UN2810-UN2902', description: '有毒物质（经吸入、吞咽或皮肤接触致死）' },
  { class: '6.2', label: '6.2 感染性物质', color: '#CC0000', un_range: 'UN2814-UN3373', description: '感染性物质（病原体、病毒培养物）' },
  { class: '7',   label: '7 放射性', color: '#AA00FF', un_range: 'UN2908-UN2982', description: '放射性物质（医疗同位素等）' },
  { class: '8',   label: '8 腐蚀性物质', color: '#FFCC00', un_range: 'UN1759-UN3321', description: '腐蚀性物质（硫酸、盐酸、氢氧化钠等）' },
  { class: '9',   label: '9 杂类', color: '#666666', un_range: 'UN3077-UN3527', description: '其他受控物质（锂电池、干冰等）' },
];

export const CLASS_LABELS: Record<string, string> = DGR_CATEGORIES.reduce((acc, c) => ({ ...acc, [c.class]: c.label }), {});

// 隔离规则定义
export type SeparationLevel = 'forbidden' | 'different_uld' | 'different_compartment' | 'diagonal' | 'allowed';

export interface SegregationRule {
  forbids: DGRClass[];      // 绝对禁止同ULD
  separate_compartment: DGRClass[];  // 需不同舱区
  diagonal_allowed: DGRClass[];     // 可对角线放置
  note?: string;
}

export const DGR_SEGREGATION: Record<DGRClass, SegregationRule> = {
  '1.1': {
    forbids: ['1.1', '1.2', '1.3'],
    separate_compartment: ['3', '4.1', '5.1', '2.1'],
    diagonal_allowed: ['6.1'],
    note: '1.1类必须与所有其他货物完全隔离'
  },
  '1.2': {
    forbids: ['1.1', '1.2', '1.3'],
    separate_compartment: ['3', '5.1'],
    diagonal_allowed: ['6.1', '4.1'],
    note: '1.2类必须与所有其他货物完全隔离'
  },
  '1.3': {
    forbids: ['1.1', '1.2', '1.3'],
    separate_compartment: ['3', '5.1'],
    diagonal_allowed: ['6.1', '4.1', '2.1'],
    note: '1.3类需与5.1类（氧化剂）隔离'
  },
  '2.1': {
    forbids: [],
    separate_compartment: ['3', '8'],
    diagonal_allowed: ['5.1', '4.1', '4.2'],
    note: '2.1类与3类（易燃液体）需不同舱区'
  },
  '2.2': {
    forbids: [],
    separate_compartment: [],
    diagonal_allowed: [],
    note: '非易燃、无毒气体基本无隔离要求'
  },
  '3': {
    forbids: [],
    separate_compartment: ['1.1', '1.2', '1.3', '5.1', '5.2'],
    diagonal_allowed: ['2.1', '8', '4.1'],
    note: '易燃液体与氧化剂（5.1）、爆炸品（1.x）必须不同舱区'
  },
  '4.1': {
    forbids: ['5.1'],
    separate_compartment: ['1.1', '1.2', '1.3'],
    diagonal_allowed: ['2.1', '8'],
    note: '4.1类与5.1类（氧化剂）绝对禁止相邻'
  },
  '4.2': {
    forbids: ['5.1'],
    separate_compartment: ['1.1', '1.2', '3'],
    diagonal_allowed: ['2.1', '8'],
    note: '4.2类自燃物质与氧化剂绝对禁止相邻'
  },
  '4.3': {
    forbids: ['5.1'],
    separate_compartment: ['1.1', '1.2', '3'],
    diagonal_allowed: ['2.1', '8', '4.1'],
    note: '4.3类遇水释气与氧化剂绝对禁止相邻'
  },
  '5.1': {
    forbids: ['1.1', '1.2', '1.3', '4.1', '4.2', '4.3', '5.1'],
    separate_compartment: ['3'],
    diagonal_allowed: ['2.1', '8'],
    note: '氧化剂是最高隔离要求的货物之一'
  },
  '5.2': {
    forbids: ['1.1', '1.2', '5.2'],
    separate_compartment: ['3'],
    diagonal_allowed: ['2.1', '8', '4.1'],
    note: '有机过氧化物与3类（易燃液体）必须不同舱区'
  },
  '6.1': {
    forbids: [],
    separate_compartment: ['3'],
    diagonal_allowed: ['5.1'],
    note: '6.1类需与食品/日用品分开，与3类需不同舱区'
  },
  '6.2': {
    forbids: [],
    separate_compartment: ['1.1', '1.2', '3', '4.1'],
    diagonal_allowed: [],
    note: '感染性物质必须与所有食品/日用品完全隔离'
  },
  '7': {
    forbids: ['1.1', '1.2'],
    separate_compartment: ['3', '5.1', '4.1'],
    diagonal_allowed: ['2.2'],
    note: '放射性物质需与人员/食品保持最大距离'
  },
  '8': {
    forbids: [],
    separate_compartment: ['1.1', '1.2', '1.3'],
    diagonal_allowed: ['2.1', '5.1', '4.1'],
    note: '腐蚀性物质与3类（易燃液体）需不同舱区'
  },
  '9': {
    forbids: [],
    separate_compartment: [],
    diagonal_allowed: [],
    note: '9类（锂电池等）按常规隔离要求'
  },
};

// 检查两种货物是否可以在同一 ULD 中
export function checkULDCompatibility(cargo1Class: string, cargo2Class: string): {
  allowed: boolean;
  level: SeparationLevel;
  message: string;
} {
  if (cargo1Class === cargo2Class) {
    return { allowed: false, level: 'different_uld', message: `${cargo1Class}类货物禁止与其他货物同ULD` };
  }

  const rule1 = DGR_SEGREGATION[cargo1Class as DGRClass];
  const rule2 = DGR_SEGREGATION[cargo2Class as DGRClass];

  if (!rule1 || !rule2) {
    return { allowed: true, level: 'allowed', message: '' };
  }

  if (rule1.forbids.includes(cargo2Class as DGRClass)) {
    return { allowed: false, level: 'forbidden', message: `${cargo1Class}类与${cargo2Class}类绝对禁止混合装载` };
  }

  if (rule1.separate_compartment.includes(cargo2Class as DGRClass)) {
    return { allowed: false, level: 'different_compartment', message: `${cargo1Class}类与${cargo2Class}类必须位于不同舱区` };
  }

  if (rule1.diagonal_allowed.includes(cargo2Class as DGRClass)) {
    return { allowed: true, level: 'diagonal', message: `${cargo1Class}类与${cargo2Class}类需保持对角距离` };
  }

  return { allowed: true, level: 'allowed', message: '' };
}

// 活体动物与普通货物隔离
export const LIVE_ANIMAL_RULES = {
  // 活体动物必须单独一个舱区（主舱或下舱一个完整区域）
  must_separate_compartment: true,
  // 活体动物不得与以下货物同舱
  forbids_in_same_compartment: ['3', '4.1', '4.2', '4.3', '5.1', '5.2', '6.1', '8'],
  // 活体动物不得与以下货物同ULD
  forbids_in_same_uld: ['1.1', '1.2', '1.3', '2.1', '3', '4.1', '4.2', '4.3', '5.1', '5.2', '6.1', '6.2', '7', '8'],
  // 建议舱区
  preferred_compartments: ['lower_fwd', 'lower_aft'] as const,
  note: '活体动物必须装载于通风良好的舱区，远离热源/冷源直接吹风口'
};

// 生鲜货物隔离
export const PERISHABLE_RULES = {
  // 生鲜不得与以下货物同舱
  forbids_in_same_compartment: ['3', '4.1', '4.2', '4.3', '5.1', '5.2', '6.1', '8'],
  // 生鲜不得与以下货物同ULD
  forbids_in_same_uld: ['1.1', '1.2', '1.3', '2.1', '3', '4.1', '4.2', '4.3', '5.1', '5.2', '6.1', '6.2', '7', '8'],
  // 温度要求货物必须温控ULD
  temperature_control_required: ['chill', 'freeze'] as const,
  note: '生鲜货物须使用温控ULD，并远离产生异味的货物（如海鲜/化工品）'
};
