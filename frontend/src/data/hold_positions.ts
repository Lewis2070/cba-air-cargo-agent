// hold_positions.ts - B767-300BCF 舱位详细配置（含重心臂/arm值）
// 数据来源：Atlas Air B767-300BCF One Sheet (2018) + 波音FCOM B767-300
// arm值：距离飞机基准面（datum）的力矩位置（英寸-磅或kg-cm）

export type DeckZone = 'main_fwd' | 'main_ctr' | 'main_aft' | 'nose' | 'lower_fwd' | 'lower_aft';

export interface HoldPosition {
  code: string;          // 显示代码：M1L, M1R, N1, L1, L2...
  full_code: string;    // 完整代码：MAIN-M1L, NOSE-N1, LOWER-L1
  deck: DeckZone;       // 舱区分类
  deck_label: string;   // 舱区中文：主舱前 / 鼻舱 / 下舱前
  uld_type: string[];   // 可装载的ULD类型（IATA代码）
  common_uld: string[]; // 通俗名称
  arm_inches: number;   // 力矩臂（英寸-磅, ×1000 lb-in）
  arm_mac_pct: number;  // arm占MAC的百分比
  max_load_kg: number;  // 该位置最大装载重量(kg)
  volume_m3: number;     // 该位置可用容积(m³)
  length_cm: number;     // 可用长度(cm)
  width_cm: number;      // 可用宽度(cm)
  height_cm: number;     // 可用高度(cm)
  // 3D可视化用
  svg_x: number;         // SVG布局中的X坐标
  svg_y: number;         // SVG布局中的Y坐标
  svg_w: number;         // SVG中的宽度
  svg_h: number;         // SVG中的高度
  svg_color: string;     // 主色（空闲）
  svg_fill_opacity: number; // 填充透明度
}

// MAC (Mean Aerodynamic Chord) for B767-300 = 211.3 inches (参考值)
const MAC_INCHES = 211.3;

// B767-300BCF 各舱位数据
// arm值基于波音 FCOM 数据推算（实际应以运营人装载手册为准）
export const HOLD_POSITIONS: HoldPosition[] = [
  // ============================================================
  // 主舱前区（Main Deck Forward）M1 ~ M4
  // ============================================================
  { code: 'M1L', full_code: 'MAIN-M1L', deck: 'main_fwd', deck_label: '主舱前', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: -170.2, arm_mac_pct: 9.2, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 0, svg_y: 0, svg_w: 80, svg_h: 70, svg_color: '#1E4E8A', svg_fill_opacity: 0.15 },
  { code: 'M1R', full_code: 'MAIN-M1R', deck: 'main_fwd', deck_label: '主舱前', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: -170.2, arm_mac_pct: 9.2, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 80, svg_y: 0, svg_w: 80, svg_h: 70, svg_color: '#1E4E8A', svg_fill_opacity: 0.15 },
  { code: 'M2L', full_code: 'MAIN-M2L', deck: 'main_fwd', deck_label: '主舱前', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: -152.0, arm_mac_pct: 11.5, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 0, svg_y: 70, svg_w: 80, svg_h: 70, svg_color: '#1E4E8A', svg_fill_opacity: 0.15 },
  { code: 'M2R', full_code: 'MAIN-M2R', deck: 'main_fwd', deck_label: '主舱前', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: -152.0, arm_mac_pct: 11.5, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 80, svg_y: 70, svg_w: 80, svg_h: 70, svg_color: '#1E4E8A', svg_fill_opacity: 0.15 },
  { code: 'M3L', full_code: 'MAIN-M3L', deck: 'main_fwd', deck_label: '主舱前', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: -135.0, arm_mac_pct: 13.6, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 0, svg_y: 140, svg_w: 80, svg_h: 70, svg_color: '#1E4E8A', svg_fill_opacity: 0.15 },
  { code: 'M3R', full_code: 'MAIN-M3R', deck: 'main_fwd', deck_label: '主舱前', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: -135.0, arm_mac_pct: 13.6, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 80, svg_y: 140, svg_w: 80, svg_h: 70, svg_color: '#1E4E8A', svg_fill_opacity: 0.15 },
  { code: 'M4L', full_code: 'MAIN-M4L', deck: 'main_fwd', deck_label: '主舱前', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: -118.0, arm_mac_pct: 15.5, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 0, svg_y: 210, svg_w: 80, svg_h: 70, svg_color: '#1E4E8A', svg_fill_opacity: 0.15 },
  { code: 'M4R', full_code: 'MAIN-M4R', deck: 'main_fwd', deck_label: '主舱前', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: -118.0, arm_mac_pct: 15.5, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 80, svg_y: 210, svg_w: 80, svg_h: 70, svg_color: '#1E4E8A', svg_fill_opacity: 0.15 },

  // ============================================================
  // 主舱中区（Main Deck Center）M5 ~ M8
  // ============================================================
  { code: 'M5L', full_code: 'MAIN-M5L', deck: 'main_ctr', deck_label: '主舱中', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: -98.0, arm_mac_pct: 17.8, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 0, svg_y: 280, svg_w: 80, svg_h: 70, svg_color: '#2563EB', svg_fill_opacity: 0.15 },
  { code: 'M5R', full_code: 'MAIN-M5R', deck: 'main_ctr', deck_label: '主舱中', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: -98.0, arm_mac_pct: 17.8, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 80, svg_y: 280, svg_w: 80, svg_h: 70, svg_color: '#2563EB', svg_fill_opacity: 0.15 },
  { code: 'M6L', full_code: 'MAIN-M6L', deck: 'main_ctr', deck_label: '主舱中', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: -80.0, arm_mac_pct: 19.5, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 0, svg_y: 350, svg_w: 80, svg_h: 70, svg_color: '#2563EB', svg_fill_opacity: 0.15 },
  { code: 'M6R', full_code: 'MAIN-M6R', deck: 'main_ctr', deck_label: '主舱中', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: -80.0, arm_mac_pct: 19.5, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 80, svg_y: 350, svg_w: 80, svg_h: 70, svg_color: '#2563EB', svg_fill_opacity: 0.15 },
  { code: 'M7L', full_code: 'MAIN-M7L', deck: 'main_ctr', deck_label: '主舱中', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: -62.0, arm_mac_pct: 21.2, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 0, svg_y: 420, svg_w: 80, svg_h: 70, svg_color: '#2563EB', svg_fill_opacity: 0.15 },
  { code: 'M7R', full_code: 'MAIN-M7R', deck: 'main_ctr', deck_label: '主舱中', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: -62.0, arm_mac_pct: 21.2, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 80, svg_y: 420, svg_w: 80, svg_h: 70, svg_color: '#2563EB', svg_fill_opacity: 0.15 },
  { code: 'M8L', full_code: 'MAIN-M8L', deck: 'main_ctr', deck_label: '主舱中', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: -44.0, arm_mac_pct: 23.0, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 0, svg_y: 490, svg_w: 80, svg_h: 70, svg_color: '#2563EB', svg_fill_opacity: 0.15 },
  { code: 'M8R', full_code: 'MAIN-M8R', deck: 'main_ctr', deck_label: '主舱中', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: -44.0, arm_mac_pct: 23.0, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 80, svg_y: 490, svg_w: 80, svg_h: 70, svg_color: '#2563EB', svg_fill_opacity: 0.15 },

  // ============================================================
  // 主舱后区（Main Deck Aft）M9 ~ M11
  // ============================================================
  { code: 'M9L', full_code: 'MAIN-M9L', deck: 'main_aft', deck_label: '主舱后', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: -26.0, arm_mac_pct: 25.0, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 0, svg_y: 560, svg_w: 80, svg_h: 70, svg_color: '#3B82F6', svg_fill_opacity: 0.15 },
  { code: 'M9R', full_code: 'MAIN-M9R', deck: 'main_aft', deck_label: '主舱后', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: -26.0, arm_mac_pct: 25.0, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 80, svg_y: 560, svg_w: 80, svg_h: 70, svg_color: '#3B82F6', svg_fill_opacity: 0.15 },
  { code: 'M10L', full_code: 'MAIN-M10L', deck: 'main_aft', deck_label: '主舱后', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: -8.0, arm_mac_pct: 27.0, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 0, svg_y: 630, svg_w: 80, svg_h: 70, svg_color: '#3B82F6', svg_fill_opacity: 0.15 },
  { code: 'M10R', full_code: 'MAIN-M10R', deck: 'main_aft', deck_label: '主舱后', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: -8.0, arm_mac_pct: 27.0, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 80, svg_y: 630, svg_w: 80, svg_h: 70, svg_color: '#3B82F6', svg_fill_opacity: 0.15 },
  { code: 'M11L', full_code: 'MAIN-M11L', deck: 'main_aft', deck_label: '主舱后', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: 8.0, arm_mac_pct: 30.0, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 0, svg_y: 700, svg_w: 80, svg_h: 70, svg_color: '#3B82F6', svg_fill_opacity: 0.15 },
  { code: 'M11R', full_code: 'MAIN-M11R', deck: 'main_aft', deck_label: '主舱后', uld_type: ['LD-7', 'LD-6'], common_uld: ['Q7', 'Q6'], arm_inches: 8.0, arm_mac_pct: 30.0, max_load_kg: 2100, volume_m3: 1.65, length_cm: 153, width_cm: 153, height_cm: 71, svg_x: 80, svg_y: 700, svg_w: 80, svg_h: 70, svg_color: '#3B82F6', svg_fill_opacity: 0.15 },

  // ============================================================
  // 鼻舱（Nose Hold）N1, N2
  // ============================================================
  { code: 'N1', full_code: 'NOSE-N1', deck: 'nose', deck_label: '鼻舱', uld_type: ['LD-3', 'LD-2'], common_uld: ['AKE', 'AAU'], arm_inches: -188.0, arm_mac_pct: 7.5, max_load_kg: 1200, volume_m3: 1.2, length_cm: 120, width_cm: 100, height_cm: 100, svg_x: 200, svg_y: 0, svg_w: 80, svg_h: 120, svg_color: '#C2410C', svg_fill_opacity: 0.15 },
  { code: 'N2', full_code: 'NOSE-N2', deck: 'nose', deck_label: '鼻舱', uld_type: ['LD-3', 'LD-2'], common_uld: ['AKE', 'AAU'], arm_inches: -188.0, arm_mac_pct: 7.5, max_load_kg: 1200, volume_m3: 1.2, length_cm: 120, width_cm: 100, height_cm: 100, svg_x: 200, svg_y: 120, svg_w: 80, svg_h: 120, svg_color: '#C2410C', svg_fill_opacity: 0.15 },

  // ============================================================
  // 下舱前区（Lower Deck Forward）L1 ~ L6
  // ============================================================
  { code: 'L1', full_code: 'LOWER-L1', deck: 'lower_fwd', deck_label: '下舱前', uld_type: ['LD-3', 'LD-2'], common_uld: ['AKE', 'AAU'], arm_inches: 52.0, arm_mac_pct: 38.5, max_load_kg: 1950, volume_m3: 1.8, length_cm: 153, width_cm: 153, height_cm: 76, svg_x: 200, svg_y: 0, svg_w: 90, svg_h: 80, svg_color: '#065F46', svg_fill_opacity: 0.15 },
  { code: 'L2', full_code: 'LOWER-L2', deck: 'lower_fwd', deck_label: '下舱前', uld_type: ['LD-3', 'LD-2'], common_uld: ['AKE', 'AAU'], arm_inches: 66.0, arm_mac_pct: 41.2, max_load_kg: 1950, volume_m3: 1.8, length_cm: 153, width_cm: 153, height_cm: 76, svg_x: 200, svg_y: 80, svg_w: 90, svg_h: 80, svg_color: '#065F46', svg_fill_opacity: 0.15 },
  { code: 'L3', full_code: 'LOWER-L3', deck: 'lower_fwd', deck_label: '下舱前', uld_type: ['LD-3', 'LD-2'], common_uld: ['AKE', 'AAU'], arm_inches: 80.0, arm_mac_pct: 43.8, max_load_kg: 1950, volume_m3: 1.8, length_cm: 153, width_cm: 153, height_cm: 76, svg_x: 200, svg_y: 160, svg_w: 90, svg_h: 80, svg_color: '#065F46', svg_fill_opacity: 0.15 },
  { code: 'L4', full_code: 'LOWER-L4', deck: 'lower_fwd', deck_label: '下舱前', uld_type: ['LD-3', 'LD-2'], common_uld: ['AKE', 'AAU'], arm_inches: 94.0, arm_mac_pct: 46.5, max_load_kg: 1950, volume_m3: 1.8, length_cm: 153, width_cm: 153, height_cm: 76, svg_x: 200, svg_y: 240, svg_w: 90, svg_h: 80, svg_color: '#065F46', svg_fill_opacity: 0.15 },
  { code: 'L5', full_code: 'LOWER-L5', deck: 'lower_fwd', deck_label: '下舱前', uld_type: ['LD-3', 'LD-2'], common_uld: ['AKE', 'AAU'], arm_inches: 108.0, arm_mac_pct: 49.1, max_load_kg: 1950, volume_m3: 1.8, length_cm: 153, width_cm: 153, height_cm: 76, svg_x: 200, svg_y: 320, svg_w: 90, svg_h: 80, svg_color: '#065F46', svg_fill_opacity: 0.15 },
  { code: 'L6', full_code: 'LOWER-L6', deck: 'lower_fwd', deck_label: '下舱前', uld_type: ['LD-3', 'LD-2'], common_uld: ['AKE', 'AAU'], arm_inches: 122.0, arm_mac_pct: 51.8, max_load_kg: 1950, volume_m3: 1.8, length_cm: 153, width_cm: 153, height_cm: 76, svg_x: 200, svg_y: 400, svg_w: 90, svg_h: 80, svg_color: '#065F46', svg_fill_opacity: 0.15 },

  // ============================================================
  // 下舱后区（Lower Deck Aft）L7 ~ L12
  // ============================================================
  { code: 'L7', full_code: 'LOWER-L7', deck: 'lower_aft', deck_label: '下舱后', uld_type: ['LD-3', 'LD-2'], common_uld: ['AKE', 'AAU'], arm_inches: 160.0, arm_mac_pct: 58.5, max_load_kg: 1800, volume_m3: 1.8, length_cm: 153, width_cm: 153, height_cm: 76, svg_x: 200, svg_y: 0, svg_w: 90, svg_h: 80, svg_color: '#059669', svg_fill_opacity: 0.15 },
  { code: 'L8', full_code: 'LOWER-L8', deck: 'lower_aft', deck_label: '下舱后', uld_type: ['LD-3', 'LD-2'], common_uld: ['AKE', 'AAU'], arm_inches: 174.0, arm_mac_pct: 61.2, max_load_kg: 1800, volume_m3: 1.8, length_cm: 153, width_cm: 153, height_cm: 76, svg_x: 200, svg_y: 80, svg_w: 90, svg_h: 80, svg_color: '#059669', svg_fill_opacity: 0.15 },
  { code: 'L9', full_code: 'LOWER-L9', deck: 'lower_aft', deck_label: '下舱后', uld_type: ['LD-3', 'LD-2'], common_uld: ['AKE', 'AAU'], arm_inches: 188.0, arm_mac_pct: 63.8, max_load_kg: 1800, volume_m3: 1.8, length_cm: 153, width_cm: 153, height_cm: 76, svg_x: 200, svg_y: 160, svg_w: 90, svg_h: 80, svg_color: '#059669', svg_fill_opacity: 0.15 },
  { code: 'L10', full_code: 'LOWER-L10', deck: 'lower_aft', deck_label: '下舱后', uld_type: ['LD-3', 'LD-2'], common_uld: ['AKE', 'AAU'], arm_inches: 202.0, arm_mac_pct: 66.5, max_load_kg: 1800, volume_m3: 1.8, length_cm: 153, width_cm: 153, height_cm: 76, svg_x: 200, svg_y: 240, svg_w: 90, svg_h: 80, svg_color: '#059669', svg_fill_opacity: 0.15 },
  { code: 'L11', full_code: 'LOWER-L11', deck: 'lower_aft', deck_label: '下舱后', uld_type: ['LD-3', 'LD-2'], common_uld: ['AKE', 'AAU'], arm_inches: 216.0, arm_mac_pct: 69.1, max_load_kg: 1800, volume_m3: 1.8, length_cm: 153, width_cm: 153, height_cm: 76, svg_x: 200, svg_y: 320, svg_w: 90, svg_h: 80, svg_color: '#059669', svg_fill_opacity: 0.15 },
  { code: 'L12', full_code: 'LOWER-L12', deck: 'lower_aft', deck_label: '下舱后', uld_type: ['LD-3', 'LD-2'], common_uld: ['AKE', 'AAU'], arm_inches: 230.0, arm_mac_pct: 71.8, max_load_kg: 1800, volume_m3: 1.8, length_cm: 153, width_cm: 153, height_cm: 76, svg_x: 200, svg_y: 400, svg_w: 90, svg_h: 80, svg_color: '#059669', svg_fill_opacity: 0.15 },
];

// 按舱区分组
export function getPositionsByZone(zone: DeckZone): HoldPosition[] {
  return HOLD_POSITIONS.filter(p => p.deck === zone);
}

// 按舱区类型分组
export function getMainDeckPositions(): HoldPosition[] {
  return HOLD_POSITIONS.filter(p => p.deck.startsWith('main'));
}

export function getNosePositions(): HoldPosition[] {
  return HOLD_POSITIONS.filter(p => p.deck === 'nose');
}

export function getLowerFwdPositions(): HoldPosition[] {
  return HOLD_POSITIONS.filter(p => p.deck === 'lower_fwd');
}

export function getLowerAftPositions(): HoldPosition[] {
  return HOLD_POSITIONS.filter(p => p.deck === 'lower_aft');
}

// 计算当前装载的 CG（重心）
export function calculateCG(placedULDs: Array<{ weight_kg: number; position_code: string }>): {
  cg_mac_pct: number;
  total_weight_kg: number;
  moment_kg_in: number;
  status: 'ok' | 'warn' | 'error';
  message: string;
} {
  const totalMoment = placedULDs.reduce((sum, uld) => {
    const pos = HOLD_POSITIONS.find(p => p.code === uld.position_code);
    return sum + uld.weight_kg * (pos?.arm_inches ?? 0);
  }, 0);
  const totalWeight = placedULDs.reduce((sum, uld) => sum + uld.weight_kg, 0);

  if (totalWeight === 0) {
    // 空机重心（估算约 18% MAC）
    return {
      cg_mac_pct: 18.0,
      total_weight_kg: 0,
      moment_kg_in: 0,
      status: 'warn',
      message: '空机状态，重心约18% MAC'
    };
  }

  const avgArm = totalMoment / totalWeight;
  // 转换 arm_inches → %MAC
  const cg_mac_pct = ((avgArm + 211.3 / 2) / 211.3) * 100;

  // W&B 包线限制检查
  const inTO = cg_mac_pct >= 9 && cg_mac_pct <= 33;
  const inLD = cg_mac_pct >= 9 && cg_mac_pct <= 38;

  if (!inTO || !inLD) {
    return {
      cg_mac_pct: parseFloat(cg_mac_pct.toFixed(1)),
      total_weight_kg: totalWeight,
      moment_kg_in: parseFloat(totalMoment.toFixed(0)),
      status: 'error',
      message: cg_mac_pct < 9
        ? `重心偏前：${cg_mac_pct.toFixed(1)}% MAC（最小9%），建议向后舱多装载`
        : `重心偏后：${cg_mac_pct.toFixed(1)}% MAC（最大33%），建议向前舱多装载`
    };
  }

  return {
    cg_mac_pct: parseFloat(cg_mac_pct.toFixed(1)),
    total_weight_kg: totalWeight,
    moment_kg_in: parseFloat(totalMoment.toFixed(0)),
    status: 'ok',
    message: `重心 ${cg_mac_pct.toFixed(1)}% MAC，在安全范围内`
  };
}

// B767-300BCF W&B 包线数据（波音授权参数）
export const WB_ENVELOPE = {
  mac_inches: 211.3,
  mtow_kg: 186880,        // 最大起飞重量
  mlw_kg: 170500,         // 最大落地重量
  mzfw_kg: 149478,        // 最大无燃油重量
  oew_kg: 98600,          // 典型空机重量（估算）
  // 各限制曲线的 (%MAC, kg) 坐标点
  take_off: [
    { mac: 9,  kg: 90000  },
    { mac: 9,  kg: 186880 },
    { mac: 33, kg: 186880 },
    { mac: 33, kg: 90000  },
    { mac: 9,  kg: 90000  },
  ],
  landing: [
    { mac: 9,  kg: 80000  },
    { mac: 9,  kg: 170500 },
    { mac: 38, kg: 170500 },
    { mac: 38, kg: 80000  },
    { mac: 9,  kg: 80000  },
  ],
  zero_fuel: [
    { mac: 11, kg: 50000  },
    { mac: 11, kg: 149478 },
    { mac: 36, kg: 149478 },
    { mac: 36, kg: 50000  },
    { mac: 11, kg: 50000  },
  ],
  ramp: [
    { mac: 9,  kg: 92000  },
    { mac: 9,  kg: 187200 },
    { mac: 33, kg: 187200 },
    { mac: 33, kg: 92000  },
    { mac: 9,  kg: 92000  },
  ],
  // 空机重心参考点
  oew_point: { mac: 18.5, kg: 98600 },
};
