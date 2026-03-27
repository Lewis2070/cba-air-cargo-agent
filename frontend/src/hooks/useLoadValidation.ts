// useLoadValidation.ts - 装载合理性验证算法
// 依据：IATA DGR 67th Edition + 波音767-300BCF FCOM
// v5.0 | 2026-03-26

import { useMemo } from 'react';
import { ULD_TYPES, calcVolumeWeight, calcChargeableWeight, recommendULD, rateFill } from '../data/uld_specs';
import { B767_300BCF, getPositionsByDeck } from '../data/b767_bcf_config';

export interface CargoItem {
  awb: string;
  description: string;
  weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  volume_m3?: number;
  is_dgr?: boolean;
  un_number?: string;
  packing_group?: string;
  category?: 'normal' | 'cold_chain' | 'valuable' | 'oversize' | 'bulk';
  priority?: 'high' | 'normal' | 'low';
}

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  weightFill_pct: number;
  volumeFill_pct: number;
  weightRating: ReturnType<typeof rateFill>;
  volumeRating: ReturnType<typeof rateFill>;
  recommendedULD?: string;
  remainingWeight_kg: number;
  remainingVolume_m3: number;
}

// 验证单个ULD的装载合理性
export function useULDValidation(
  uldType: string,
  cargoItems: CargoItem[]
): ValidationResult {
  return useMemo(() => {
    const uld = ULD_TYPES.find(u => u.code === uldType || u.altCode.includes(uldType));
    const warnings: string[] = [];
    const errors: string[] = [];

    if (!uld) {
      errors.push(`未知ULD类型: ${uldType}`);
      return { valid: false, warnings, errors, weightFill_pct: 0, volumeRating: rateFill(0), weightRating: rateFill(0), remainingWeight_kg: 0, remainingVolume_m3: 0 };
    }

    // 总重量和体积
    const totalWeight = cargoItems.reduce((s, i) => s + i.weight_kg, 0);
    const totalVolume = cargoItems.reduce((s, i) => {
      const v = i.volume_m3 || (i.length_cm * i.width_cm * i.height_cm / 6000);
      return s + v;
    }, 0);

    const weightFill_pct = uld.maxLoad > 0 ? (totalWeight / uld.maxLoad) * 100 : 0;
    const volumeFill_pct = uld.volume > 0 ? (totalVolume / uld.volume) * 100 : 0;
    const weightRating = rateFill(weightFill_pct);
    const volumeRating = rateFill(volumeFill_pct);
    const remainingWeight_kg = Math.max(0, uld.maxLoad - totalWeight);
    const remainingVolume_m3 = Math.max(0, uld.volume - totalVolume);

    // 重量超限
    if (weightFill_pct > 100) {
      errors.push(`⚠️ 超重: ${totalWeight}kg > ${uld.maxLoad}kg (ULD最大装载量)`);
    } else if (weightFill_pct > 90) {
      warnings.push(`重量接近上限: ${weightFill_pct.toFixed(1)}%`);
    }

    // 体积超限
    if (volumeFill_pct > 100) {
      errors.push(`⚠️ 超容积: ${totalVolume.toFixed(2)}m³ > ${uld.volume}m³ (ULD内部容积)`);
    } else if (volumeFill_pct > 90) {
      warnings.push(`容积接近上限: ${volumeFill_pct.toFixed(1)}%`);
    }

    // 体积填充过低
    if (volumeFill_pct < 30 && cargoItems.length > 0) {
      warnings.push(`⚠️ 容积利用率过低: ${volumeFill_pct.toFixed(1)}%，建议使用更小ULD`);
    }

    // DGR危险品检测
    const dgrItems = cargoItems.filter(i => i.is_dgr);
    if (dgrItems.length > 1) {
      errors.push(`⚠️ 危险品隔离冲突: ${dgrItems.length}件危险品不可同ULD`);
    }
    if (dgrItems.length === 1 && cargoItems.filter(i => !i.is_dgr).length > 0) {
      errors.push(`⚠️ DGR隔离规则: 危险品必须单独ULD装载`);
    }

    // 尺寸检测
    cargoItems.forEach(item => {
      if (item.length_cm > uld.intLength * 0.95) {
        errors.push(`⚠️ ${item.awb} 长度${item.length_cm}cm 超出ULD内长${uld.intLength}cm`);
      }
      if (item.width_cm > uld.intWidth * 0.95) {
        errors.push(`⚠️ ${item.awb} 宽度${item.width_cm}cm 超出ULD内宽${uld.intWidth}cm`);
      }
      if (item.height_cm > uld.intHeight * 0.95) {
        errors.push(`⚠️ ${item.awb} 高度${item.height_cm}cm 超出ULD内高${uld.intHeight}cm`);
      }
    });

    const valid = errors.length === 0;
    const recommendedULD = errors.length > 0 ? recommendULD(totalVolume, totalWeight)[0]?.code : undefined;

    return {
      valid, warnings, errors,
      weightFill_pct, volumeFill_pct,
      weightRating, volumeRating,
      recommendedULD,
      remainingWeight_kg, remainingVolume_m3,
    };
  }, [uldType, cargoItems]);
}

// 验证全机装载合理性
export function useAircraftLoadValidation(
  placedULDs: { position: string; uld_type: string; totalWeight: number; totalVolume: number; }[]
) {
  return useMemo(() => {
    const warnings: string[] = [];
    const errors: string[] = [];

    const mainPos = getPositionsByDeck('main');
    const lowerPos = getPositionsByDeck('lower');
    const mainMax = mainPos.reduce((s, p) => s + p.maxWeight_kg, 0);
    const lowerMax = lowerPos.reduce((s, p) => s + p.maxWeight_kg, 0);

    const mainWeight = placedULDs
      .filter(p => mainPos.some(m => m.code === p.position))
      .reduce((s, p) => s + p.totalWeight, 0);
    const lowerWeight = placedULDs
      .filter(p => lowerPos.some(l => l.code === p.position))
      .reduce((s, p) => s + p.totalWeight, 0);

    if (mainWeight > mainMax) errors.push(`主舱超重: ${(mainWeight/1000).toFixed(1)}t > ${(mainMax/1000).toFixed(0)}t`);
    if (lowerWeight > lowerMax) errors.push(`下舱超重: ${(lowerWeight/1000).toFixed(1)}t > ${(lowerMax/1000).toFixed(0)}t`);

    return { valid: errors.length === 0, warnings, errors, mainWeight, lowerWeight, mainMax, lowerMax };
  }, [placedULDs]);
}
