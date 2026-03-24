// ULD校验引擎 - DGR隔离 + 尺寸 + 重量 + 高度
import type { CargoItem, UldType, UldValidationResult, ValidationError, ValidationWarning } from "../types";
import dgrData from "../../public/docs/dgr_rules.json";

const DGR_RULES = dgrData.dgr_classes as Record<string, any>;
const SEPARATION_RULES = dgrData.dgr_classes as Record<string, { segregation: string[]; must_separate_uld: boolean }>;

// ULD内径尺寸 (cm)
const ULD_INNER: Record<UldType, { length: number; width: number; height: number; maxWeight: number; maxVolume: number }> = {
  P1P: { length: 224, width: 318, height: 300, maxWeight: 4626, maxVolume: 14.32 },
  PAG: { length: 224, width: 318, height: 300, maxWeight: 4626, maxVolume: 14.32 },
  PMC: { length: 317, width: 223, height: 160, maxWeight: 4626, maxVolume: 13.5 },
  AKE: { length: 153, width: 198, height: 160, maxWeight: 1588, maxVolume: 4.9 },
  AVP: { length: 150, width: 120, height: 120, maxWeight: 1150, maxVolume: 3.8 },
  RKN: { length: 200, width: 150, height: 160, maxWeight: 2500, maxVolume: 6.5 },
};

export interface UldValidatorOptions {
  uldType: UldType;
  cargoList: CargoItem[];
  allCargoInFlight?: CargoItem[];
}

export function validateULD({ uldType, cargoList, allCargoInFlight = [] }: UldValidatorOptions): UldValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const spec = ULD_INNER[uldType];
  if (!spec) { errors.push({ type: "ULD_TYPE", message: `未知ULD类型: ${uldType}` }); return { valid: false, errors, warnings, stats: emptyStats() }; }

  const dgrCargo = cargoList.filter(c => c.is_dgr && c.dgr_class);
  const totalWeight = cargoList.reduce((s, c) => s + c.weight_kg, 0);
  const totalVolume = cargoList.reduce((s, c) => s + c.volume_m3, 0);
  const stackHeight = cargoList.reduce((s, c) => s + (c.height_cm || 0), 0);

  // 1. DGR隔离校验
  for (const cargo of dgrCargo) {
    const rule = SEPARATION_RULES[cargo.dgr_class || ""];
    if (!rule) continue;
    for (const conflictClass of rule.segregation) {
      const conflict = cargoList.find(c => c.dgr_class === conflictClass && c.id !== cargo.id);
      if (conflict) {
        const cls1Name = DGR_RULES[cargo.dgr_class]?.name_cn || cargo.dgr_class;
        const cls2Name = DGR_RULES[conflictClass]?.name_cn || conflictClass;
        errors.push({ type: "DGR", cargo: cargo.awb, message: `危险品类${cls1Name}(${cargo.dgr_class})与${cls2Name}(${conflictClass})不得同板装载` });
      }
    }
  }

  // 2. 尺寸校验
  for (const cargo of cargoList) {
    if (cargo.length_cm && cargo.width_cm) {
      if (cargo.length_cm > spec.length || cargo.width_cm > spec.width) {
        errors.push({ type: "DIMENSION", cargo: cargo.awb, message: `货物${cargo.awb}尺寸(${cargo.length_cm}×${cargo.width_cm}cm)超出ULD ${uldType}内径(${spec.length}×${spec.width}cm)` });
      }
    }
  }

  // 3. 重量校验
  if (totalWeight > spec.maxWeight) {
    errors.push({ type: "WEIGHT", message: `板总重量${totalWeight}kg超过ULD ${uldType}限重${spec.maxWeight}kg` });
  }

  // 4. 高度校验
  if (stackHeight > spec.height && stackHeight > 0) {
    errors.push({ type: "HEIGHT", message: `堆叠总高度${stackHeight}cm超过ULD ${uldType}限高${spec.height}cm` });
  }

  // 5. 体积利用率警告
  const volUtil = (totalVolume / spec.maxVolume) * 100;
  if (volUtil < 50 && cargoList.length > 0) {
    warnings.push({ type: "LOW_UTIL", message: `体积利用率仅${volUtil.toFixed(1)}%，建议增加货物填充` });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalWeight_kg: totalWeight,
      totalVolume_m3: Math.round(totalVolume * 100) / 100,
      volumeUtil_pct: Math.round(volUtil * 10) / 10,
      pieceCount: cargoList.reduce((s, c) => s + c.pieces, 0),
      dgrClasses: [...new Set(dgrCargo.map(c => c.dgr_class || ""))],
    },
  };
}

function emptyStats() { return { totalWeight_kg: 0, totalVolume_m3: 0, volumeUtil_pct: 0, pieceCount: 0, dgrClasses: [] }; }
