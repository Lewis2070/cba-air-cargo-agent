/**
 * CBA v5.2 — True 3D ULD Packing Visualizer
 * - ULD rendered as a transparent wireframe 3D container
 * - Each cargo item rendered as a proportional 3D box (front + right + top faces)
 * - Boxes sized proportionally to real L×W×H dimensions
 * - Boxes placed inside ULD in realistic packing positions
 */
import React, { useState, useMemo } from 'react';
import { Slider, Tag, Typography, Space, Button, Tooltip } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { findULDType } from '../../data/uld_specs';
import type { UI, CI } from './CargoTypes';

const { Text } = Typography;

// Category colors with light/dark face variants
const C = {
  normal:     { front: '#3B82F6', right: '#1D4ED8', top: '#60A5FA' },
  dgr:        { front: '#EF4444', right: '#B91C1C', top: '#F87171' },
  live_animal:{ front: '#16A34A', right: '#15803D', top: '#4ADE80' },
  perishable: { front: '#F59E0B', right: '#B45309', top: '#FCD34D' },
};

interface Props {
  uld: UI;
  onRemove: (id: string) => void;
  onCargoRemove?: (uldId: string, cargoId: string) => void;
  onOpenModal?: (uld: UI) => void;
  compact?: boolean;
}

// ULD real-world dimensions (cm) — IATA standard
const ULD_DIMS: Record<string, { L: number; W: number; H: number }> = {
  'LD-7': { L: 223, W: 153, H: 163 },
  'LD-6': { L: 153, W: 153, H: 163 }, // Q6/AKE
  'LD-3': { L: 153, W: 153, H: 114 }, // AKE — lower height
  'LD-2': { L: 146, W: 118, H: 163 },
  'LD-8': { L: 223, W: 136, H: 163 },
  'LD-11':{ L: 153, W: 118, H: 163 },
};

function getULDims(code: string) {
  return ULD_DIMS[code] || ULD_DIMS['LD-6'];
}

// --- 3D Box faces ---
function BoxFace({ face, style }: { face: string; style: React.CSSProperties }) {
  return <div style={{ position: 'absolute', ...style, backfaceVisibility: 'hidden' }}>{face}</div>;
}

// Single cargo item as a 3D box
function CargoBox3D({
  cargo,
  pxPerCm,
  offsetX, offsetY, offsetZ,
  depthPx,
}: {
  cargo: CI;
  pxPerCm: number;
  offsetX: number; offsetY: number; offsetZ: number;
  depthPx: number;
}) {
  const colors = C[cargo.category] || C.normal;
  const L = cargo.length_cm * pxPerCm;
  const W = cargo.width_cm * pxPerCm;
  const H = cargo.height_cm * pxPerCm;
  const z = depthPx;

  const common: React.CSSProperties = {
    position: 'absolute',
    transformStyle: 'preserve-3d',
    backfaceVisibility: 'hidden',
  };

  return (
    <div style={{ ...common, transform: `translate3d(${offsetX}px, ${offsetY}px, ${offsetZ}px)` }}>
      {/* FRONT face */}
      <div style={{
        ...common,
        width: L, height: H,
        background: colors.front,
        border: '1px solid rgba(255,255,255,0.4)',
        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.2)',
        transform: 'translateZ(0px)',
        borderRadius: '2px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <span style={{ fontSize: 6, color: '#fff', fontWeight: 700, textAlign: 'center', lineHeight: 1.2, padding: 2, pointerEvents: 'none' }}>
          {cargo.description.length > 8 ? cargo.description.slice(0, 8) + '…' : cargo.description}
          <br/><span style={{ fontSize: 5, opacity: 0.85 }}>{cargo.length_cm}×{cargo.width_cm}×{cargo.height_cm}</span>
        </span>
      </div>
      {/* RIGHT face */}
      <div style={{
        ...common,
        width: z, height: H,
        background: colors.right,
        border: '1px solid rgba(0,0,0,0.2)',
        transform: `translateX(${L}px) rotateY(90deg)`,
        borderRadius: '2px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.8)', transform: 'rotate(90deg)', whiteSpace: 'nowrap' }}>
          {cargo.weight_kg}kg
        </span>
      </div>
      {/* TOP face */}
      <div style={{
        ...common,
        width: L, height: z,
        background: colors.top,
        border: '1px solid rgba(255,255,255,0.4)',
        transform: `translateY(-${z}px) rotateX(-90deg)`,
        borderRadius: '2px',
      }} />
    </div>
  );
}

// Main ULD 3D container
function ULDFrame3D({ L, W, H, color, fill }: { L: number; W: number; H: number; color: string; fill: string }) {
  const frame: React.CSSProperties = {
    position: 'absolute',
    transformStyle: 'preserve-3d',
    backfaceVisibility: 'hidden',
    pointerEvents: 'none',
  };
  return (
    <>
      {/* FRONT */}
      <div style={{ ...frame, width: L, height: H, border: `2px solid ${color}`, background: fill ? `${fill}22` : 'transparent', transform: 'translateZ(0px)' }} />
      {/* BACK */}
      <div style={{ ...frame, width: L, height: H, border: `2px solid ${color}`, background: 'transparent', transform: `translateZ(${W}px)` }} />
      {/* RIGHT */}
      <div style={{ ...frame, width: W, height: H, border: `2px solid ${color}`, background: 'transparent', transform: `translateX(${L}px) rotateY(90deg)` }} />
      {/* LEFT */}
      <div style={{ ...frame, width: W, height: H, border: `2px solid ${color}`, background: 'transparent', transform: 'rotateY(-90deg)' }} />
      {/* TOP */}
      <div style={{ ...frame, width: L, height: W, border: `2px solid ${color}`, background: 'transparent', transform: `translateY(-${W}px) rotateX(-90deg)` }} />
    </>
  );
}

export default function ULD3DView({ uld, onRemove, onCargoRemove, onOpenModal, compact = false }: Props) {
  const [rotation, setRotation] = useState(0);
  const udims = getULDims(uld.uld_code);

  // Container pixel scale — fit in available space
  const maxULDL = compact ? 120 : 200;
  const pxPerCm = maxULDL / Math.max(udims.L, udims.W, udims.H);

  const uldL = udims.L * pxPerCm;
  const uldW = udims.W * pxPerCm; // depth (Z)
  const uldH = udims.H * pxPerCm;

  // Pack cargo items into the ULD — row-by-row, layer-by-layer
  const placedBoxes = useMemo(() => {
    const sorted = [...uld.cargoItems].sort((a, b) => {
      // Larger items first
      const volA = a.length_cm * a.width_cm * a.height_cm;
      const volB = b.length_cm * b.width_cm * b.height_cm;
      return volB - volA;
    });

    const boxes: Array<{ cargo: CI; ox: number; oy: number; oz: number }> = [];
    // Simple gravity-packing simulation:
    // We fill from bottom, row by row, layer by layer
    // Row = along L, Column = along W, Layer = along H
    let currentZ = 0; // current fill depth along W axis
    let currentX = 0; // current position along L axis
    let currentY = 0; // current layer height along H axis
    let rowMaxH = 0;
    let rowMaxZ = 0;

    for (const c of sorted) {
      const cL = c.length_cm * pxPerCm;
      const cW = c.width_cm * pxPerCm;
      const cH = c.height_cm * pxPerCm;

      // Try to fit in current row
      if (currentX + cL <= uldL && Math.max(currentZ, rowMaxZ) + cW <= uldW && currentY + cH <= uldH) {
        const oz = currentZ;
        const ox = currentX;
        const oy = uldH - currentY - cH; // Y measured from bottom
        boxes.push({ cargo: c, ox, oy, oz });
        currentX += cL;
        rowMaxH = Math.max(rowMaxH, cH);
        rowMaxZ = Math.max(rowMaxZ, currentZ + cW);
      } else if (currentY + rowMaxH + cH <= uldH) {
        // Start new row (same layer)
        currentX = 0;
        currentZ = 0;
        currentY += rowMaxH;
        const oz = 0;
        const ox = 0;
        const oy = uldH - currentY - cH;
        boxes.push({ cargo: c, ox, oy, oz });
        currentX = cL;
        rowMaxH = cH;
        rowMaxZ = cW;
      } else {
        // No more space — skip (or stack on top)
        break;
      }
    }
    return boxes;
  }, [uld.cargoItems, uldL, uldW, uldH, pxPerCm]);

  const fillPct = uld.cargoItems.reduce((s, c) => s + c.volume_m3, 0) / (udims.L * udims.W * udims.H / 1e6);
  const fillColor = fillPct > 0.85 ? '#EF4444' : fillPct > 0.6 ? '#F59E0B' : '#16A34A';

  if (compact) {
    // Compact: show mini 3D + key info
    return (
      <div style={{ userSelect: 'none' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#1F4E79' }}>{uld.uld_serial || uld.uld_code}</span>
          <span style={{ fontSize: 9, color: '#64748B' }}>{uld.cargoItems.length}件</span>
          <Tag color={fillColor} style={{ fontSize: 8, margin: 0 }}>{Math.round(fillPct * 100)}%</Tag>
          {uld.position && <Tag style={{ fontSize: 8, margin: 0 }}>{uld.position}</Tag>}
        </div>
        <div style={{ perspective: 400, perspectiveOrigin: 'center' }}>
          <div style={{
            width: uldL, height: uldH,
            position: 'relative',
            transform: `rotateX(-8deg) rotateY(${-20}deg)`,
            transformStyle: 'preserve-3d',
          }}>
            <div style={{
              position: 'absolute', width: uldL, height: uldH,
              border: '1.5px solid #94A3B8',
              background: '#F8FAFC',
              borderRadius: 3,
              transform: 'translateZ(2px)',
              overflow: 'hidden',
              display: 'flex', flexWrap: 'wrap', gap: 1, padding: 2,
              alignContent: 'flex-start',
            }}>
              {uld.cargoItems.slice(0, 12).map((c, i) => (
                <div key={c.id} style={{
                  width: 12, height: 10,
                  background: C[c.category]?.front || '#3B82F6',
                  borderRadius: 2,
                  flexShrink: 0,
                }} title={`${c.description} ${c.weight_kg}kg`} />
              ))}
            </div>
            <div style={{
              position: 'absolute', width: uldL, height: 3,
              background: '#CBD5E1',
              transform: `translateY(${uldH}px) rotateX(-90deg)`,
              transformOrigin: 'top',
            }} />
          </div>
        </div>
      </div>
    );
  }

  // Full 3D modal view
  return (
    <div style={{ userSelect: 'none', padding: 4 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Space size={4}>
          <Text style={{ fontSize: 12, fontWeight: 700, color: '#1F4E79' }}>{uld.uld_serial || uld.uld_code}</Text>
          <Text style={{ fontSize: 10, color: '#64748B' }}>{udims.L}×{udims.W}×{udims.H}cm</Text>
          <Text style={{ fontSize: 10, color: '#64748B' }}>{uld.cargoItems.length}件</Text>
          <Tag color={fillColor} style={{ fontSize: 9, margin: 0 }}>{Math.round(fillPct * 100)}% 装载</Tag>
        </Space>
        <Space size={2}>
          {onCargoRemove && (
            <Tooltip title="移除此ULD">
              <Button size="small" icon={<DeleteOutlined />} danger onClick={() => onRemove(uld.id)} />
            </Tooltip>
          )}
          {onOpenModal && (
            <Button size="small" onClick={() => onOpenModal(uld)} style={{ fontSize: 9 }}>全屏</Button>
          )}
        </Space>
      </div>

      {/* Rotation slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Text style={{ fontSize: 9, color: '#64748B', width: 36 }}>旋转 {rotation}°</Text>
        <Slider
          min={0} max={720} value={rotation}
          onChange={setRotation}
          tooltip={{ formatter: (v) => `${v}°` }}
          style={{ flex: 1 }}
          styles={{ track: { background: '#3B82F6' } }}
        />
        <Button size="small" onClick={() => setRotation(0)} style={{ fontSize: 9 }}>重置</Button>
      </div>

      {/* 3D Viewport */}
      <div style={{
        perspective: 800,
        perspectiveOrigin: '50% 40%',
        background: 'linear-gradient(180deg, #F1F5F9 0%, #E2E8F0 100%)',
        borderRadius: 8,
        padding: '12px 8px 8px',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 24,
        }}>
          {/* 3D scene */}
          <div style={{ perspective: 800, perspectiveOrigin: '50% 50%' }}>
            <div style={{
              position: 'relative',
              width: uldL + 60, height: uldH + 40,
              transformStyle: 'preserve-3d',
              transform: `rotateX(-20deg) rotateY(${rotation}deg)`,
              transition: 'transform 0.05s',
            }}>
              {/* ULD wireframe */}
              <ULDFrame3D L={uldL} W={uldW} H={uldH} color="#1E40AF" fill="#3B82F6" />

              {/* Cargo boxes — positioned inside ULD */}
              <div style={{ position: 'absolute', transformStyle: 'preserve-3d', transform: `translateZ(${uldW}px)` }}>
                {placedBoxes.map(({ cargo, ox, oy, oz }) => (
                  <CargoBox3D
                    key={cargo.id}
                    cargo={cargo}
                    pxPerCm={pxPerCm}
                    offsetX={ox}
                    offsetY={oy}
                    offsetZ={oz}
                    depthPx={uldW}
                  />
                ))}
              </div>

              {/* Floor shadow */}
              <div style={{
                position: 'absolute',
                width: uldL, height: uldW,
                background: 'rgba(0,0,0,0.06)',
                transform: `translateY(${uldH}px) rotateX(-90deg)`,
                borderRadius: 2,
              }} />
            </div>
          </div>

          {/* Legend */}
          <div style={{ minWidth: 80 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#374151', marginBottom: 6 }}>ULD 规格</div>
            <div style={{ fontSize: 8, color: '#64748B', marginBottom: 2 }}>长 {udims.L} cm</div>
            <div style={{ fontSize: 8, color: '#64748B', marginBottom: 2 }}>宽 {udims.W} cm</div>
            <div style={{ fontSize: 8, color: '#64748B', marginBottom: 6 }}>高 {udims.H} cm</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#374151', marginBottom: 4 }}>货物种类</div>
            {Object.entries(C).map(([cat, cols]) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                <div style={{ width: 10, height: 8, background: cols.front, borderRadius: 2, border: '1px solid rgba(0,0,0,0.2)' }} />
                <span style={{ fontSize: 8, color: '#374151' }}>
                  {cat === 'normal' ? '普通' : cat === 'dgr' ? '危险品' : cat === 'live_animal' ? '活体' : '生鲜'}
                </span>
              </div>
            ))}
            <div style={{ fontSize: 8, color: '#94A3B8', marginTop: 8, lineHeight: 1.4 }}>
              货物按实际<br/>长×宽×高比例<br/>渲染
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
          {uld.cargoItems.map(c => (
            <div key={c.id} style={{
              background: C[c.category]?.front || '#3B82F6',
              borderRadius: 3,
              padding: '2px 5px',
              display: 'flex', flexDirection: 'column',
            }}>
              <span style={{ fontSize: 7, color: '#fff', fontWeight: 600 }}>{c.description.slice(0, 10)}</span>
              <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.8)' }}>{c.length_cm}×{c.width_cm}×{c.height_cm}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
