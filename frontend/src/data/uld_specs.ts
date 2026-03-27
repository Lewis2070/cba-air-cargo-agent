// uld_specs.ts - IATA 标准 ULD 规格数据
// 数据来源：IATA ULD Specifications (inco docs 2024) + 波音767-300BCF FCOM
// 版本：v5.0 | 更新：2026-03-26

export interface ULDType {
  code: string;           // IATA标准代码 (LD-3, LD-6, LD-7等)
  altCode: string;        // 俗称/旧代码 (AKE, ALF, P1P等)
  name: string;           // 中文名称
  type: 'pallet' | 'container' | 'bulk';  // 类型
  // 外部尺寸 (cm) - 决定是否能装进货舱门
  extLength: number;      // 外部长度 cm
  extWidth: number;       // 外部宽度 cm
  extHeight: number;     // 外部高度 cm
  // 内部尺寸 (cm) - 实际可装载空间
  intLength: number;      // 内长 cm
  intWidth: number;       // 内宽 cm
  intHeight: number;      // 内高 cm
  // 载重与体积
  maxWeight: number;      // 最大毛重 kg (含托盘)
  tareWeight: number;     // 托盘自重 kg
  maxLoad: number;        // 最大装载量 kg (maxWeight - tareWeight)
  volume: number;         // 内部容积 m³
  // 适用舱位
  compatibleDecks: ('main' | 'lower' | 'nose' | 'bulk')[];
  // 3D建模参数
  color3D: string;        // 3D视图中的颜色
  cssDepth3D: string;     // CSS 3D 深度
}

export const ULD_TYPES: ULDType[] = [
  {
    code: 'LD-7',
    altCode: 'P1P / PMC',
    name: '标准集装板',
    type: 'pallet',
    extLength: 335, extWidth: 253, extHeight: 213,
    intLength: 317, intWidth: 243, intHeight: 163,
    maxWeight: 4626, tareWeight: 110, maxLoad: 4516,
    volume: 10.7,
    compatibleDecks: ['main'],
    color3D: '#1E4E8A',
    cssDepth3D: '60px',
  },
  {
    code: 'LD-6',
    altCode: 'ALF / PAG',
    name: '半宽集装板',
    type: 'pallet',
    extLength: 318, extWidth: 163, extHeight: 213,
    intLength: 300, intWidth: 153, intHeight: 163,
    maxWeight: 3175, tareWeight: 75, maxLoad: 3100,
    volume: 8.9,
    compatibleDecks: ['main', 'lower'],
    color3D: '#2563EB',
    cssDepth3D: '55px',
  },
  {
    code: 'LD-3',
    altCode: 'AKE',
    name: '半高集装箱',
    type: 'container',
    extLength: 163, extWidth: 153, extHeight: 163,
    intLength: 153, intWidth: 143, intHeight: 155,
    maxWeight: 1588, tareWeight: 65, maxLoad: 1523,
    volume: 4.5,
    compatibleDecks: ['lower', 'main'],
    color3D: '#059669',
    cssDepth3D: '48px',
  },
  {
    code: 'LD-2',
    altCode: 'DPE',
    name: '半高集装箱',
    type: 'container',
    extLength: 162, extWidth: 153, extHeight: 163,
    intLength: 152, intWidth: 143, intHeight: 155,
    maxWeight: 1225, tareWeight: 55, maxLoad: 1170,
    volume: 3.5,
    compatibleDecks: ['lower'],
    color3D: '#0D9488',
    cssDepth3D: '48px',
  },
  {
    code: 'LD-4',
    altCode: 'ALP',
    name: '全宽集装箱',
    type: 'container',
    extLength: 244, extWidth: 163, extHeight: 163,
    intLength: 234, intWidth: 153, intHeight: 155,
    maxWeight: 2449, tareWeight: 85, maxLoad: 2364,
    volume: 5.7,
    compatibleDecks: [], // 门宽234cm > 下舱153cm限制，767不可用
    color3D: '#7C3AED',
    cssDepth3D: '48px',
  },
  {
    code: 'LD-8',
    altCode: 'DPN / RKN',
    name: '冷藏半高集装箱',
    type: 'container',
    extLength: 162, extWidth: 153, extHeight: 163,
    intLength: 152, intWidth: 143, intHeight: 155,
    maxWeight: 1225, tareWeight: 65, maxLoad: 1160,
    volume: 3.5,
    compatibleDecks: ['lower'],
    color3D: '#06B6D4',
    cssDepth3D: '48px',
  },
  {
    code: 'LD-11',
    altCode: 'DQF',
    name: '矩形集装板',
    type: 'pallet',
    extLength: 241, extWidth: 162, extHeight: 213,
    intLength: 223, intWidth: 152, intHeight: 163,
    maxWeight: 2449, tareWeight: 70, maxLoad: 2379,
    volume: 5.2,
    compatibleDecks: ['main'],
    color3D: '#D97706',
    cssDepth3D: '55px',
  },
  {
    code: 'BULK',
    altCode: 'BULK',
    name: '散货舱',
    type: 'bulk',
    extLength: 0, extWidth: 0, extHeight: 0,
    intLength: 0, intWidth: 0, intHeight: 0,
    maxWeight: 6800, tareWeight: 0, maxLoad: 6800,
    volume: 0,
    compatibleDecks: ['bulk'],
    color3D: '#6B7280',
    cssDepth3D: '0px',
  },
];

// 根据舱位获取可用ULD列表
export function getCompatibleULDs(deck: 'main' | 'lower' | 'nose' | 'bulk'): ULDType[] {
  return ULD_TYPES.filter(t => t.compatibleDecks.includes(deck));
}

// 根据体积推荐ULD（最优填充率排序）
export function recommendULD(volume_m3: number, weight_kg: number): ULDType[] {
  const candidates = ULD_TYPES.filter(uld =>
    uld.volume >= volume_m3 * 0.9 &&   // 预留5%膨胀
    uld.maxLoad >= weight_kg &&
    uld.type !== 'bulk'
  );

  return candidates
    .map(uld => ({
      ...uld,
      fillRate: Math.min((volume_m3 / uld.volume) * 100, 100),
    }))
    .sort((a, b) => {
      // 优先：填充率80-100%之间最优
      const aOptimal = a.fillRate >= 75 && a.fillRate <= 100;
      const bOptimal = b.fillRate >= 75 && b.fillRate <= 100;
      if (aOptimal && !bOptimal) return -1;
      if (!aOptimal && bOptimal) return 1;
      // 其次：填充率最接近100%
      return Math.abs(a.fillRate - 85) - Math.abs(b.fillRate - 85);
    });
}

// 货物填充评级
export type FillRating = 'perfect' | 'good' | 'fair' | 'poor' | 'critical' | 'overload';

export function rateFill(fillRate: number): { rating: FillRating; color: string; label: string } {
  if (fillRate > 100) return { rating: 'overload', color: '#EF4444', label: '🚨 超载' };
  if (fillRate >= 90) return { rating: 'perfect', color: '#10B981', label: '🟢 完美 (90-100%)' };
  if (fillRate >= 75) return { rating: 'good', color: '#22C55E', label: '🟢 优秀 (75-89%)' };
  if (fillRate >= 55) return { rating: 'fair', color: '#F59E0B', label: '🟡 一般 (55-74%)' };
  if (fillRate >= 30) return { rating: 'poor', color: '#EF4444', label: '🔴 浪费 (30-54%)' };
  return { rating: 'critical', color: '#DC2626', label: '⚫ 严重浪费 (<30%)' };
}

// 体积重计算（IATA标准：/6000）
export function calcVolumeWeight(length_cm: number, width_cm: number, height_cm: number): number {
  return (length_cm * width_cm * height_cm) / 6000;
}

// 计费重量（实际重 vs 体积重取大者）
export function calcChargeableWeight(actualWeight: number, length: number, width: number, height: number): number {
  return Math.max(actualWeight, calcVolumeWeight(length, width, height));
}
