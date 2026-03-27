// uld_specs.ts - IATA 标准 ULD 规格数据
// 数据来源：IATA ULD Specifications (inco docs 2024) + 波音767-300BCF FCOM
// 版本：v5.0 | 更新：2026-03-26

export interface ULDType {
  code: string;
  name: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  max_load_kg: number;
  volume_m3: number;
  type: 'ld' | 'ul' | 'bulk';
}

// IATA 标准 ULD 数据
export const ULD_TYPES: ULDType[] = [
  // LD-7 集装器（主甲板标准）
  { code: 'LD-7', name: 'LD-7(P6)', length_cm: 1534, width_cm: 1564, height_cm: 1524, max_load_kg: 4620, volume_m3: 3.66, type: 'ld' },
  { code: 'LD-6', name: 'LD-6(AKE)', length_cm: 1534, width_cm: 1564, height_cm: 1178, max_load_kg: 3530, volume_m3: 2.83, type: 'ld' },
  // LD-3 下层舱
  { code: 'LD-3', name: 'LD-3(AVE)', length_cm: 1534, width_cm: 1564, height_cm: 914, max_load_kg: 2320, volume_m3: 2.19, type: 'ld' },
  // LD-2 小型
  { code: 'LD-2', name: 'LD-2(AAU)', length_cm: 1468, width_cm: 1534, height_cm: 914, max_load_kg: 1590, volume_m3: 2.06, type: 'ld' },
  // LD-4
  { code: 'LD-4', name: 'LD-4(PLA)', length_cm: 1534, width_cm: 1564, height_cm: 1178, max_load_kg: 3400, volume_m3: 2.83, type: 'ld' },
  // LD-8
  { code: 'LD-8', name: 'LD-8(AMU)', length_cm: 1468, width_cm: 1534, height_cm: 1178, max_load_kg: 2300, volume_m3: 2.65, type: 'ld' },
  // LD-11 大型
  { code: 'LD-11', name: 'LD-11(AGK)', length_cm: 1534, width_cm: 1564, height_cm: 1524, max_load_kg: 5070, volume_m3: 3.66, type: 'ld' },
  // BULK 散货
  { code: 'BULK', name: '散货', length_cm: 0, width_cm: 0, height_cm: 0, max_load_kg: 6800, volume_m3: 0, type: 'bulk' },
];

// 推荐 ULD
export function recommendULD(cargoWeight: number, cargoVolume: number): string[] {
  return ULD_TYPES
    .filter(u => u.max_load_kg >= cargoWeight && u.type !== 'bulk')
    .sort((a, b) => a.max_load_kg - b.max_load_kg)
    .slice(0, 3)
    .map(u => u.code);
}

// 填充率评估
export function rateFill(volumeM3: number, uldCode: string): { rating: string; color: string; label: string } {
  const uld = ULD_TYPES.find(u => u.code === uldCode);
  if (!uld) return { rating: 'unknown', color: '#94A3B8', label: '未知' };
  const pct = volumeM3 / uld.volume_m3;
  if (pct >= 0.9) return { rating: 'full', color: '#16A34A', label: '🟢 满载 (>90%)' };
  if (pct >= 0.7) return { rating: 'good', color: '#2563EB', label: '🔵 良好 (70-90%)' };
  if (pct >= 0.5) return { rating: 'fair', color: '#F59E0B', label: '🟡 一般 (50-70%)' };
  return { rating: 'waste', color: '#DC2626', label: '⚫ 严重浪费 (<50%)' };
}

// 体积重计算（IATA标准：/6000）
export function calcVolumeWeight(length_cm: number, width_cm: number, height_cm: number): number {
  return (length_cm * width_cm * height_cm) / 6000;
}

// 计费重量（实际重 vs 体积重取大者）
export function calcChargeableWeight(actualWeight: number, length: number, width: number, height: number): number {
  return Math.max(actualWeight, calcVolumeWeight(length, width, height));
}

// 兼容 ULD 查询
export function getCompatibleULDs(cargoWeight: number): string[] {
  return ULD_TYPES.filter(u => u.max_load_kg >= cargoWeight && u.type !== 'bulk').map(u => u.code);
}
