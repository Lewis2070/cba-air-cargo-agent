// uld_specs.ts - IATA ULD 标准规格 + 行业通俗名称对照
// 数据来源：IATA ULD Specifications 2024 + 波音767-300BCF FCOM + 行业实践

export interface ULDType {
  iata_code: string;         // IATA官方代码：LD-7, LD-6, LD-3...
  common_names: string[];    // 行业通俗名称：['Q7', 'RAP']
  full_name: string;          // 全称：LD-7(P6)
  length_cm: number;
  width_cm: number;
  height_cm: number;
  max_load_kg: number;
  volume_m3: number;
  compatible_deck: ('main' | 'lower' | 'nose')[];
  note?: string;
}

// IATA 代码 → 通俗名称 映射表
export const ULD_COMMON_NAME_MAP: Record<string, string> = {
  // LD-7 通俗名
  'LD-7': 'Q7 / RAP',
  'LD7': 'Q7 / RAP',
  'Q7': 'LD-7',
  'RAP': 'LD-7',
  // LD-6 通俗名
  'LD-6': 'Q6 / AKE',
  'LD6': 'Q6 / AKE',
  'Q6': 'LD-6',
  // LD-3 通俗名
  'LD-3': 'AKE',
  'LD3': 'AKE',
  'AKE': 'LD-3',
  // LD-2 通俗名
  'LD-2': 'AAU',
  'LD2': 'AAU',
  'AAU': 'LD-2',
  // LD-4 通俗名
  'LD-4': 'PLA',
  'LD4': 'PLA',
  'PLA': 'LD-4',
  // LD-8 通俗名
  'LD-8': 'AMU',
  'LD8': 'AMU',
  'AMU': 'LD-8',
  // LD-11 通俗名
  'LD-11': 'AGK',
  'LD11': 'AGK',
  'AGK': 'LD-11',
};

// 标准化：将任意名称转换为 IATA 代码
export function normalizeULDCode(input: string): string {
  const upper = input.trim().toUpperCase().replace(/\s+/g, '-');
  return ULD_COMMON_NAME_MAP[upper] ? ULD_COMMON_NAME_MAP[upper] : upper;
}

// 完整 ULD 规格数据
export const ULD_TYPES: ULDType[] = [
  {
    iata_code: 'LD-7',
    common_names: ['Q7', 'RAP'],
    full_name: 'LD-7(P6)',
    length_cm: 1534,
    width_cm: 1564,
    height_cm: 1524,
    max_load_kg: 4620,
    volume_m3: 3.66,
    compatible_deck: ['main'],
    note: '主舱标准大型集装箱，波音767主力ULD'
  },
  {
    iata_code: 'LD-6',
    common_names: ['Q6', 'AKE'],
    full_name: 'LD-6(AKE)',
    length_cm: 1534,
    width_cm: 1564,
    height_cm: 1178,
    max_load_kg: 3530,
    volume_m3: 2.83,
    compatible_deck: ['main'],
    note: '主舱中型集装箱，最常见型号之一'
  },
  {
    iata_code: 'LD-3',
    common_names: ['AKE'],
    full_name: 'LD-3(AVE)',
    length_cm: 1534,
    width_cm: 1564,
    height_cm: 914,
    max_load_kg: 2320,
    volume_m3: 2.19,
    compatible_deck: ['lower', 'nose'],
    note: '下舱标准型，高度较低，可装于鼻舱'
  },
  {
    iata_code: 'LD-2',
    common_names: ['AAU'],
    full_name: 'LD-2(AAU)',
    length_cm: 1468,
    width_cm: 1534,
    height_cm: 914,
    max_load_kg: 1590,
    volume_m3: 2.06,
    compatible_deck: ['lower', 'nose'],
    note: '下舱小型集装箱，适用于小批量货物'
  },
  {
    iata_code: 'LD-4',
    common_names: ['PLA'],
    full_name: 'LD-4(PLA)',
    length_cm: 1534,
    width_cm: 1564,
    height_cm: 1178,
    max_load_kg: 3400,
    volume_m3: 2.83,
    compatible_deck: ['main'],
    note: '主舱中型，类似LD-6但侧壁结构不同'
  },
  {
    iata_code: 'LD-8',
    common_names: ['AMU'],
    full_name: 'LD-8(AMU)',
    length_cm: 1468,
    width_cm: 1534,
    height_cm: 1178,
    max_load_kg: 2300,
    volume_m3: 2.65,
    compatible_deck: ['lower', 'nose'],
    note: '下舱加高型，适合体积大但重量轻的货物'
  },
  {
    iata_code: 'LD-11',
    common_names: ['AGK'],
    full_name: 'LD-11(AGK)',
    length_cm: 1534,
    width_cm: 1564,
    height_cm: 1524,
    max_load_kg: 5070,
    volume_m3: 3.66,
    compatible_deck: ['main'],
    note: '主舱加强型，最大载重ULD'
  },
  {
    iata_code: 'BULK',
    common_names: ['BULK', '散货'],
    full_name: 'BULK (散货)',
    length_cm: 0,
    width_cm: 0,
    height_cm: 0,
    max_load_kg: 6800,
    volume_m3: 0, // 无标准容积，按实际装载计算
    compatible_deck: ['main', 'lower', 'nose'],
    note: '散货，无集装器限制'
  },
];

// 通过 IATA 代码或通俗名称查找 ULD 类型
export function findULDType(code: string): ULDType | undefined {
  const normalized = normalizeULDCode(code);
  return ULD_TYPES.find(u => u.iata_code === normalized || u.common_names.some(n => n.toUpperCase() === normalized));
}

// ULD 通俗名称选项（用于 Select 组件）
export function getULDNameOptions(): Array<{ value: string; label: string; sub: string }> {
  return ULD_TYPES.filter(u => u.iata_code !== 'BULK').map(u => ({
    value: u.iata_code,
    label: u.iata_code,
    sub: `${u.common_names.join('/')} · ${u.full_name} · ${u.volume_m3}m³ · 最大${u.max_load_kg}kg`,
  }));
}

// 推荐 ULD（按货物特性）
export function recommendULD(cargoWeight: number, cargoVolume: number, deck?: 'main' | 'lower'): ULDType[] {
  return ULD_TYPES
    .filter(u => {
      if (u.iata_code === 'BULK') return false;
      if (deck && !u.compatible_deck.includes(deck)) return false;
      return u.max_load_kg >= cargoWeight;
    })
    .sort((a, b) => {
      // 优先：载重刚好够 + 填充率最优
      const fillA = cargoVolume / a.volume_m3;
      const fillB = cargoVolume / b.volume_m3;
      const scoreA = fillA >= 0.5 && fillA <= 0.9 ? (1 - Math.abs(fillA - 0.72)) * 100 : 0;
      const scoreB = fillB >= 0.5 && fillB <= 0.9 ? (1 - Math.abs(fillB - 0.72)) * 100 : 0;
      return scoreB - scoreA || a.max_load_kg - b.max_load_kg;
    })
    .slice(0, 4);
}

// 填充率评分
export function rateFill(volumeM3: number, uldCode: string): { rating: 'full' | 'good' | 'fair' | 'poor' | 'overload' | 'empty'; color: string; label: string; pct: number } {
  const uld = findULDType(uldCode);
  if (!uld || uld.volume_m3 === 0) return { rating: 'empty', color: '#94A3B8', label: '散货', pct: 0 };
  const pct = volumeM3 / uld.volume_m3;
  if (pct > 1) return { rating: 'overload', color: '#DC2626', label: '🔴 超载', pct: parseFloat((pct * 100).toFixed(0)) };
  if (pct >= 0.9) return { rating: 'full', color: '#16A34A', label: '🟢 满载', pct: parseFloat((pct * 100).toFixed(0)) };
  if (pct >= 0.7) return { rating: 'good', color: '#2563EB', label: '🔵 良好', pct: parseFloat((pct * 100).toFixed(0)) };
  if (pct >= 0.4) return { rating: 'fair', color: '#F59E0B', label: '🟡 一般', pct: parseFloat((pct * 100).toFixed(0)) };
  if (pct > 0) return { rating: 'poor', color: '#DC2626', label: '⚫ 利用率低', pct: parseFloat((pct * 100).toFixed(0)) };
  return { rating: 'empty', color: '#94A3B8', label: '空载', pct: 0 };
}

// 体积重计算（IATA标准：长×宽×高 / 6000）
export function calcVolumeWeight(length_cm: number, width_cm: number, height_cm: number): number {
  return Math.round((length_cm * width_cm * height_cm) / 6000);
}

// 计费重量（实际重 vs 体积重 取大者，IATA规则）
export function calcChargeableWeight(actualWeight: number, length: number, width: number, height: number): number {
  return Math.max(actualWeight, calcVolumeWeight(length, width, height));
}
