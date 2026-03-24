// 计费重计算
// IATA规则: 体积重 = 长×宽×高(cm)÷6000, 计费重 = max(毛重, 体积重)

export const VOLUMETRIC_DIVISOR = 6000;

export function calcVolumeWeight(length_cm: number, width_cm: number, height_cm: number): number {
  return (length_cm * width_cm * height_cm) / VOLUMETRIC_DIVISOR;
}

export function calcBillableWeight(cargo: { weight_kg: number; volume_m3: number; length_cm?: number; width_cm?: number; height_cm?: number }): number {
  if (cargo.length_cm && cargo.width_cm && cargo.height_cm) {
    return Math.max(cargo.weight_kg, calcVolumeWeight(cargo.length_cm, cargo.width_cm, cargo.height_cm));
  }
  return Math.max(cargo.weight_kg, cargo.volume_m3 * 167);
}

export function calcDensity(cargo: { weight_kg: number; volume_m3: number }): number {
  return cargo.volume_m3 > 0 ? cargo.weight_kg / cargo.volume_m3 : 9999;
}

export function sortByDensityDesc<T extends { weight_kg: number; volume_m3: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => calcDensity(b) - calcDensity(a));
}
