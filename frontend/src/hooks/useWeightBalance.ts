// 重心平衡计算 Hook
// 重心位置(m) = Σ(重量_i × 力臂_i) / Σ重量_i
// 重心指数(%) = (重心位置 - MAC前缘) / MAC × 100

import { useMemo } from "react";
import type { UldPlacement, AircraftConfig, CGResult, HoldPhase } from "../types";

interface UseWeightBalanceOptions {
  placements: UldPlacement[];
  aircraft: AircraftConfig;
  phase?: HoldPhase;
}

export function useWeightBalance({ placements, aircraft, phase = "takeoff" }: UseWeightBalanceOptions): CGResult {
  return useMemo(() => calculateCG(placements, aircraft, phase), [placements, aircraft, phase]);
}

export function calculateCG(placements: UldPlacement[], aircraft: AircraftConfig, phase: HoldPhase = "takeoff"): CGResult {
  const limits = aircraft.cg_limits[phase];
  const macLE = aircraft.mac_leading_edge_m;
  const mac = aircraft.mac_m;

  const totalMoment = placements.reduce((sum, p) => sum + p.uld.total_weight_kg * p.position.arm_m, 0);
  const totalWeight = placements.reduce((sum, p) => sum + p.uld.total_weight_kg, 0);
  const totalVolume = placements.reduce((sum, p) => sum + p.uld.total_volume_m3, 0);
  const cgPosition_m = totalWeight > 0 ? totalMoment / totalWeight : macLE;
  const cgIndex_pct = ((cgPosition_m - macLE) / mac) * 100;
  const volumeUtil_pct = aircraft.max_volume_m3 > 0 ? (totalVolume / aircraft.max_volume_m3) * 100 : 0;
  const isInLimits = cgIndex_pct >= limits.min_pct && cgIndex_pct <= limits.max_pct;
  const isWarning = cgIndex_pct < limits.min_pct + 3 || cgIndex_pct > limits.max_pct - 3;
  const advice = genAdvice(cgIndex_pct, limits, placements);

  return {
    cgPosition_m: Math.round(cgPosition_m * 100) / 100,
    cgIndex_pct: Math.round(cgIndex_pct * 10) / 10,
    totalWeight_kg: totalWeight,
    totalMoment_kgm: Math.round(totalMoment),
    totalVolume_m3: Math.round(totalVolume * 100) / 100,
    volumeUtil_pct: Math.round(volumeUtil_pct * 10) / 10,
    isInLimits,
    isWarning,
    limitMin_pct: limits.min_pct,
    limitMax_pct: limits.max_pct,
    advice,
    phase,
  };
}

function genAdvice(cgIndex: number, limits: { min_pct: number; max_pct: number }, placements: UldPlacement[]): string {
  if (cgIndex >= limits.min_pct + 3 && cgIndex <= limits.max_pct - 3) return "✓ 重心位置良好";
  const forward = placements.filter(p => p.position.row === "forward").sort((a, b) => b.uld.total_weight_kg - a.uld.total_weight_kg);
  const aft = placements.filter(p => p.position.row === "aft").sort((a, b) => b.uld.total_weight_kg - a.uld.total_weight_kg);
  if (cgIndex < limits.min_pct) {
    if (forward.length > 0) return `重心偏前(${cgIndex.toFixed(1)}%)，建议将 ${forward[0].uld.id} 移至后舱`;
    return `重心偏前(${cgIndex.toFixed(1)}%)，建议在后舱增加货物`;
  } else {
    if (aft.length > 0) return `重心偏后(${cgIndex.toFixed(1)}%)，建议将 ${aft[0].uld.id} 移至前舱`;
    return `重心偏后(${cgIndex.toFixed(1)}%)，建议在前舱增加货物`;
  }
}
