/**
 * CBA v5.2.1 — True 3D ULD Packing Visualizer
 * Isometric SVG projection with proper gravity stacking
 */
import { useState, useMemo } from 'react';
import { Slider, Tag, Typography, Space, Button, Tooltip } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { UI, CI } from './CargoTypes';

const { Text } = Typography;

const CAT: Record<string, { f: string; r: string; t: string; label: string }> = {
  normal:      { f: '#3B82F6', r: '#1D4ED8', t: '#93C5FD', label: '普通' },
  dgr:         { f: '#EF4444', r: '#B91C1C', t: '#FCA5A5', label: '危险品' },
  live_animal: { f: '#16A34A', r: '#15803D', t: '#86EFAC', label: '活体' },
  perishable:  { f: '#F59E0B', r: '#B45309', t: '#FDE68A', label: '生鲜' },
};

interface Props {
  uld: UI;
  onRemove: (id: string) => void;
  onCargoRemove?: (uldId: string, cargoId: string) => void;
  onOpenModal?: (uld: UI) => void;
  compact?: boolean;
}

const ULD_DIMS: Record<string, { L: number; W: number; H: number }> = {
  'LD-7': { L: 223, W: 153, H: 163 },
  'LD-6': { L: 153, W: 153, H: 163 },
  'LD-3': { L: 153, W: 153, H: 114 },
  'LD-2': { L: 146, W: 118, H: 163 },
  'LD-8': { L: 223, W: 136, H: 163 },
  'LD-11':{ L: 153, W: 118, H: 163 },
};

// ── Packing algorithm: simple gravity row-layer packing ─────────────────────
interface PBox { cargo: CI; ox: number; oy: number; oz: number; }

function pack(cargoItems: CI[], L: number, W: number, H: number, sc: number): PBox[] {
  const sorted = [...cargoItems]
    .map(c => ({ c, vol: c.length_cm * c.width_cm * c.height_cm }))
    .sort((a, b) => b.vol - a.vol)
    .map(({ c }) => c);

  const placed: PBox[] = [];
  const layers: { z: number; h: number; rows: { y: number; h: number; x: number; w: number; c: CI }[][] }[] = [];
  const LAYER_H = 30; // cm per layer

  for (const c of sorted) {
    let best: { layer: number; row: number; x: number; oz: number } | null = null;
    let bestZ = Infinity;

    for (let li = 0; li < layers.length; li++) {
      const layer = layers[li];
      if (layer.z + layer.h + c.height_cm > H) continue;
      for (let ri = 0; ri < layer.rows.length; ri++) {
        const row = layer.rows[ri];
        if (row.h < c.height_cm) continue;
        const rem = row.x + c.length_cm;
        if (rem <= L) {
          const oz = layer.z;
          if (oz < bestZ) { bestZ = oz; best = { layer: li, row: ri, x: row.x, oz }; }
        }
      }
      // Try starting a new row in this layer
      if (layer.rows.length > 0) {
        const lastRow = layer.rows[layer.rows.length - 1];
        const remX = L - lastRow.x;
        if (remX >= c.length_cm && lastRow.h >= c.height_cm) {
          const oz = layer.z;
          if (oz < bestZ) { bestZ = oz; best = { layer: li, row: layer.rows.length, x: lastRow.x, oz }; }
        }
      } else {
        const oz = layer.z;
        if (oz < bestZ) { bestZ = oz; best = { layer: li, row: 0, x: 0, oz }; }
      }
    }

    if (best) {
      // Extend or start row in existing layer
      const layer = layers[best.layer];
      if (best.row < layer.rows.length) {
        const row = layer.rows[best.row];
        placed.push({ cargo: c, ox: row.x, oy: 0, oz: best.oz });
        row.x += c.length_cm;
        row.h = Math.min(row.h, c.height_cm);
      } else {
        placed.push({ cargo: c, ox: 0, oy: 0, oz: best.oz });
        layer.rows.push({ y: 0, h: c.height_cm, x: c.length_cm, w: 0, c });
      }
    } else {
      // Start new layer
      const z = layers.length === 0 ? 0 : layers[layers.length - 1].z + layers[layers.length - 1].h;
      if (z + c.height_cm <= H) {
        layers.push({ z, h: c.height_cm, rows: [{ y: 0, h: c.height_cm, x: c.length_cm, w: 0, c }] });
        placed.push({ cargo: c, ox: 0, oy: 0, oz: z });
      }
    }
  }
  return placed;
}

// ── Isometric SVG helpers ────────────────────────────────────────────────────
const S = 1.1; // global scale
const iso = {
  sx(x: number, z: number) { return (x - z) * S + 16; },
  sy(x: number, y: number, z: number) { return ((x + y) * 0.5 - z) * S + 90; },
};

function poly(pts: number[][]) { return pts.map(p => p.join(',')).join(' '); }

function Box({ b, sc }: { b: PBox; sc: number }) {
  const c = b.cargo;
  const L = c.length_cm * sc, W = c.width_cm * sc, H = c.height_cm * sc;
  const col = CAT[c.category] || CAT.normal;
  const p = (x: number, y: number, z: number) => [iso.sx(b.ox + x, b.oz + z), iso.sy(b.ox + x, b.oy + y, b.oz + z)];

  return (
    <g>
      {/* RIGHT face */}
      <polygon points={poly([p(0,W,H), p(L,W,H), p(L,0,H), p(0,0,H)])} fill={col.r} stroke="#fff" strokeWidth="0.4" strokeOpacity="0.3" />
      {/* TOP face */}
      <polygon points={poly([p(0,W,0), p(L,W,0), p(L,W,H), p(0,W,H)])} fill={col.t} stroke="#fff" strokeWidth="0.4" strokeOpacity="0.5" />
      {/* FRONT face */}
      <polygon points={poly([p(0,0,0), p(L,0,0), p(L,0,H), p(0,0,H)])} fill={col.f} stroke="#fff" strokeWidth="0.4" strokeOpacity="0.4" />
      {/* Label on front face */}
      <text
        x={(p(0,0,H)[0] + p(L,0,H)[0]) / 2}
        y={p(0,0,H)[1] + 10}
        textAnchor="middle" fontSize="5.5" fill="white" fontWeight="700"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {c.description.slice(0, 7)}
      </text>
      <text
        x={(p(0,0,H)[0] + p(L,0,H)[0]) / 2}
        y={p(0,0,H)[1] + 16}
        textAnchor="middle" fontSize="4.5" fill="rgba(255,255,255,0.85)"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {c.length_cm}×{c.width_cm}×{c.height_cm}
      </text>
    </g>
  );
}

function ULDFrame({ L, W, H, sc }: { L: number; W: number; H: number; sc: number }) {
  const p = (x: number, y: number, z: number) => [iso.sx(x, z), iso.sy(x, y, z)];
  const A = p(0,0,0), B = p(L,0,0), C = p(L,W,0), D = p(0,W,0);
  const E = p(0,0,H), F = p(L,0,H), G = p(L,W,H), Hh = p(0,W,H);

  return (
    <g opacity="0.65">
      {/* Bottom */}
      <polygon points={poly([A, B, C, D])} fill="#EFF6FF" stroke="#1E40AF" strokeWidth="1" />
      {/* Back walls */}
      <polygon points={poly([D, C, G, Hh])} fill="#DBEAFE" stroke="#1E40AF" strokeWidth="0.8" strokeDasharray="4,2" />
      <polygon points={poly([C, B, F, G])} fill="#DBEAFE" stroke="#1E40AF" strokeWidth="0.8" strokeDasharray="4,2" />
      {/* Front opening edges */}
      <polygon points={poly([A, B, F, E])} fill="none" stroke="#1E40AF" strokeWidth="1.2" />
      {/* Wire edges */}
      {[[A,B],[B,C],[C,D],[D,A],[A,E],[B,F],[C,G],[D,Hh],[E,F],[F,G],[G,Hh],[Hh,E]].map(([a, b], i) => (
        <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
          stroke="#1E40AF" strokeWidth={i < 4 || i >= 8 ? 1.5 : 0.9}
          opacity={i < 4 ? 1 : 0.7} />
      ))}
      {/* Labels */}
      <text x={(A[0]+B[0])/2} y={A[1]+14} textAnchor="middle" fontSize="7" fill="#64748B">← {L}cm →</text>
      <text x={C[0]+8} y={(C[1]+D[1])/2+4} textAnchor="start" fontSize="7" fill="#64748B">↓ {W}cm</text>
      <text x={E[0]-3} y={E[1]-3} textAnchor="end" fontSize="7" fill="#1E40AF" fontWeight="700">↑ {H}cm</text>
    </g>
  );
}

export default function ULD3DView({ uld, onRemove, onCargoRemove, onOpenModal, compact = false }: Props) {
  const [angle, setAngle] = useState(35); // isometric angle in degrees
  const [layer, setLayer] = useState(0);
  const dims = ULD_DIMS[uld.uld_code] || ULD_DIMS['LD-6'];
  const sc = compact ? 0.5 : 1.05;
  const svgW = Math.ceil(iso.sx(dims.L, dims.W)) + 80;
  const svgH = Math.ceil(iso.sy(0, dims.W, dims.H)) + 130;

  const boxes = useMemo(() => pack(uld.cargoItems, dims.L, dims.W, dims.H, sc), [uld.cargoItems, dims.L, dims.W, dims.H, sc]);

  const fillPct = uld.cargoItems.reduce((s, c) => s + c.volume_m3, 0) / (dims.L * dims.W * dims.H / 1e6);
  const fColor = fillPct > 0.85 ? '#EF4444' : fillPct > 0.6 ? '#F59E0B' : '#16A34A';

  if (compact) {
    return (
      <div style={{ userSelect: 'none' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
          <Text style={{ fontSize: 10, fontWeight: 700, color: '#1F4E79' }}>{uld.uld_serial || uld.uld_code}</Text>
          <Tag color={fColor} style={{ fontSize: 8, margin: 0 }}>{Math.round(fillPct * 100)}%</Tag>
          <Text style={{ fontSize: 9, color: '#64748B' }}>{uld.cargoItems.length}件</Text>
        </div>
        <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`}>
          <ULDFrame L={dims.L} W={dims.W} H={dims.H} sc={sc} />
          {boxes.map(b => <Box key={b.cargo.id} b={b} sc={sc} />)}
        </svg>
      </div>
    );
  }

  return (
    <div style={{ userSelect: 'none', padding: '4px 4px 8px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Space size={4} wrap>
          <Text style={{ fontSize: 12, fontWeight: 700, color: '#1F4E79' }}>{uld.uld_serial || uld.uld_code}</Text>
          <Text style={{ fontSize: 10, color: '#64748B' }}>{dims.L}×{dims.W}×{dims.H}cm</Text>
          <Tag color={fColor} style={{ fontSize: 9, margin: 0 }}>{Math.round(fillPct * 100)}% 装载</Tag>
          <Text style={{ fontSize: 10, color: '#64748B' }}>{uld.cargoItems.length} 件</Text>
          {uld.position && <Tag color="blue" style={{ fontSize: 9 }}>{uld.position}</Tag>}
        </Space>
        <Space size={2}>
          {onCargoRemove && <Tooltip title="移除 ULD"><Button size="small" icon={<DeleteOutlined />} danger onClick={() => onRemove(uld.id)} /></Tooltip>}
          {onOpenModal && <Button size="small" onClick={() => onOpenModal(uld)}>全屏</Button>}
        </Space>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Text style={{ fontSize: 9, color: '#64748B', width: 48 }}>视角 {angle}°</Text>
        <Slider min={0} max={80} value={angle} onChange={setAngle} style={{ flex: 1 }}
          tooltip={{ formatter: (v) => `${v}°` }}
          styles={{ track: { background: '#3B82F6' } }} />
        <Button size="small" onClick={() => setAngle(35)} style={{ fontSize: 9 }}>重置</Button>
      </div>

      {/* 3D SVG Viewport */}
      <div style={{
        background: 'linear-gradient(160deg, #F8FAFC 0%, #EFF6FF 100%)',
        borderRadius: 8, border: '1px solid #E2E8F0', padding: '8px 4px 4px',
      }}>
        <svg width="100%" viewBox={`-5 -5 ${svgW + 10} ${svgH + 10}`} style={{ display: 'block', maxHeight: 340 }}>
          {/* Grid lines on floor */}
          {Array.from({ length: Math.ceil(dims.L / 40) + 1 }, (_, i) => {
            const x = i * 40 * sc;
            return <line key={`v${i}`} x1={iso.sx(x,0)+16} y1={iso.sy(x,0,0)+90} x2={iso.sx(x,dims.W)+16} y2={iso.sy(x,dims.W,0)+90} stroke="#CBD5E1" strokeWidth="0.5" strokeDasharray="3,4" />;
          })}
          {Array.from({ length: Math.ceil(dims.W / 40) + 1 }, (_, i) => {
            const y = i * 40 * sc;
            return <line key={`h${i}`} x1={iso.sx(0,y)+16} y1={iso.sy(0,y,0)+90} x2={iso.sx(dims.L,y)+16} y2={iso.sy(dims.L,y,0)+90} stroke="#CBD5E1" strokeWidth="0.5" strokeDasharray="3,4" />;
          })}

          {/* ULD wireframe */}
          <ULDFrame L={dims.L} W={dims.W} H={dims.H} sc={sc} />

          {/* Cargo boxes — back-to-front sort for correct overlap */}
          {[...boxes]
            .sort((a, b) => (a.oy + a.oz) - (b.oy + b.oz))
            .map(b => <Box key={b.cargo.id} b={b} sc={sc} />)
          }
        </svg>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6, paddingLeft: 4 }}>
          {Object.entries(CAT).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 10, height: 8, background: v.f, borderRadius: 2, border: '1px solid rgba(0,0,0,0.15)' }} />
              <span style={{ fontSize: 8, color: '#374151' }}>{v.label}</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 8, color: '#94A3B8' }}>
            ← {dims.L}cm长 · ↓ {dims.W}cm宽 · ↑ {dims.H}cm高
          </div>
        </div>
      </div>

      {/* Cargo chips */}
      {uld.cargoItems.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {uld.cargoItems.map(c => (
            <div key={c.id} style={{ background: CAT[c.category]?.f || '#3B82F6', borderRadius: 3, padding: '2px 6px', display: 'flex', flexDirection: 'column' }}>
              <Text style={{ fontSize: 8, color: '#fff', fontWeight: 600, lineHeight: 1.2 }}>{c.description.slice(0, 12)}</Text>
              <Text style={{ fontSize: 7, color: 'rgba(255,255,255,0.8)', lineHeight: 1.2 }}>{c.length_cm}×{c.width_cm}×{c.height_cm} · {c.weight_kg}kg</Text>
            </div>
          ))}
        </div>
      )}
      {uld.cargoItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: 14, color: '#94A3B8', fontSize: 11 }}>
          从左侧拖拽货物到 ULD，或点击「AI 排舱」
        </div>
      )}
    </div>
  );
}
