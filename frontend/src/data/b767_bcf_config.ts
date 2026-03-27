// b767_bcf_config.ts - Boeing 767-300BCF 精确配置
// 数据来源：Atlas Air 767-300BCF One Sheet (2018) + 波音FCOM B767-300
// 版本：v5.0 | 更新：2026-03-26

export interface PositionDef {
  code: string;           // 舱位代码: A1, B1, C1, L1, R1, BULK等
  label_cn: string;      // 中文标注: "主舱-A1", "下舱-L1"
  deck: 'main' | 'lower' | 'nose' | 'bulk';  // 所在舱区
  section: 'fwd' | 'ctr' | 'aft';            // 前后位置
  row: 'left' | 'right' | 'center';          // 左右
  arm_m: number;         // 力臂 (m) - 重心计算用
  maxWeight_kg: number;  // 该位最大载重 (kg)
  uldTypes: string[];    // 可用ULD类型代码列表
  doorOrder: number;     // 装卸顺序（1=最先装，数字越大越后）
  shape?: 'half' | 'full' | 'bulk';  // 半宽/全宽/散货
}

export interface DeckDef {
  id: 'main' | 'lower' | 'nose' | 'bulk';
  label: string;
  label_cn: string;
  color: string;         // SVG 背景色
  borderColor: string;
  totalPositions: number;
}

export interface B767Config {
  aircraftType: string;
  name_cn: string;
  name_en: string;
  // 重量参数 (kg)
  weights: {
    mtow_kg: number;      // 最大起飞重量
    mzfw_kg: number;      // 最大零燃油重量
    mlw_kg: number;       // 最大落地重量
    oew_kg: number;       // 空机重量
    maxFuel_kg: number;   // 最大燃油
    maxPayload_kg: number;
  };
  // 重量参数 (lbs，用于包线图)
  weights_lbs: {
    mtow: number;
    mzfw: number;
    mlw: number;
    oew: number;
  };
  // 重心包线参数
  envelope: {
    // X轴: % MAC
    mac_m: number;         // 平均气动弦 (m)
    mac_le_m: number;      // MAC 前缘位置 (m from datum)
    // Y轴: 重量 lbs
    yMin: number;
    yMax: number;
    // 前重心限制线 (Forward CG Limit, %MAC vs Weight lbs)
    fwdCG: { w_lbs: number; cg_pct: number }[];
    // 后重心限制线 (Aft CG Limit)
    aftCG: { w_lbs: number; cg_pct: number }[];
  };
  // 舱位定义
  positions: PositionDef[];
  decks: DeckDef[];
}

// 767-300BCF 舱位布局（Atlas Air 官方配置）
// 主舱：A/B/C/E/F 行（前→中→后），每行左右两侧
// 下舱：L/R 列（前→中→后）

const MAIN_DECK_POSITIONS: PositionDef[] = [
  // 前货舱区 FWD COMP (共8个)
  { code: 'A1', label_cn: '主舱-A1', deck: 'main', section: 'fwd', row: 'left',   arm_m: 15.2, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 1, shape: 'full' },
  { code: 'A2', label_cn: '主舱-A2', deck: 'main', section: 'fwd', row: 'left',   arm_m: 15.2, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 2, shape: 'full' },
  { code: 'A3', label_cn: '主舱-A3', deck: 'main', section: 'fwd', row: 'left',   arm_m: 15.2, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 3, shape: 'full' },
  { code: 'A4', label_cn: '主舱-A4', deck: 'main', section: 'fwd', row: 'left',   arm_m: 15.2, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 4, shape: 'full' },
  { code: 'B1', label_cn: '主舱-B1', deck: 'main', section: 'fwd', row: 'right',  arm_m: 15.2, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 1, shape: 'full' },
  { code: 'B2', label_cn: '主舱-B2', deck: 'main', section: 'fwd', row: 'right',  arm_m: 15.2, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 2, shape: 'full' },
  { code: 'B3', label_cn: '主舱-B3', deck: 'main', section: 'fwd', row: 'right',  arm_m: 15.2, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 3, shape: 'full' },
  { code: 'B4', label_cn: '主舱-B4', deck: 'main', section: 'fwd', row: 'right',  arm_m: 15.2, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 4, shape: 'full' },

  // 中货舱区 CTR COMP (共8个)
  { code: 'C1', label_cn: '主舱-C1', deck: 'main', section: 'ctr', row: 'left',   arm_m: 18.5, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 5, shape: 'full' },
  { code: 'C2', label_cn: '主舱-C2', deck: 'main', section: 'ctr', row: 'left',   arm_m: 18.5, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 6, shape: 'full' },
  { code: 'C3', label_cn: '主舱-C3', deck: 'main', section: 'ctr', row: 'left',   arm_m: 18.5, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 7, shape: 'full' },
  { code: 'C4', label_cn: '主舱-C4', deck: 'main', section: 'ctr', row: 'left',   arm_m: 18.5, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 8, shape: 'full' },
  { code: 'D1', label_cn: '主舱-D1', deck: 'main', section: 'ctr', row: 'right',  arm_m: 18.5, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 5, shape: 'full' },
  { code: 'D2', label_cn: '主舱-D2', deck: 'main', section: 'ctr', row: 'right',  arm_m: 18.5, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 6, shape: 'full' },
  { code: 'D3', label_cn: '主舱-D3', deck: 'main', section: 'ctr', row: 'right',  arm_m: 18.5, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 7, shape: 'full' },
  { code: 'D4', label_cn: '主舱-D4', deck: 'main', section: 'ctr', row: 'right',  arm_m: 18.5, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 8, shape: 'full' },

  // 后货舱区 AFT COMP (共6个)
  { code: 'E1', label_cn: '主舱-E1', deck: 'main', section: 'aft', row: 'left',   arm_m: 21.8, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 9, shape: 'full' },
  { code: 'E2', label_cn: '主舱-E2', deck: 'main', section: 'aft', row: 'left',   arm_m: 21.8, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 10, shape: 'full' },
  { code: 'E3', label_cn: '主舱-E3', deck: 'main', section: 'aft', row: 'left',   arm_m: 21.8, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 11, shape: 'full' },
  { code: 'F1', label_cn: '主舱-F1', deck: 'main', section: 'aft', row: 'right',  arm_m: 21.8, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 9, shape: 'full' },
  { code: 'F2', label_cn: '主舱-F2', deck: 'main', section: 'aft', row: 'right',  arm_m: 21.8, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 10, shape: 'full' },
  { code: 'F3', label_cn: '主舱-F3', deck: 'main', section: 'aft', row: 'right',  arm_m: 21.8, maxWeight_kg: 3400, uldTypes: ['LD-7', 'LD-6', 'LD-11'], doorOrder: 11, shape: 'full' },

  // BULK 散货舱
  { code: 'BULK', label_cn: '散货舱-BULK', deck: 'bulk', section: 'aft', row: 'center', arm_m: 23.5, maxWeight_kg: 6800, uldTypes: ['BULK'], doorOrder: 12, shape: 'bulk' },
];

const LOWER_DECK_POSITIONS: PositionDef[] = [
  // 前下舱 FWD LOWER (共4个)
  { code: 'L1', label_cn: '下舱-L1', deck: 'lower', section: 'fwd', row: 'left',  arm_m: 13.8, maxWeight_kg: 1500, uldTypes: ['LD-3', 'LD-2', 'LD-8'], doorOrder: 1, shape: 'half' },
  { code: 'L2', label_cn: '下舱-L2', deck: 'lower', section: 'fwd', row: 'left',  arm_m: 13.8, maxWeight_kg: 1500, uldTypes: ['LD-3', 'LD-2', 'LD-8'], doorOrder: 2, shape: 'half' },
  { code: 'R1', label_cn: '下舱-R1', deck: 'lower', section: 'fwd', row: 'right', arm_m: 13.8, maxWeight_kg: 1500, uldTypes: ['LD-3', 'LD-2', 'LD-8'], doorOrder: 1, shape: 'half' },
  { code: 'R2', label_cn: '下舱-R2', deck: 'lower', section: 'fwd', row: 'right', arm_m: 13.8, maxWeight_kg: 1500, uldTypes: ['LD-3', 'LD-2', 'LD-8'], doorOrder: 2, shape: 'half' },

  // 中下舱 CTR LOWER (共4个)
  { code: 'L3', label_cn: '下舱-L3', deck: 'lower', section: 'ctr', row: 'left',  arm_m: 17.5, maxWeight_kg: 1500, uldTypes: ['LD-3', 'LD-2', 'LD-8'], doorOrder: 3, shape: 'half' },
  { code: 'L4', label_cn: '下舱-L4', deck: 'lower', section: 'ctr', row: 'left',  arm_m: 17.5, maxWeight_kg: 1500, uldTypes: ['LD-3', 'LD-2', 'LD-8'], doorOrder: 4, shape: 'half' },
  { code: 'R3', label_cn: '下舱-R3', deck: 'lower', section: 'ctr', row: 'right', arm_m: 17.5, maxWeight_kg: 1500, uldTypes: ['LD-3', 'LD-2', 'LD-8'], doorOrder: 3, shape: 'half' },
  { code: 'R4', label_cn: '下舱-R4', deck: 'lower', section: 'ctr', row: 'right', arm_m: 17.5, maxWeight_kg: 1500, uldTypes: ['LD-3', 'LD-2', 'LD-8'], doorOrder: 4, shape: 'half' },

  // 后下舱 AFT LOWER (共4个)
  { code: 'L5', label_cn: '下舱-L5', deck: 'lower', section: 'aft', row: 'left',  arm_m: 20.2, maxWeight_kg: 1500, uldTypes: ['LD-3', 'LD-2', 'LD-8'], doorOrder: 5, shape: 'half' },
  { code: 'L6', label_cn: '下舱-L6', deck: 'lower', section: 'aft', row: 'left',  arm_m: 20.2, maxWeight_kg: 1500, uldTypes: ['LD-3', 'LD-2', 'LD-8'], doorOrder: 6, shape: 'half' },
  { code: 'R5', label_cn: '下舱-R5', deck: 'lower', section: 'aft', row: 'right', arm_m: 20.2, maxWeight_kg: 1500, uldTypes: ['LD-3', 'LD-2', 'LD-8'], doorOrder: 5, shape: 'half' },
  { code: 'R6', label_cn: '下舱-R6', deck: 'lower', section: 'aft', row: 'right', arm_m: 20.2, maxWeight_kg: 1500, uldTypes: ['LD-3', 'LD-2', 'LD-8'], doorOrder: 6, shape: 'half' },
];

export const B767_300BCF: B767Config = {
  aircraftType: 'B767-300BCF',
  name_cn: '波音767-300改装全货机',
  name_en: 'Boeing 767-300 Boeing Converted Freighter',

  weights: {
    mtow_kg:       186880,   // 412,000 lbs
    mzfw_kg:       149478,   // 329,000 lbs
    mlw_kg:        166468,   // 367,000 lbs
    oew_kg:         86000,   // ~189,600 lbs (估算)
    maxFuel_kg:     91380,   // ~201,500 lbs
    maxPayload_kg: 52000,   // ~114,640 lbs
  },

  weights_lbs: {
    mtow:  412000,
    mzfw:  329000,
    mlw:   367000,
    oew:   189200,
  },

  envelope: {
    mac_m:     18.0,   // 平均气动弦 ~18m
    mac_le_m:  15.0,   // MAC前缘距基准面约15m
    yMin:      0,
    yMax:      420000,
    // 前重心限制：轻载时14% MAC，重载时22% MAC
    fwdCG: [
      { w_lbs: 189200, cg_pct: 14 },  // 空机+最小燃油
      { w_lbs: 329000, cg_pct: 22 },  // MZFW
      { w_lbs: 412000, cg_pct: 28 }, // MTOW
    ],
    // 后重心限制：轻载时43% MAC，重载时35% MAC
    aftCG: [
      { w_lbs: 189200, cg_pct: 43 },  // 空机+最小燃油
      { w_lbs: 329000, cg_pct: 37 }, // MZFW
      { w_lbs: 412000, cg_pct: 35 }, // MTOW
    ],
  },

  positions: [...MAIN_DECK_POSITIONS, ...LOWER_DECK_POSITIONS],

  decks: [
    {
      id: 'main', label: 'MAIN DECK', label_cn: '主舱',
      color: '#0F2044', borderColor: '#2B5BA8',
      totalPositions: MAIN_DECK_POSITIONS.length,
    },
    {
      id: 'lower', label: 'LOWER HOLD', label_cn: '下舱',
      color: '#071428', borderColor: '#1A3A6E',
      totalPositions: LOWER_DECK_POSITIONS.length,
    },
    {
      id: 'bulk', label: 'BULK', label_cn: '散货舱',
      color: '#1A0F08', borderColor: '#8B5A2B',
      totalPositions: 1,
    },
  ],
};

// 辅助函数：获取某舱区的所有仓位
export function getPositionsByDeck(deck: 'main' | 'lower' | 'nose' | 'bulk'): PositionDef[] {
  return B767_300BCF.positions.filter(p => p.deck === deck);
}

// 辅助函数：获取某舱区的仓位统计
export function getDeckStats(deck: 'main' | 'lower' | 'bulk') {
  const positions = getPositionsByDeck(deck);
  return {
    total: positions.length,
    maxWeight: positions.reduce((sum, p) => sum + p.maxWeight_kg, 0),
    positions,
  };
}
