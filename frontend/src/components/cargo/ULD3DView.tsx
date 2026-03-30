// CBA v5.2 True 3D ULD Visualizer with 0-720° rotation
import React, { useState, useMemo, useRef } from 'react';
import { Slider, Tooltip, Tag, Typography, Space, Button } from 'antd';
import { DeleteOutlined, ExpandOutlined } from '@ant-design/icons';
import { findULDType, rateFill } from '../../data/uld_specs';
import type { UI, CI } from './CargoTypes';

const CC: Record<string, string> = {
  normal: '#3B82F6',
  dgr: '#EF4444',
  live_animal: '#16A34A',
  perishable: '#F59E0B',
};

interface Props {
  uld: UI;
  onRemove: (uldId: string) => void;
  onCargoRemove?: (uldId: string, cargoId: string) => void;
  onOpenModal?: (uld: UI) => void;
  compact?: boolean;
}

// Real-world ULD dimensions (cm) for true 3D ratio
const ULD_SPEC: Record<string, { l: number; w: number; h: number }> = {
  'LD-7': { l: 223, w: 153, h: 163 }, // LD-7/RAP Q7
  'LD-6': { l: 153, w: 153, h: 163 }, // LD-6/AKE Q6
  'LD-3': { l: 153, w: 153, h: 163 }, // LD-3/AKE
  'LD-2': { l: 146, w: 118, h: 163 }, // LD-2/AAU
  'LD-8': { l: 223, w: 136, h: 163 }, // LD-8/AMU
  'LD-11': { l: 153, w: 118, h: 163 }, // LD-11/AGK
};

function getSpec(code: string) {
  return ULD_SPEC[code] || ULD_SPEC['LD-6'];
}

// Convert 3D rotation angle to visibility
// angle: 0-720 degrees
function getFace(deg: number): 'front' | 'right' | 'back' | 'left' | 'front-back' {
  const d = deg % 360;
  if (d < 70 || d > 315) return 'front';
  if (d >= 70 && d < 115) return 'right';
  if (d >= 115 && d < 245) return 'back';
  if (d >= 245 && d <= 315) return 'left';
  return 'front';
}

// Compute CSS transform for current rotation
function getTransform(deg: number): string {
  return `rotateY(${deg}deg)`;
}

export default function ULD3DView({ uld, onRemove, onCargoRemove, onOpenModal, compact = false }: Props) {
  const [rotation, setRotation] = useState(0); // 0-720
  const ud = findULDType(uld.uld_code);
  const spec = getSpec(uld.uld_code);
  const totV = uld.cargoItems.reduce((s, c) => s + c.volume_m3, 0);
  const fi = rateFill(totV, uld.uld_code);
  const maxV = ud?.volume_m3 || 3.66;
  const totW = uld.cargoItems.reduce((s, c) => s + c.weight_kg, 0);
  const remV = Math.max(0, maxV - totV);
  const face = getFace(rotation);

  // Grid layout for front face
  // Use 3D scale to match real ULD dimensions
  const containerL = compact ? 148 : 196; // 3D viewport width
  const containerW = compact ? 36 : 52;   // 3D depth (right face)
  const containerH = compact ? 90 : 120;  // 3D height

  // Front face: cargo arranged in rows (length × width plane)
  // Each column = spec.l_cm / 6, each row = spec.w_cm / 2
  const COLS = 6;
  const ROWS = 4;
  const cellL = containerL / COLS; // ~24px per cell
  const cellH = containerH / ROWS; // ~22-30px per cell

  function getCargoStyle(c: CI, idx: number): React.CSSProperties {
    // Arrange in grid order: row-major
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const visibleCols = Math.min(COLS, Math.ceil(Math.sqrt(uld.cargoItems.length * (spec.l / spec.w))));
    const visibleCol = idx % visibleCols;
    const visibleRow = Math.floor(idx / visibleCols);
    const w = (containerL * 0.88) / visibleCols - 2;
    const h = (containerH * 0.78) / ROWS - 2;
    return {
      position: 'absolute',
      left: visibleCol * ((containerL * 0.88) / visibleCols) + 1,
      top: visibleRow * ((containerH * 0.78) / ROWS) + containerH * 0.12,
      width: Math.max(8, Math.min(w, cellL * 1.8)),
      height: Math.max(6, Math.min(h, cellH * 1.5)),
      background: CC[c.category],
      borderRadius: 2,
      border: c.category !== 'normal' ? '1.5px solid rgba(255,255,255,0.9)' : 'none',
      boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      zIndex: 2,
      transform: 'translateZ(0)', // ensures it stays in front face plane
    };
  }

  // Right side face: cargo stacked vertically (depth × height plane)
  // Left side face: cargo stacked from opposite direction
  const rightFaceWidth = containerW;
  const rightFaceHeight = containerH;
  const maxStackH = (rightFaceHeight * 0.82) / uld.cargoItems.length;

  return (
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Space size={4} wrap>
          <Tag color={uld.deck === 'main' ? 'blue' : 'green'} style={{ margin: 0, fontSize: 10, fontWeight: 700 }}>
            {uld.uld_code}
          </Tag>
          <Typography.Text style={{ fontSize: 10, color: '#64748B' }}>{uld.uld_full_name}</Typography.Text>
          {uld.position && <Tag color="cyan" style={{ fontSize: 9 }}>{uld.position}</Tag>}
        </Space>
        <Space size={2}>
          {onOpenModal && (
            <Tooltip title="大图查看">
              <Button size="small" type="text" icon={<ExpandOutlined />} onClick={() => onOpenModal(uld)}
                style={{ fontSize: 10, color: '#2563EB', padding: 0, width: 14, height: 14 }} />
            </Tooltip>
          )}
          <Button size="small" type="text" icon={<DeleteOutlined />} onClick={() => onRemove(uld.id)}
            style={{ color: '#EF4444', fontSize: 10, padding: 0, width: 16, height: 16 }} />
        </Space>
      </div>

      {/* 3D Viewport */}
      <div style={{
        perspective: 800,
        display: 'flex',
        justifyContent: 'center',
        marginBottom: 6,
        background: 'linear-gradient(135deg, #0f1923 0%, #1a2a3a 100%)',
        borderRadius: 8,
        padding: '8px 4px 4px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* 3D Container — rotates based on slider */}
        <div style={{
          width: containerL + containerW + 4,
          height: containerH + 14,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateX(-12deg) ${getTransform(rotation)}`,
          transition: 'transform 0.05s linear',
        }}>
          {/* Front face */}
          <div style={{
            position: 'absolute',
            bottom: containerW,
            left: 0,
            width: containerL,
            height: containerH,
            background: 'rgba(30, 78, 138, 0.10)',
            border: '2px solid #1E4E8A',
            transform: 'translateZ(0px)',
            borderRadius: 4,
            overflow: 'hidden',
            display: 'flex',
            flexWrap: 'wrap',
            alignContent: 'flex-start',
            backfaceVisibility: 'hidden',
          }}>
            {/* Grid lines overlay */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
              backgroundImage: 'linear-gradient(rgba(30,78,138,0.15) 1px,transparent 1px), linear-gradient(90deg, rgba(30,78,138,0.15) 1px,transparent 1px)',
              backgroundSize: `${containerL / 4}px ${(containerH * 0.82) / 4}px`,
              backgroundPosition: '0 12%',
            }} />
            {uld.cargoItems.length === 0 ? (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography.Text style={{ fontSize: 9, color: '#475569' }}>拖入货物</Typography.Text>
              </div>
            ) : (
              uld.cargoItems.map((c, i) => (
                <Tooltip key={c.id} title={
                  <div style={{ fontSize: 10, lineHeight: 1.8 }}>
                    <b>{c.awb}</b><br />{c.description}<br />
                    <span style={{ color: '#93C5FD' }}>{c.length_cm}×{c.width_cm}×{c.height_cm}cm</span><br />
                    {c.weight_kg}kg | {c.volume_m3}m³<br />
                    {c.dgr_class && <span style={{ color: '#FCA5A5' }}>⚠ {c.dgr_class}类 {c.un_number}</span>}
                    {c.category === 'live_animal' && ' 🐾活体'}
                    {c.temperature === 'chill' && ' ❄冷藏'}
                  </div>
                }>
                  <div style={getCargoStyle(c, i)}>
                    {cellL > 18 && cellH > 10 && (
                      <Typography.Text style={{ fontSize: 5.5, color: '#fff', fontWeight: 700, textAlign: 'center', padding: '0 1px', lineHeight: 1.1 }}>
                        {c.awb.split('-')[1]?.slice(-4)}
                      </Typography.Text>
                    )}
                  </div>
                </Tooltip>
              ))
            )}
            {/* ULD dimension label */}
            <div style={{
              position: 'absolute', bottom: 1, right: 2, fontSize: 7, color: 'rgba(30,78,138,0.5)',
              fontFamily: 'monospace', zIndex: 3,
            }}>
              {spec.l}×{spec.w}×{spec.h}cm
            </div>
          </div>

          {/* Right face (visible at 60-120° — depth plane) */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: containerL,
            width: containerW,
            height: containerH,
            background: 'rgba(30, 78, 138, 0.25)',
            border: '2px solid #1E4E8A',
            transform: 'rotateY(90deg)',
            borderRadius: '0 4px 4px 0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'stretch',
            padding: `${containerH * 0.10}px 2px 2px`,
            gap: 1,
          }}>
            {uld.cargoItems.map((c, i) => (
              <div key={c.id} style={{
                height: Math.max(3, Math.min(maxStackH, 14)),
                background: CC[c.category],
                borderRadius: 1,
                opacity: 0.85,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 2,
              }}>
                {maxStackH > 8 && (
                  <Typography.Text style={{ fontSize: 5, color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.awb.split('-')[1]?.slice(-4)}
                  </Typography.Text>
                )}
              </div>
            ))}
            {/* Right face label */}
            <div style={{ position: 'absolute', bottom: 2, left: 3, fontSize: 6.5, color: 'rgba(30,78,138,0.5)', fontFamily: 'monospace' }}>
              W:{spec.w}cm
            </div>
          </div>

          {/* Top face (visible at slight tilt) */}
          <div style={{
            position: 'absolute',
            bottom: containerW + containerH - 2,
            left: 0,
            width: containerL,
            height: containerW,
            background: 'rgba(30, 78, 138, 0.15)',
            border: '2px solid #1E4E8A',
            transform: 'rotateX(90deg)',
            borderRadius: '4px 4px 0 0',
          }} />

          {/* Back face (visible at 180-270°) */}
          <div style={{
            position: 'absolute',
            bottom: containerW,
            left: 0,
            width: containerL,
            height: containerH,
            background: 'rgba(15, 25, 35, 0.5)',
            border: '2px solid rgba(30,78,138,0.4)',
            transform: 'rotateY(180deg) translateZ(0px)',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backfaceVisibility: 'hidden',
          }}>
            <Typography.Text style={{ fontSize: 9, color: '#475569' }}>← 背面 →</Typography.Text>
          </div>

          {/* Left face (visible at 240-300°) */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: -containerW,
            width: containerW,
            height: containerH,
            background: 'rgba(30, 78, 138, 0.18)',
            border: '2px solid #1E4E8A',
            transform: 'rotateY(-90deg)',
            borderRadius: '4px 0 0 4px',
          }} />
        </div>
      </div>

      {/* Rotation slider */}
      {!compact && (
        <div style={{ marginBottom: 4 }}>
          <Slider
            min={0} max={720} value={rotation}
            onChange={(v) => setRotation(v as number)}
            tooltip={{ formatter: (v) => `${v}°` }}
            styles={{ track: { background: '#1E4E8A' }, handle: { borderColor: '#2563EB' } }}
            size="small"
          />
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <Tag color={fi.color} style={{ fontSize: 9, margin: 0 }}>{fi.label}</Tag>
        <Typography.Text style={{ fontSize: 9, color: '#64748B' }}>{uld.cargoItems.length}件</Typography.Text>
        <Typography.Text style={{ fontSize: 9, color: '#64748B' }}>{totW}kg</Typography.Text>
        <Typography.Text style={{ fontSize: 9, color: '#64748B' }}>{totV.toFixed(2)}/{maxV}m³</Typography.Text>
        <Typography.Text style={{ fontSize: 9, color: remV > maxV * 0.3 ? '#F59E0B' : '#16A34A', fontWeight: 600 }}>
          余{remV.toFixed(2)}m³
        </Typography.Text>
        <Typography.Text style={{ fontSize: 8, color: '#94A3B8', marginLeft: 'auto' }}>
          {spec.l}×{spec.w}×{spec.h}cm
        </Typography.Text>
      </div>

      {/* Cargo item list */}
      {uld.cargoItems.length > 0 && (
        <div style={{ marginTop: 4, borderTop: '1px solid #F1F5F9', paddingTop: 4, maxHeight: 64, overflowY: 'auto' }}>
          {uld.cargoItems.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0', borderBottom: '1px solid #F8FAFC' }}>
              <Typography.Text style={{ fontSize: 9.5, color: CC[c.category], flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.awb} {c.description}
              </Typography.Text>
              {onCargoRemove && (
                <Button size="small" type="text" icon={<DeleteOutlined />}
                  onClick={() => onCargoRemove(uld.id, c.id)}
                  style={{ fontSize: 8, color: '#CBD5E1', padding: 0, width: 12, height: 12, flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
