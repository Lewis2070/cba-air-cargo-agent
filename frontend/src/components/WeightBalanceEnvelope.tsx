// WeightBalanceEnvelope.tsx - 专业载重平衡包线图 (SVG)
// Boeing 767-300BCF 标准六线包线图
// v5.0 | 2026-03-26

import React, { useMemo } from 'react';
import { Tag, Tooltip } from 'antd';
import { B767_300BCF } from '../data/b767_bcf_config';

interface Props {
  totalWeight_kg: number;         // 当前总重量 kg
  fuel_kg: number;                // 当前燃油 kg
  cargoWeight_kg: number;         // 当前货物重量 kg
  currentCG_pct: number;          // 当前重心 %MAC
  phase?: 'takeoff' | 'cruise' | 'landing';
}

// 重量单位转换
const KG2LBS = 2.20462;
const LBS2KG = 0.453592;

// SVG 尺寸
const W = 560, H = 420;
const PAD = { top: 30, right: 60, bottom: 50, left: 70 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

// 转换函数
function w2x(weight_lbs: number, yMin: number, yMax: number): number {
  return PAD.left + (weight_lbs / (yMax - yMin)) * INNER_W;
}
function h2y(weight_lbs: number, yMin: number, yMax: number): number {
  return PAD.top + INNER_H - (weight_lbs / (yMax - yMin)) * INNER_H;
}
function cg2x(cg_pct: number, xMin = 0, xMax = 50): number {
  return PAD.left + (cg_pct / (xMax - xMin)) * INNER_W;
}

// 计算两条线的交点
function lineIntersection(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): { x: number; y: number } | null {
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-10) return null;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
}

// 生成前重心限制线（X轴像素坐标）
function buildForwardCGLimit(cfg: typeof B767_300BCF.envelope) {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < cfg.fwdCG.length - 1; i++) {
    const p1 = cfg.fwdCG[i], p2 = cfg.fwdCG[i + 1];
    for (let j = 0; j <= 10; j++) {
      const t = j / 10;
      const w = p1.w_lbs + t * (p2.w_lbs - p1.w_lbs);
      const cg = p1.cg_pct + t * (p2.cg_pct - p1.cg_pct);
      pts.push({ x: cg2x(cg), y: h2y(w, cfg.yMin, cfg.yMax) });
    }
  }
  return pts;
}

// 生成后重心限制线
function buildAftCGLimit(cfg: typeof B767_300BCF.envelope) {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < cfg.aftCG.length - 1; i++) {
    const p1 = cfg.aftCG[i], p2 = cfg.aftCG[i + 1];
    for (let j = 0; j <= 10; j++) {
      const t = j / 10;
      const w = p1.w_lbs + t * (p2.w_lbs - p1.w_lbs);
      const cg = p1.cg_pct + t * (p2.cg_pct - p1.cg_pct);
      pts.push({ x: cg2x(cg), y: h2y(w, cfg.yMin, cfg.yMax) });
    }
  }
  return pts;
}

// 生成安全包络多边形
function buildEnvelopePolygon(cfg: typeof B767_300BCF.envelope) {
  const fwd = buildForwardCGLimit(cfg);
  const aft = buildAftCGLimit(cfg);
  const mtow_y = h2y(cfg.weights_lbs.mtow, cfg.yMin, cfg.yMax);
  const mzfw_y = h2y(cfg.weights_lbs.mzfw, cfg.yMin, cfg.yMax);
  const oew_y = h2y(cfg.weights_lbs.oew, cfg.yMin, cfg.yMax);

  // 起点：空机重量点（前限线起点）
  const start = fwd[0];
  // 终点：MZFW与前限的交点附近
  const end = fwd[fwd.length - 1];

  // 前限线（从空机→MTOW）
  const fwdTop = fwd.slice(0, Math.floor(fwd.length / 2));
  // MTOW水平线
  const mtowLeft = { x: fwdTop[fwdTop.length - 1].x, y: mtow_y };
  const mtowRight = { x: aft[Math.floor(aft.length / 2)].x, y: mtow_y };
  // 后限线上段（从MTOW→MZFW）
  const aftTop = aft.slice(Math.floor(aft.length / 2), Math.floor(aft.length * 0.75));
  // MZFW水平线
  const mzfwRight = aftTop[aftTop.length - 1];
  const mzfwLeft = { x: fwdTop[fwdTop.length - 1].x, y: mzfw_y };
  // 后限线下段（从MZFW→空机）
  const aftBot = aft.slice(Math.floor(aft.length * 0.75));

  return [start, ...fwdTop, mtowLeft, mtowRight, ...aftTop, mzfwRight, mzfwLeft, ...aftBot];
}

const PHASE_LABELS = {
  takeoff:  { text: '起飞 TAKEOFF',  color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  cruise:   { text: '巡航 CRUISE',   color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  landing:  { text: '落地 LANDING',  color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
};

export default function WeightBalanceEnvelope({
  totalWeight_kg, fuel_kg, cargoWeight_kg, currentCG_pct, phase = 'takeoff'
}: Props) {
  const cfg = B767_300BCF.envelope;
  const mtow_lbs = B767_300BCF.weights_lbs.mtow;
  const mzfw_lbs = B767_300BCF.weights_lbs.mzfw;
  const mlw_lbs = B767_300BCF.weights_lbs.mlw;
  const oew_lbs = B767_300BCF.weights_lbs.oew;

  const totalWeight_lbs = totalWeight_kg * KG2LBS;

  // 当前重心X坐标
  const cgX = cg2x(currentCG_pct);
  const cgY = h2y(totalWeight_lbs, cfg.yMin, cfg.yMax);
  const phaseInfo = PHASE_LABELS[phase];

  // 安全包络区域
  const polyPts = useMemo(() => buildEnvelopePolygon(cfg), [cfg]);
  const polyPath = polyPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

  // 越限判断
  const isOverweight = totalWeight_lbs > mtow_lbs;
  const fwdLimit = useMemo(() => {
    const w1 = cfg.fwdCG[0], w2 = cfg.fwdCG[1];
    const t = Math.min((totalWeight_lbs - w1.w_lbs) / (w2.w_lbs - w1.w_lbs), 1);
    return w1.cg_pct + t * (w2.cg_pct - w1.cg_pct);
  }, [totalWeight_lbs, cfg]);
  const aftLimit = useMemo(() => {
    const w1 = cfg.aftCG[0], w2 = cfg.aftCG[1];
    const t = Math.min((totalWeight_lbs - w1.w_lbs) / (w2.w_lbs - w1.w_lbs), 1);
    return w1.cg_pct + t * (w2.cg_pct - w1.cg_pct);
  }, [totalWeight_lbs, cfg]);
  const isForwardOver = currentCG_pct < fwdLimit;
  const isAftOver = currentCG_pct > aftLimit;
  const isOew = totalWeight_lbs < cfg.weights_lbs.oew;

  // Y轴刻度
  const yTicks = [0, 100000, 200000, 300000, 350000, mtow_lbs].filter(v => v >= cfg.yMin && v <= cfg.yMax);
  const xTicks = [0, 10, 20, 30, 40, 50];

  return (
    <div style={{ width: '100%', userSelect: 'none' }}>
      {/* 标题栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1F4E79' }}>
          📊 W&amp;B 包线图 — B767-300BCF
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Tag color={isOverweight ? 'red' : isOew ? 'default' : 'blue'}>
            {isOverweight ? '⚠️ 超MTOW' : isOew ? '空载' : '正常'}
          </Tag>
          <Tag color={isForwardOver ? 'red' : isAftOver ? 'orange' : 'green'}>
            {isForwardOver ? `⚠️ 前重心越限 (${currentCG_pct.toFixed(1)}% < ${fwdLimit.toFixed(1)}%)`
              : isAftOver ? `⚠️ 后重心越限 (${currentCG_pct.toFixed(1)}% > ${aftLimit.toFixed(1)}%)`
              : '✅ 重心正常'}
          </Tag>
          <Tag color={phaseInfo.color} style={{ color: phaseInfo.color, borderColor: phaseInfo.color }}>
            {phaseInfo.text}
          </Tag>
        </div>
      </div>

      {/* 阶段说明 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 6, fontSize: 10, color: '#888' }}>
        <span style={{ color: '#EF4444' }}>● 起飞：燃油最重，重心偏后</span>
        <span style={{ color: '#F59E0B' }}>● 巡航：重心随燃油消耗前移</span>
        <span style={{ color: '#10B981' }}>● 落地：燃油耗尽，允许更前重心</span>
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', background: '#f8fafc', borderRadius: 8 }}>
        {/* 背景网格 */}
        {yTicks.map(v => (
          <g key={`ygrid-${v}`}>
            <line
              x1={PAD.left} y1={h2y(v, cfg.yMin, cfg.yMax)}
              x2={W - PAD.right} y2={h2y(v, cfg.yMin, cfg.yMax)}
              stroke="#E2E8F0" strokeWidth={v === mtow_lbs || v === mzfw_lbs || v === mlw_lbs ? 1.5 : 0.8}
              strokeDasharray={v === mtow_lbs || v === mzfw_lbs || v === mlw_lbs ? '4,2' : '2,4'}
            />
          </g>
        ))}
        {xTicks.map(v => (
          <line key={`xgrid-${v}`} x1={cg2x(v)} y1={PAD.top} x2={cg2x(v)} y2={H - PAD.bottom}
            stroke="#E2E8F0" strokeWidth={0.8} />
        ))}

        {/* 安全包络区域 */}
        <path d={polyPath} fill="rgba(16,185,129,0.07)" stroke="none" />
        <path d={polyPath} fill="none" stroke="rgba(16,185,129,0.4)" strokeWidth={1.5} strokeDasharray="4,2" />

        {/* 六条关键限制线 */}
        {/* 1. MTOW 水平线 */}
        <line x1={PAD.left} y1={h2y(mtow_lbs, cfg.yMin, cfg.yMax)}
          x2={W - PAD.right} y2={h2y(mtow_lbs, cfg.yMin, cfg.yMax)}
          stroke="#DC2626" strokeWidth={2.5} />
        <text x={W - PAD.right + 4} y={h2y(mtow_lbs, cfg.yMin, cfg.yMax) + 4}
          fill="#DC2626" fontSize={10} fontWeight={700}>MTOW {mtow_lbs.toLocaleString()} lbs</text>

        {/* 2. MZFW 水平线 */}
        <line x1={PAD.left} y1={h2y(mzfw_lbs, cfg.yMin, cfg.yMax)}
          x2={W - PAD.right} y2={h2y(mzfw_lbs, cfg.yMin, cfg.yMax)}
          stroke="#B45309" strokeWidth={1.8} strokeDasharray="6,3" />
        <text x={W - PAD.right + 4} y={h2y(mzfw_lbs, cfg.yMin, cfg.yMax) + 4}
          fill="#B45309" fontSize={10} fontWeight={600}>MZFW {mzfw_lbs.toLocaleString()} lbs</text>

        {/* 3. MLW 水平线 */}
        <line x1={PAD.left} y1={h2y(mlw_lbs, cfg.yMin, cfg.yMax)}
          x2={W - PAD.right} y2={h2y(mlw_lbs, cfg.yMin, cfg.yMax)}
          stroke="#7C3AED" strokeWidth={1.5} strokeDasharray="3,3" />
        <text x={W - PAD.right + 4} y={h2y(mlw_lbs, cfg.yMin, cfg.yMax) + 4}
          fill="#7C3AED" fontSize={10} fontWeight={600}>MLW {mlw_lbs.toLocaleString()} lbs</text>

        {/* 4. 前重心限制线 */}
        {(() => {
          const pts = buildForwardCGLimit(cfg);
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
          return <path key="fwd" d={d} stroke="#EA580C" strokeWidth={2} fill="none" />;
        })()}
        <text x={PAD.left + 2} y={PAD.top - 6} fill="#EA580C" fontSize={9} fontWeight={600}>前重心限制 Forward CG</text>

        {/* 5. 后重心限制线 */}
        {(() => {
          const pts = buildAftCGLimit(cfg);
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
          return <path key="aft" d={d} stroke="#1D4ED8" strokeWidth={2} fill="none" />;
        })()}
        <text x={PAD.left + 2} y={PAD.top - 16} fill="#1D4ED8" fontSize={9} fontWeight={600}>后重心限制 Aft CG</text>

        {/* 6. 空机重量点 */}
        <circle cx={cg2x(20)} cy={h2y(oew_lbs, cfg.yMin, cfg.yMax)}
          r={4} fill="#6B7280" />
        <text x={cg2x(20) + 6} y={h2y(oew_lbs, cfg.yMin, cfg.yMax) + 4}
          fill="#6B7280" fontSize={9}>OEW {oew_lbs.toLocaleString()} lbs</text>

        {/* 当前重心点 */}
        {cgY >= PAD.top && cgY <= H - PAD.bottom && (
          <g>
            {/* 垂直辅助线 */}
            <line x1={cgX} y1={PAD.top} x2={cgX} y2={H - PAD.bottom}
              stroke={phaseInfo.color} strokeWidth={1.5} strokeDasharray="4,3" opacity={0.7} />
            {/* 水平辅助线 */}
            <line x1={PAD.left} y1={cgY} x2={W - PAD.right} y2={cgY}
              stroke={phaseInfo.color} strokeWidth={1} strokeDasharray="4,3" opacity={0.5} />
            {/* 重力点 */}
            <circle cx={cgX} cy={cgY} r={8} fill={phaseInfo.color} opacity={0.9} />
            <circle cx={cgX} cy={cgY} r={5} fill="white" />
            <circle cx={cgX} cy={cgY} r={3} fill={phaseInfo.color} />
            {/* 标注 */}
            <rect x={cgX - 38} y={cgY - 28} width={76} height={20} rx={4}
              fill={phaseInfo.bg} stroke={phaseInfo.color} strokeWidth={1} />
            <text x={cgX} y={cgY - 14} textAnchor="middle"
              fill={phaseInfo.color} fontSize={10} fontWeight={700}>
              {currentCG_pct.toFixed(1)}% MAC
            </text>
          </g>
        )}

        {/* Y轴标签 */}
        {yTicks.map(v => (
          <g key={`ylabel-${v}`}>
            <text x={PAD.left - 6} y={h2y(v, cfg.yMin, cfg.yMax) + 4}
              textAnchor="end" fill="#64748B" fontSize={9}>
              {(v / 1000).toFixed(0)}k
            </text>
            <text x={PAD.left - 6} y={h2y(v, cfg.yMin, cfg.yMax) + 15}
              textAnchor="end" fill="#94A3B8" fontSize={8}>
              {v.toLocaleString()}
            </text>
          </g>
        ))}

        {/* X轴标签 */}
        {xTicks.map(v => (
          <text key={`xlabel-${v}`} x={cg2x(v)} y={H - PAD.bottom + 16}
            textAnchor="middle" fill="#64748B" fontSize={9}>
            {v}%
          </text>
        ))}

        {/* 轴标题 */}
        <text x={PAD.left + INNER_W / 2} y={H - 4}
          textAnchor="middle" fill="#475569" fontSize={11} fontWeight={600}>重心位置 CG (% MAC)</text>
        <text x={14} y={PAD.top + INNER_H / 2}
          textAnchor="middle" fill="#475569" fontSize={11} fontWeight={600}
          transform={`rotate(-90, 14, ${PAD.top + INNER_H / 2})`}>
          重量 (lbs)
        </text>

        {/* 坐标原点 */}
        <text x={PAD.left - 6} y={H - PAD.bottom + 16} textAnchor="end" fill="#94A3B8" fontSize={8}>0%</text>
      </svg>

      {/* 数值统计 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 8 }}>
        {[
          { label: '总重量', value: `${(totalWeight_lbs / 1000).toFixed(1)}k lbs`, sub: `${(totalWeight_kg / 1000).toFixed(1)}t`, color: isOverweight ? '#EF4444' : '#1F4E79' },
          { label: '重心 CG', value: `${currentCG_pct.toFixed(2)}%`, sub: `限:${fwdLimit.toFixed(1)}~${aftLimit.toFixed(1)}%`, color: isForwardOver || isAftOver ? '#EF4444' : '#059669' },
          { label: '货物重量', value: `${(cargoWeight_kg / 1000).toFixed(2)}t`, sub: `${((cargoWeight_kg) * KG2LBS).toFixed(0)} lbs`, color: '#4F46E5' },
          { label: '燃油重量', value: `${(fuel_kg / 1000).toFixed(2)}t`, sub: `${((fuel_kg) * KG2LBS).toFixed(0)} lbs`, color: '#D97706' },
        ].map(item => (
          <div key={item.label} style={{ background: '#F1F5F9', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#64748B' }}>{item.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: 8, color: '#94A3B8' }}>{item.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
