/**
 * CBA v5.2.3 — Canvas 3D ULD Visualizer
 * 黑屏修复：useLayoutEffect 替代 useEffect，确保 canvas 尺寸在 DOM paint 前已设置
 * FullscreenOverlay: 替代 Ant Design Modal，彻底解决 resize bug
 * 滚轮缩放：wheel 事件替代 Slider
 */
import React, { useState, useRef, useCallback, useLayoutEffect } from 'react';
import { Tag, Typography, Space, Button, Tooltip } from 'antd';
import { DeleteOutlined, ExpandOutlined, ShrinkOutlined } from '@ant-design/icons';
import type { CI, UI } from './CargoTypes';

const { Text } = Typography;

const CAT: Record<string, { c: string; label: string }> = {
  normal:       { c: '#3B82F6', label: '普通' },
  dgr:          { c: '#EF4444', label: '危险品' },
  live_animal:  { c: '#16A34A', label: '活体' },
  perishable:    { c: '#F59E0B', label: '生鲜' },
};

// ── 3D Math ──────────────────────────────────────────────────────────────────

interface CameraCfg { rx: number; ry: number; sc: number; cx: number; cy: number; }
interface Box3D     { ox: number; oy: number; oz: number; L: number; W: number; H: number; }

function project(x: number, y: number, z: number, cfg: CameraCfg) {
  const { rx, ry, sc, cx, cy } = cfg;
  const cosX = Math.cos(rx), sinX = Math.sin(rx);
  const cosY = Math.cos(ry), sinY = Math.sin(ry);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;
  const depth = Math.max(1, z2 + 800);
  return { px: x1 * (sc * 600) / depth + cx, py: -y2 * (sc * 600) / depth + cy, depth };
}

function projectBox(b: Box3D, cfg: CameraCfg) {
  const p = (x: number, y: number, z: number) => project(b.ox + x, b.oy + y, b.oz + z, cfg);
  return {
    front:  [p(0,0,b.H), p(b.L,0,b.H), p(b.L,0,0), p(0,0,0)],
    back:   [p(b.L,0,b.H), p(0,0,b.H), p(0,b.W,b.H), p(b.L,b.W,b.H)],
    right:  [p(b.L,0,0), p(b.L,b.W,0), p(b.L,b.W,b.H), p(b.L,0,b.H)],
    left:   [p(0,b.W,0), p(0,0,0), p(0,0,b.H), p(0,b.W,b.H)],
    top:    [p(0,b.W,b.H), p(b.L,b.W,b.H), p(b.L,b.W,0), p(0,b.W,0)],
    bottom: [p(0,0,0), p(b.L,0,0), p(b.L,b.W,0), p(0,b.W,0)],
  };
}

function faceDepth(pts: { depth: number }[]): number {
  return pts.reduce((s, p) => s + p.depth, 0) / pts.length;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lighting(hex: string, delta: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.max(0, Math.min(255, r + delta))},${Math.max(0, Math.min(255, g + delta))},${Math.max(0, Math.min(255, b + delta))})`;
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function wire(ctx: CanvasRenderingContext2D, pts: { px: number; py: number }[]) {
  ctx.beginPath(); ctx.moveTo(pts[0].px, pts[0].py);
  pts.slice(1).forEach(p => ctx.lineTo(p.px, p.py)); ctx.closePath();
}

// ── Packing ───────────────────────────────────────────────────────────────────

interface PkgBox { cargo: CI; ox: number; oy: number; oz: number; L: number; W: number; H: number; }

function gravityPack(cargoItems: CI[], L: number, W: number, H: number): PkgBox[] {
  const sorted = [...cargoItems]
    .map(c => ({ c, v: c.length_cm * c.width_cm * c.height_cm }))
    .sort((a, b) => b.v - a.v)
    .map(({ c }) => c);
  const grid: number[][] = Array.from({ length: Math.ceil(H / 5) + 1 }, () =>
    Array.from({ length: Math.ceil(L / 5) + 1 }, () => 0)
  );
  const placed: PkgBox[] = [];
  for (const c of sorted) {
    const cl = Math.ceil(c.length_cm / 5), ch = Math.ceil(c.height_cm / 5);
    let bestX = -1, bestZ = Infinity;
    for (let gz = 0; gz <= grid.length - ch; gz++) {
      for (let gx = 0; gx <= grid[0].length - cl; gx++) {
        let ok = true;
        outer: for (let dz = 0; dz < ch && ok; dz++)
          for (let dx = 0; dx < cl && ok; dx++)
            if (grid[gz + dz][gx + dx] !== 0) ok = false;
        if (ok && gz < bestZ) { bestZ = gz; bestX = gx; }
      }
    }
    if (bestX >= 0) {
      for (let dz = 0; dz < ch; dz++) for (let dx = 0; dx < cl; dx++) grid[bestZ + dz][bestX + dx] = 1;
      placed.push({ cargo: c, ox: bestX * 5, oy: 0, oz: bestZ * 5, L: c.length_cm, W: c.width_cm, H: c.height_cm });
    }
  }
  return placed;
}

// ── Drawing ────────────────────────────────────────────────────────────────────

function drawScene(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  L: number, Wd: number, Hd: number,
  boxes: PkgBox[], rx: number, ry: number, sc: number,
) {
  ctx.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H * 0.55;
  const cfg: CameraCfg = { rx, ry, sc: sc * Math.min(W * 0.8 / (L + Wd + 60), H * 0.75 / (L + Hd + 60)), cx, cy };

  ctx.setLineDash([3, 4]); ctx.strokeStyle = '#CBD5E1'; ctx.lineWidth = 0.4;
  for (let gx = 0; gx <= L; gx += 40) { const p1 = project(gx,0,0,cfg), p2 = project(gx,0,Wd,cfg); ctx.beginPath(); ctx.moveTo(p1.px,p1.py); ctx.lineTo(p2.px,p2.py); ctx.stroke(); }
  for (let gz = 0; gz <= Wd; gz += 40) { const p1 = project(0,0,gz,cfg), p2 = project(L,0,gz,cfg); ctx.beginPath(); ctx.moveTo(p1.px,p1.py); ctx.lineTo(p2.px,p2.py); ctx.stroke(); }
  ctx.setLineDash([]);

  interface Face3 { pts: { px: number; py: number; depth: number }[]; fill: string; depth: number; }
  const allFaces: Face3[] = [];
  const uBox: Box3D = { ox: 0, oy: 0, oz: 0, L, W: Wd, H: Hd };
  const uF = projectBox(uBox, cfg);
  allFaces.push({ pts: uF.back,   fill: 'rgba(191,219,254,0.35)', depth: faceDepth(uF.back) });
  allFaces.push({ pts: uF.left,   fill: 'rgba(219,234,254,0.40)', depth: faceDepth(uF.left) });
  allFaces.push({ pts: uF.right,  fill: 'rgba(147,197,253,0.30)', depth: faceDepth(uF.right) });
  allFaces.push({ pts: uF.bottom, fill: 'rgba(239,246,255,0.90)', depth: faceDepth(uF.bottom) });

  ctx.strokeStyle = '#1E40AF'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.55;
  [uF.front, uF.right, uF.top].forEach(p => { wire(ctx, p); ctx.stroke(); });
  ctx.globalAlpha = 1;

  for (const b of boxes) {
    const col = CAT[b.cargo.category]?.c || '#3B82F6';
    const bF = projectBox(b, cfg);
    allFaces.push({ pts: bF.front,  fill: lighting(col, +8),  depth: faceDepth(bF.front) });
    allFaces.push({ pts: bF.top,   fill: lighting(col, +28), depth: faceDepth(bF.top) });
    allFaces.push({ pts: bF.right, fill: lighting(col, -22), depth: faceDepth(bF.right) });
    allFaces.push({ pts: bF.left,  fill: lighting(col, -38), depth: faceDepth(bF.left) });
    allFaces.push({ pts: bF.bottom,fill: lighting(col, -50), depth: faceDepth(bF.bottom) });
    allFaces.push({ pts: bF.back,  fill: lighting(col, -55), depth: faceDepth(bF.back) });

    const fp = bF.front;
    const mx = (fp[0].px + fp[1].px + fp[2].px + fp[3].px) / 4;
    const my = (fp[0].py + fp[1].py + fp[2].py + fp[3].py) / 4;
    const dx = fp[1].px - fp[0].px, dy = fp[1].py - fp[0].py;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 15) {
      ctx.save();
      ctx.translate(mx, my); ctx.rotate(Math.atan2(dy, dx));
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = `bold ${Math.min(9, Math.max(6, len / 6))}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(b.cargo.description?.slice(0, 7) || '', 0, 0);
      ctx.restore();
    }
  }

  allFaces.sort((a, b) => b.depth - a.depth);
  for (const f of allFaces) {
    wire(ctx, f.pts);
    ctx.fillStyle = f.fill; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 0.3; ctx.stroke();
  }

  const fBot = uF.bottom;
  ctx.fillStyle = '#64748B'; ctx.font = '9px Arial'; ctx.textAlign = 'center';
  ctx.fillText(`← ${L}cm →`, (fBot[0].px + fBot[1].px) / 2, (fBot[0].py + fBot[1].py) / 2 + 14);
}

// ── Canvas3DCore ──────────────────────────────────────────────────────────────
// 核心：useLayoutEffect 确保 canvas 尺寸在 DOM paint 前设置完毕，解决黑屏根因

interface Canvas3DCoreProps {
  L: number; W: number; H: number;
  boxes: PkgBox[];
  rx: number; ry: number; sc: number;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onWheel?: (e: React.WheelEvent) => void;
  interactive?: boolean;
  style?: React.CSSProperties;
}

export function Canvas3DCore({
  L, W, H, boxes, rx, ry, sc,
  onPointerDown, onPointerMove, onPointerUp, onWheel,
  interactive = true, style,
}: Canvas3DCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // useLayoutEffect：在 DOM 更新后 paint 前执行，canvas 尺寸此时已正确
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawScene(ctx, canvas.width, canvas.height, L, W, H, boxes, rx, ry, sc);
  }, [L, W, H, boxes, rx, ry, sc]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    draw();
  }, [draw]);

  // 响应尺寸变化
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ro = new ResizeObserver(() => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      draw();
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, [draw]);

  // scene 参数变化时重绘
  useLayoutEffect(() => { draw(); }, [draw]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden', touchAction: 'none', ...style }}
      onPointerDown={interactive ? onPointerDown : undefined}
      onPointerMove={interactive ? onPointerMove : undefined}
      onPointerUp={interactive ? onPointerUp : undefined}
      onWheel={interactive ? onWheel : undefined}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%', cursor: interactive ? (onWheel ? 'grab' : 'default') : 'default' }} />
    </div>
  );
}

// ── Fullscreen3D ──────────────────────────────────────────────────────────────

interface Fullscreen3DProps {
  uld: UI;
  onClose: () => void;
  onCargoRemove: (uldId: string, cargoId: string) => void;
}

export function Fullscreen3D({ uld, onClose, onCargoRemove }: Fullscreen3DProps) {
  const [rx, setRx] = useState(-0.55);
  const [ry, setRy] = useState(0.60);
  const [sc, setSc] = useState(1.0);   // 缩放比例
  const [renderKey, setRenderKey] = useState(0);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const specs: Record<string, [number, number, number]> = {
    'LD-7': [223, 153, 163], 'LD-6': [153, 153, 163],
    'LD-3': [153, 153, 114], 'LD-2': [146, 118, 163],
    'LD-8': [223, 136, 163], 'LD-11': [153, 118, 163],
  };
  const [L, W, H] = specs[uld.uld_code] || specs['LD-6'];
  const boxes = gravityPack(uld.cargoItems, L, W, H);
  const fillPct = uld.cargoItems.reduce((s, c) => s + c.volume_m3, 0) / (L * W * H / 1e6);
  const fillColor = fillPct > 0.85 ? '#EF4444' : fillPct > 0.6 ? '#F59E0B' : '#16A34A';

  const handlePointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setRy(r => r + dx * 0.012);
    setRx(r => Math.max(-1.4, Math.min(-0.05, r + dy * 0.012)));
  };
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setSc(s => clamp(s * (e.deltaY < 0 ? 1.08 : 0.92), 0.3, 3.0));
  };
  const handleDelete = (cargoId: string) => {
    onCargoRemove(uld.id, cargoId);
    setRenderKey(k => k + 1);
  };

  // ESC 关闭
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rxDeg = Math.round(-rx * 180 / Math.PI);
  const ryDeg = Math.round(ry * 180 / Math.PI);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.88)', display: 'flex', flexDirection: 'column', animation: 'fsFadeIn 0.18s ease' }} onClick={onClose}>
      <style>{`
        @keyframes fsFadeIn { from { opacity: 0 } to { opacity: 1 } }
        .fs-hdr { display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: #1F4E79; color: #fff; }
        .fs-body { flex: 1; display: flex; min-height: 0; overflow: hidden; }
        .fs-canvas { flex: 1; background: linear-gradient(160deg,#F8FAFC,#EFF6FF); padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .fs-ctrl { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .fs-sidebar { width: 200px; background: #fff; border-left: 1px solid #e5e7eb; display: flex; flex-direction: column; overflow-y: auto; }
        .fs-legend { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 4px; }
      `}</style>

      {/* Header */}
      <div className="fs-hdr" onClick={e => e.stopPropagation()}>
        <Text style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
          📦 {uld.uld_serial || uld.uld_code}
        </Text>
        <Tag color={fillColor}>{Math.round(fillPct * 100)}% 装载</Tag>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>{L}×{W}×{H}cm · {uld.cargoItems.length}件</Text>
        <Text style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>拖拽旋转 · 滚轮缩放 · ESC关闭</Text>
        <Button size="small" onClick={onClose} style={{ marginLeft: 8 }}>关闭</Button>
      </div>

      {/* Body */}
      <div className="fs-body" onClick={e => e.stopPropagation()}>

        {/* 3D Canvas */}
        <div className="fs-canvas">
          <div style={{ flex: 1, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0', minHeight: 0 }}>
            <Canvas3DCore
              L={L} W={W} H={H} boxes={boxes}
              rx={rx} ry={ry} sc={sc}
              interactive
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={() => { dragging.current = false; }}
              onWheel={handleWheel}
            />
          </div>

          {/* Controls: 俯仰 + 旋转 + 缩放 + 重置 */}
          <div className="fs-ctrl">
            <Text style={{ fontSize: 10, color: '#64748B', width: 52 }}>俯仰 {rxDeg}°</Text>
            <input type="range" min={-80} max={-3} value={rxDeg}
              onChange={e => setRx(-Number(e.target.value) * Math.PI / 180)}
              style={{ flex: 1, accentColor: '#3B82F6' }} />
            <Text style={{ fontSize: 10, color: '#64748B', width: 52 }}>旋转 {ryDeg}°</Text>
            <input type="range" min={0} max={360} value={ryDeg}
              onChange={e => setRy(Number(e.target.value) * Math.PI / 180)}
              style={{ flex: 1, accentColor: '#3B82F6' }} />
            <Text style={{ fontSize: 10, color: '#64748B', width: 52 }}>缩放 {Math.round(sc * 100)}%</Text>
            <input type="range" min={30} max={300} value={Math.round(sc * 100)}
              onChange={e => setSc(Number(e.target.value) / 100)}
              style={{ flex: 1, accentColor: '#3B82F6' }} />
            <Button size="small" onClick={() => { setRx(-0.55); setRy(0.60); setSc(1.0); }}>重置</Button>
          </div>

          <div className="fs-legend">
            {Object.entries(CAT).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 10, height: 10, background: v.c, borderRadius: 2 }} />
                <span style={{ fontSize: 10, color: '#374151' }}>{v.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cargo sidebar */}
        <div className="fs-sidebar">
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', background: '#f9fafb', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>货物列表</Text>
            <Text style={{ fontSize: 10, color: '#94A3B8' }}>{uld.cargoItems.length}件</Text>
          </div>
          {uld.cargoItems.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: 11 }}>
              从左侧拖拽货物到 ULD，或点击「AI 排舱」
            </div>
          ) : (
            <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {uld.cargoItems.map(c => {
                const col = CAT[c.category]?.c || '#3B82F6';
                return (
                  <div key={c.id} style={{ background: col + '18', border: `1px solid ${col}44`, borderRadius: 6, padding: '5px 7px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: col }}>{c.description?.slice(0, 16)}</div>
                        <div style={{ fontSize: 9, color: '#64748B', marginTop: 1 }}>{c.length_cm}×{c.width_cm}×{c.height_cm}cm · {c.weight_kg}kg</div>
                        {c.dgr_class && <div style={{ fontSize: 9, color: '#EF4444', marginTop: 1 }}>⚠️ {c.dgr_class}{c.un_number ? ` · ${c.un_number}` : ''}</div>}
                      </div>
                      <Button size="small" danger icon={<DeleteOutlined />} style={{ fontSize: 10, flexShrink: 0 }} onClick={() => handleDelete(c.id)} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ULD3DView (compact list mode) ────────────────────────────────────────────

interface ULD3DViewProps {
  uld: UI;
  onRemove: (id: string) => void;
  onCargoRemove?: (uldId: string, cargoId: string) => void;
  onExpand?: (uld: UI) => void;
  defaultExpanded?: boolean;
}

export function ULD3DView({ uld, onRemove, onCargoRemove, onExpand, defaultExpanded = false }: ULD3DViewProps) {
  const [rx, setRx] = useState(-0.55);
  const [ry, setRy] = useState(0.60);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const specs: Record<string, [number, number, number]> = {
    'LD-7': [223, 153, 163], 'LD-6': [153, 153, 163],
    'LD-3': [153, 153, 114], 'LD-2': [146, 118, 163],
    'LD-8': [223, 136, 163], 'LD-11': [153, 118, 163],
  };
  const [L, W, H] = specs[uld.uld_code] || specs['LD-6'];
  const boxes = gravityPack(uld.cargoItems, L, W, H);
  const fillPct = uld.cargoItems.reduce((s, c) => s + c.volume_m3, 0) / (L * W * H / 1e6);
  const fillColor = fillPct > 0.85 ? '#EF4444' : fillPct > 0.6 ? '#F59E0B' : '#16A34A';

  const handlePointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setRy(r => r + dx * 0.012);
    setRx(r => Math.max(-1.4, Math.min(-0.05, r + dy * 0.012)));
  };

  return (
    <div style={{ userSelect: 'none' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Space size={4} wrap>
          <Text style={{ fontSize: 12, fontWeight: 700, color: '#1F4E79' }}>{uld.uld_serial || uld.uld_code}</Text>
          <Tag color={fillColor} style={{ fontSize: 9, margin: 0 }}>{Math.round(fillPct * 100)}%</Tag>
          <Text style={{ fontSize: 10, color: '#64748B' }}>{L}×{W}×{H}cm</Text>
          <Text style={{ fontSize: 10, color: '#64748B' }}>{uld.cargoItems.length}件</Text>
          {uld.position && <Tag color="blue" style={{ fontSize: 9 }}>{uld.position}</Tag>}
        </Space>
        <Space size={2}>
          <Tooltip title="删除此 ULD"><Button size="small" danger icon={<DeleteOutlined />} onClick={() => onRemove(uld.id)} /></Tooltip>
          {onExpand && (
            <Tooltip title="全屏查看">
              <Button size="small" icon={<ExpandOutlined />} onClick={() => onExpand(uld)} />
            </Tooltip>
          )}
        </Space>
      </div>

      {/* 3D Viewport — compact, fixed height */}
      <div
        style={{ background: 'linear-gradient(160deg,#F8FAFC 0%,#EFF6FF 100%)', borderRadius: 8, border: '1px solid #E2E8F0', padding: 8, height: 220, cursor: 'grab', touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => { dragging.current = false; }}
      >
        <Canvas3DCore
          L={L} W={W} H={H} boxes={boxes}
          rx={rx} ry={ry} sc={1}
          interactive
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={() => { dragging.current = false; }}
        />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
        {Object.entries(CAT).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 8, height: 8, background: v.c, borderRadius: 2 }} />
            <span style={{ fontSize: 8, color: '#374151' }}>{v.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
