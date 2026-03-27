// HoldLayout767BCF.tsx - B767-300BCF 专业货舱布局图 (SVG)
// 依据：Atlas Air 767-300BCF One Sheet (2018) + 波音FCOM
// v5.0 | 2026-03-26

import React, { useState } from 'react';
import { Tag, Tooltip, Badge } from 'antd';
import { B767_300BCF, getPositionsByDeck } from '../data/b767_bcf_config';
import { ULD_TYPES, getCompatibleULDs } from '../data/uld_specs';

interface CargoEntry { awb: string; weight_kg: number; volume_m3: number; uld_code: string; position?: string; }
interface PlacedULD { position: string; uld_type: string; uld_id: string; cargoItems: CargoEntry[]; totalWeight: number; totalVolume: number; }

interface Props {
  placedULDs?: PlacedULD[];
  onPositionClick?: (code: string) => void;
  selectedPos?: string | null;
  activeDeck?: 'main' | 'lower' | 'all';
  showDeck?: 'main' | 'lower';
}

// 位置颜色
function getPosStatus(position: string, placed: PlacedULD[], isSelected: boolean): {
  fill: string; stroke: string; strokeWidth: number; textColor: string; bgOpacity: number;
} {
  const found = placed.find(p => p.position === position);
  if (isSelected) return { fill: '#FBBF24', stroke: '#F59E0B', strokeWidth: 2.5, textColor: '#fff', bgOpacity: 0.9 };
  if (found) {
    const uldType = ULD_TYPES.find(u => u.code === found.uld_type || u.altCode.includes(found.uld_type));
    return {
      fill: uldType?.color3D || '#1E4E8A',
      stroke: '#93C5FD', strokeWidth: 1.5,
      textColor: '#fff', bgOpacity: 0.85,
    };
  }
  return { fill: '#1E3A5F', stroke: '#3B82F6', strokeWidth: 1, textColor: '#93C5FD', bgOpacity: 0.3 };
}

// 主舱SVG - 单列座位式布局
function MainDeckSVG({ positions, placed, selectedPos, onPosClick }: {
  positions: typeof B767_300BCF.positions;
  placed: PlacedULD[];
  selectedPos?: string | null;
  onPosClick?: (code: string) => void;
}) {
  // A行(左) 和 B行(右) - 各4列
  const ROWS = ['A', 'B'];
  const COLS = [1, 2, 3, 4];
  const SECTION = { A: '前区 FWD', B: '中区 CTR', E: '后区 AFT' };

  // 把position分组
  const bySection: Record<string, Record<string, typeof positions>> = {};
  positions.forEach(p => {
    const sec = p.section;
    if (!bySection[sec]) bySection[sec] = {};
    bySection[sec][p.code] = p;
  });

  const sections = ['fwd', 'ctr', 'aft'];
  const sectionLabels: Record<string, string> = { fwd: '前货舱 FWD COMP', ctr: '中货舱 CTR COMP', aft: '后货舱 AFT COMP' };
  const sectionY: Record<string, number> = { fwd: 0, ctr: 120, aft: 240 };

  const CELL_W = 72, CELL_H = 54, CELL_GAP = 6;
  const SVG_W = 420, SVG_H = 340;

  return (
    <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
      {sections.map((sec, si) => {
        const secY = sectionY[sec];
        const secPos = bySection[sec] || {};
        return (
          <g key={sec}>
            {/* 舱区标题 */}
            <rect x={0} y={secY} width={SVG_W} height={20} rx={3} fill="rgba(30,58,138,0.6)" />
            <text x={8} y={secY + 14} fill="#93C5FD" fontSize={10} fontWeight={700}>
              {sectionLabels[sec]} — 共{Object.keys(secPos).length}位
            </text>

            {/* 左行 A/C/E */}
            <text x={4} y={secY + 50} fill="#60A5FA" fontSize={10} fontWeight={600}
              transform={`rotate(-90, 12, ${secY + 50})`}>L</text>
            {COLS.map((col, ci) => {
              const code = `${sec === 'fwd' ? 'A' : sec === 'ctr' ? 'C' : 'E'}${col}`;
              const pos = secPos[code];
              if (!pos) return null;
              const status = getPosStatus(code, placed, selectedPos === code);
              const x = 20 + ci * (CELL_W + CELL_GAP);
              const y = secY + 26;
              return (
                <g key={code} onClick={() => onPosClick?.(code)} style={{ cursor: 'pointer' }}>
                  <rect x={x} y={y} width={CELL_W} height={CELL_H} rx={6}
                    fill={status.fill} fillOpacity={status.bgOpacity}
                    stroke={status.stroke} strokeWidth={status.strokeWidth} />
                  <text x={x + CELL_W / 2} y={y + 18} textAnchor="middle"
                    fill={status.textColor} fontSize={12} fontWeight={700}>
                    {code}
                  </text>
                  {placed.find(p => p.position === code) ? (
                    <>
                      <text x={x + CELL_W / 2} y={y + 32} textAnchor="middle"
                        fill="rgba(255,255,255,0.8)" fontSize={8}>
                        {placed.find(p => p.position === code)?.totalWeight}kg
                      </text>
                      <text x={x + CELL_W / 2} y={y + 44} textAnchor="middle"
                        fill="rgba(255,255,255,0.6)" fontSize={8}>
                        {placed.find(p => p.position === code)?.uld_type}
                      </text>
                    </>
                  ) : (
                    <text x={x + CELL_W / 2} y={y + 38} textAnchor="middle"
                      fill="rgba(255,255,255,0.3)" fontSize={8}>空闲</text>
                  )}
                </g>
              );
            })}

            {/* 右行 B/D/F */}
            <text x={SVG_W - 4} y={secY + 50} fill="#60A5FA" fontSize={10} fontWeight={600}
              textAnchor="end" transform={`rotate(90, ${SVG_W - 12}, ${secY + 50})`}>R</text>
            {COLS.map((col, ci) => {
              const code = `${sec === 'fwd' ? 'B' : sec === 'ctr' ? 'D' : 'F'}${col}`;
              const pos = secPos[code];
              if (!pos) return null;
              const status = getPosStatus(code, placed, selectedPos === code);
              const x = 20 + (ci + 4) * (CELL_W + CELL_GAP);
              const y = secY + 26;
              return (
                <g key={code} onClick={() => onPosClick?.(code)} style={{ cursor: 'pointer' }}>
                  <rect x={x} y={y} width={CELL_W} height={CELL_H} rx={6}
                    fill={status.fill} fillOpacity={status.bgOpacity}
                    stroke={status.stroke} strokeWidth={status.strokeWidth} />
                  <text x={x + CELL_W / 2} y={y + 18} textAnchor="middle"
                    fill={status.textColor} fontSize={12} fontWeight={700}>
                    {code}
                  </text>
                  {placed.find(p => p.position === code) ? (
                    <>
                      <text x={x + CELL_W / 2} y={y + 32} textAnchor="middle"
                        fill="rgba(255,255,255,0.8)" fontSize={8}>
                        {placed.find(p => p.position === code)?.totalWeight}kg
                      </text>
                      <text x={x + CELL_W / 2} y={y + 44} textAnchor="middle"
                        fill="rgba(255,255,255,0.6)" fontSize={8}>
                        {placed.find(p => p.position === code)?.uld_type}
                      </text>
                    </>
                  ) : (
                    <text x={x + CELL_W / 2} y={y + 38} textAnchor="middle"
                      fill="rgba(255,255,255,0.3)" fontSize={8}>空闲</text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}

      {/* BULK 散货舱 */}
      <g>
        <rect x={0} y={320} width={SVG_W} height={20} rx={3} fill="rgba(139,90,43,0.6)" />
        <text x={8} y={334} fill="#D97706" fontSize={10} fontWeight={700}>BULK 散货舱 — 1区</text>
      </g>
    </svg>
  );
}

// 下舱SVG - L/R 列 × 前/中/后
function LowerDeckSVG({ positions, placed, selectedPos, onPosClick }: {
  positions: typeof B767_300BCF.positions;
  placed: PlacedULD[];
  selectedPos?: string | null;
  onPosClick?: (code: string) => void;
}) {
  const CELL_W = 90, CELL_H = 44, CELL_GAP = 8;
  const SVG_W = 420, SVG_H = 180;

  // 位置映射
  const bySection: Record<string, { L: typeof positions[0][]; R: typeof positions[0][] }> = {};
  positions.forEach(p => {
    const sec = p.section;
    if (!bySection[sec]) bySection[sec] = { L: [], R: [] };
    if (p.row === 'left') bySection[sec].L.push(p);
    else bySection[sec].R.push(p);
  });

  const sections = ['fwd', 'ctr', 'aft'];
  const sectionLabels: Record<string, string> = { fwd: '前下舱 FWD LOWER', ctr: '中下舱 CTR LOWER', aft: '后下舱 AFT LOWER' };
  const sectionY: Record<string, number> = { fwd: 0, ctr: 60, aft: 120 };

  return (
    <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
      {sections.map(sec => {
        const secY = sectionY[sec];
        const leftPos = (bySection[sec]?.L || []).sort((a, b) => a.code.localeCompare(b.code));
        const rightPos = (bySection[sec]?.R || []).sort((a, b) => a.code.localeCompare(b.code));

        return (
          <g key={sec}>
            {/* 舱区标题 */}
            <rect x={0} y={secY} width={SVG_W} height={18} rx={3} fill="rgba(7,20,40,0.8)" />
            <text x={8} y={secY + 12} fill="#60A5FA" fontSize={9} fontWeight={700}>
              {sectionLabels[sec]} — L×{leftPos.length} / R×{rightPos.length}
            </text>

            {/* 左列 L */}
            {leftPos.map((pos, i) => {
              const status = getPosStatus(pos.code, placed, selectedPos === pos.code);
              const x = 20 + i * (CELL_W + CELL_GAP);
              const y = secY + 24;
              return (
                <g key={pos.code} onClick={() => onPosClick?.(pos.code)} style={{ cursor: 'pointer' }}>
                  <rect x={x} y={y} width={CELL_W} height={CELL_H} rx={5}
                    fill={status.fill} fillOpacity={status.bgOpacity}
                    stroke={status.stroke} strokeWidth={status.strokeWidth} />
                  <text x={x + CELL_W / 2} y={y + 16} textAnchor="middle"
                    fill={status.textColor} fontSize={11} fontWeight={700}>{pos.code}</text>
                  <text x={x + CELL_W / 2} y={y + 29} textAnchor="middle"
                    fill="rgba(255,255,255,0.6)" fontSize={8}>
                    {placed.find(p => p.position === pos.code) ? `${placed.find(p => p.position === pos.code)?.totalWeight}kg` : `${pos.maxWeight_kg}kg`}
                  </text>
                  <text x={x + CELL_W / 2} y={y + 40} textAnchor="middle"
                    fill="rgba(255,255,255,0.4)" fontSize={7}>
                    {placed.find(p => p.position === pos.code)?.uld_type || '空闲'}
                  </text>
                </g>
              );
            })}

            {/* 右列 R */}
            {rightPos.map((pos, i) => {
              const status = getPosStatus(pos.code, placed, selectedPos === pos.code);
              const x = 20 + (i + leftPos.length) * (CELL_W + CELL_GAP);
              const y = secY + 24;
              return (
                <g key={pos.code} onClick={() => onPosClick?.(pos.code)} style={{ cursor: 'pointer' }}>
                  <rect x={x} y={y} width={CELL_W} height={CELL_H} rx={5}
                    fill={status.fill} fillOpacity={status.bgOpacity}
                    stroke={status.stroke} strokeWidth={status.strokeWidth} />
                  <text x={x + CELL_W / 2} y={y + 16} textAnchor="middle"
                    fill={status.textColor} fontSize={11} fontWeight={700}>{pos.code}</text>
                  <text x={x + CELL_W / 2} y={y + 29} textAnchor="middle"
                    fill="rgba(255,255,255,0.6)" fontSize={8}>
                    {placed.find(p => p.position === pos.code) ? `${placed.find(p => p.position === pos.code)?.totalWeight}kg` : `${pos.maxWeight_kg}kg`}
                  </text>
                  <text x={x + CELL_W / 2} y={y + 40} textAnchor="middle"
                    fill="rgba(255,255,255,0.4)" fontSize={7}>
                    {placed.find(p => p.position === pos.code)?.uld_type || '空闲'}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

// 统计栏
function DeckStats({ placed, deck }: { placed: PlacedULD[]; deck: 'main' | 'lower' | 'all' }) {
  const deckPositions = deck === 'all'
    ? placed
    : placed.filter(p => {
        const pos = B767_300BCF.positions.find(x => x.code === p.position);
        return pos?.deck === deck;
      });
  const totalWeight = deckPositions.reduce((s, p) => s + p.totalWeight, 0);
  const totalVolume = deckPositions.reduce((s, p) => s + p.totalVolume, 0);
  const uldCount = deckPositions.length;

  const cfg = deck === 'main' ? { maxWeight: 22 * 4626, label: '主舱 MD', color: '#1E4E8A' }
    : { maxWeight: 12 * 1588, label: '下舱 LD', color: '#065F46' };

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {[
        { label: cfg.label, value: `${uldCount} ULD`, sub: '', color: cfg.color },
        { label: '已载重量', value: `${(totalWeight / 1000).toFixed(1)}t`, sub: `/ ${(cfg.maxWeight / 1000).toFixed(0)}t`, color: totalWeight > cfg.maxWeight ? '#DC2626' : '#059669' },
        { label: '总体积', value: `${totalVolume.toFixed(1)}m³`, sub: '', color: '#7C3AED' },
      ].map(item => (
        <div key={item.label} style={{ background: '#F1F5F9', borderRadius: 6, padding: '5px 10px', textAlign: 'center', minWidth: 80 }}>
          <div style={{ fontSize: 9, color: '#64748B' }}>{item.label}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</div>
          {item.sub && <div style={{ fontSize: 8, color: '#94A3B8' }}>{item.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// 主组件
export default function HoldLayout767BCF({ placedULDs = [], onPositionClick, selectedPos, showDeck = 'main' }: Props) {
  const [activeTab, setActiveTab] = useState<'main' | 'lower'>('main');
  const mainPositions = getPositionsByDeck('main');
  const lowerPositions = getPositionsByDeck('lower');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Tab切换 */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {[
          { key: 'main', label: '主舱 MD', sub: '22+1 仓位', count: mainPositions.length },
          { key: 'lower', label: '下舱 LD', sub: '12 仓位', count: lowerPositions.length },
        ].map(tab => (
          <Tag
            key={tab.key}
            color={activeTab === tab.key ? '#1F4E79' : 'default'}
            style={{ cursor: 'pointer', padding: '4px 12px', margin: 0, borderRadius: 6, fontSize: 12 }}
            onClick={() => setActiveTab(tab.key as any)}
          >
            <b>{tab.label}</b> <span style={{ color: '#94A3B8', fontSize: 10 }}>{tab.sub}</span>
          </Tag>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 10, color: '#94A3B8' }}>
          点击仓位 → {selectedPos ? `已选 ${selectedPos}` : '选择打板位置'}
        </div>
      </div>

      {/* 货舱图 */}
      {activeTab === 'main' ? (
        <div style={{ background: '#0a1628', borderRadius: 8, padding: '12px 8px', overflowX: 'auto' }}>
          <MainDeckSVG
            positions={mainPositions}
            placed={placedULDs}
            selectedPos={selectedPos || undefined}
            onPosClick={onPositionClick}
          />
        </div>
      ) : (
        <div style={{ background: '#0a1628', borderRadius: 8, padding: '12px 8px', overflowX: 'auto' }}>
          <LowerDeckSVG
            positions={lowerPositions}
            placed={placedULDs}
            selectedPos={selectedPos || undefined}
            onPosClick={onPositionClick}
          />
        </div>
      )}

      {/* 图例 */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 10, color: '#64748B' }}>
        {[
          { color: '#1E4E8A', label: '已装货', opacity: 0.85 },
          { color: '#1E3A5F', label: '空闲仓位', opacity: 0.3 },
          { color: '#FBBF24', label: '选中位置', opacity: 1 },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 12, background: item.color, borderRadius: 3, opacity: item.opacity, border: '1px solid #3B82F6' }} />
            {item.label}
          </div>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <DeckStats placed={placedULDs} deck={activeTab} />
        </div>
      </div>
    </div>
  );
}
