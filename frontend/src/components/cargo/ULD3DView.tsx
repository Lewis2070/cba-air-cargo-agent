/**
 * CBA v5.2 — Canvas 3D ULD Visualizer (v3)
 * Full 360° rotation + proper z-depth sorting + Modal resize fix
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Slider, Tag, Typography, Space, Button, Tooltip } from 'antd';
import { DeleteOutlined, ExpandOutlined } from '@ant-design/icons';
import type { UI, CI } from './CargoTypes';

const { Text } = Typography;

const CAT: Record<string, { c: string; label: string }> = {
  normal:      { c: '#3B82F6', label: '普通' },
  dgr:         { c: '#EF4444', label: '危险品' },
  live_animal: { c: '#16A34A', label: '活体' },
  perishable:  { c: '#F59E0B', label: '生鲜' },
};

interface Props {
  uld: UI;
  onRemove: (id: string) => void;
  onCargoRemove?: (uldId: string, cargoId: string) => void;
  onOpenModal?: (uld: UI) => void;
  compact?: boolean;
}

// ── 3D math ──────────────────────────────────────────────────────────────────

function project(x: number, y: number, z: number, cfg: CameraCfg): { px: number; py: number; depth: number } {
  const { rx, ry, tx, ty, sc, cx, cy } = cfg;
  const cosX = Math.cos(rx), sinX = Math.sin(rx);
  const cosY = Math.cos(ry), sinY = Math.sin(ry);

  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;

  const depth = Math.max(1, z2 + 800);
  const scale = (sc * 600) / depth;
  return { px: x1 * scale + cx, py: -y2 * scale + cy, depth };
}

interface CameraCfg {
  rx: number; ry: number; sc: number; cx: number; cy: number; tx: number; ty: number;
}

interface Box3D {
  ox: number; oy: number; oz: number;
  L: number; W: number; H: number;
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

function faceDepth(pts: { px: number; py: number; depth: number }[]): number {
  return pts.reduce((s, p) => s + p.depth, 0) / pts.length;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function lighting(hex: string, delta: number, alpha = 1): string {
  const [r, g, b] = hexToRgb(hex);
  const rd = clamp(r + delta, 0, 255);
  const gd = clamp(g + delta, 0, 255);
  const bd = clamp(b + delta, 0, 255);
  return alpha < 1 ? `rgba(${rd},${gd},${bd},${alpha})` : `rgb(${rd},${gd},${bd})`;
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
    const cl = Math.ceil(c.length_cm / 5);
    const ch = Math.ceil(c.height_cm / 5);
    let bestX = -1, bestZ = Infinity;

    for (let gz = 0; gz <= grid.length - ch; gz++) {
      for (let gx = 0; gx <= grid[0].length - cl; gx++) {
        let ok = true;
        outer: for (let dz = 0; dz < ch && ok; dz++) {
          for (let dx = 0; dx < cl && ok; dx++) {
            if (grid[gz + dz][gx + dx] !== 0) ok = false;
          }
        }
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

// ── Drawing ───────────────────────────────────────────────────────────────────

function drawScene(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  L: number, Wd: number, Hd: number,
  boxes: PkgBox[],
  rx: number, ry: number,
  showGrid: boolean,
) {
  ctx.clearRect(0, 0, W, H);

  const sc = Math.min(W * 0.8 / (L + Wd + 60), H * 0.75 / (L + Hd + 60));
  const cx = W / 2, cy = H * 0.55;
  const cfg: CameraCfg = { rx, ry, sc, cx, cy, tx: 0, ty: 0 };

  // Floor grid
  if (showGrid) {
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = '#CBD5E1'; ctx.lineWidth = 0.4;
    for (let gx = 0; gx <= L; gx += 40) {
      const p1 = project(gx, 0, 0, cfg), p2 = project(gx, 0, Wd, cfg);
      ctx.beginPath(); ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py); ctx.stroke();
    }
    for (let gz = 0; gz <= Wd; gz += 40) {
      const p1 = project(0, 0, gz, cfg), p2 = project(L, 0, gz, cfg);
      ctx.beginPath(); ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py); ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  interface Face3 { pts: { px: number; py: number; depth: number }[]; fill: string; depth: number; }

  // ULD container (always shown, semi-transparent)
  const uldBox: Box3D = { ox: 0, oy: 0, oz: 0, L, W: Wd, H: Hd };
  const uFaces = projectBox(uldBox, cfg);

  const allFaces: Face3[] = [];

  // ULD walls — back faces first
  allFaces.push({ pts: uFaces.back,  fill: 'rgba(191,219,254,0.35)', depth: faceDepth(uFaces.back) });
  allFaces.push({ pts: uFaces.left,  fill: 'rgba(219,234,254,0.40)', depth: faceDepth(uFaces.left) });
  allFaces.push({ pts: uFaces.right, fill: 'rgba(147,197,253,0.30)', depth: faceDepth(uFaces.right) });
  allFaces.push({ pts: uFaces.bottom,fill: 'rgba(239,246,255,0.90)', depth: faceDepth(uFaces.bottom) });

  // ULD front frame edges (wireframe)
  const wire = (pts: { px: number; py: number; depth: number }[]) => {
    ctx.beginPath();
    ctx.moveTo(pts[0].px, pts[0].py);
    pts.slice(1).forEach(p => ctx.lineTo(p.px, p.py));
    ctx.closePath();
  };

  ctx.strokeStyle = '#1E40AF'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.55;
  [uFaces.front, uFaces.right, uFaces.top].forEach(wire);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Cargo boxes — all 6 faces with correct lighting
  for (const b of boxes) {
    const col = CAT[b.cargo.category]?.c || '#3B82F6';
    const bF = projectBox(b, cfg);
    // front: brightest (light from top-front)
    allFaces.push({ pts: bF.front,  fill: lighting(col, +8),  depth: faceDepth(bF.front) });
    // top: brightest surface (overhead light)
    allFaces.push({ pts: bF.top,   fill: lighting(col, +28), depth: faceDepth(bF.top) });
    // right: medium dark
    allFaces.push({ pts: bF.right, fill: lighting(col, -22), depth: faceDepth(bF.right) });
    // left: darker
    allFaces.push({ pts: bF.left,  fill: lighting(col, -38), depth: faceDepth(bF.left) });
    // bottom: darkest (shadow side)
    allFaces.push({ pts: bF.bottom,fill: lighting(col, -50), depth: faceDepth(bF.bottom) });
    // back: darkest
    allFaces.push({ pts: bF.back,  fill: lighting(col, -55), depth: faceDepth(bF.back) });

    // Label on front face
    const fp = bF.front;
    const mx = (fp[0].px + fp[1].px + fp[2].px + fp[3].px) / 4;
    const my = (fp[0].py + fp[1].py + fp[2].py + fp[3].py) / 4;
    const dx = fp[1].px - fp[0].px, dy = fp[1].py - fp[0].py;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 15) {
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(Math.atan2(dy, dx));
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = `bold ${Math.min(9, Math.max(6, len / 6))}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(b.cargo.description?.slice(0, 7) || '', 0, 0);
      ctx.restore();
    }
  }

  // Z-sort: furthest depth first, then draw
  allFaces.sort((a, b) => b.depth - a.depth);
  for (const f of allFaces) {
    ctx.beginPath();
    ctx.moveTo(f.pts[0].px, f.pts[0].py);
    f.pts.slice(1).forEach(p => ctx.lineTo(p.px, p.py));
    ctx.closePath();
    ctx.fillStyle = f.fill;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 0.3;
    ctx.stroke();
  }

  // Dimension labels
  const fBot = uFaces.bottom;
  const lmx = (fBot[0].px + fBot[1].px) / 2;
  const lmy = (fBot[0].py + fBot[1].py) / 2 + 14;
  ctx.fillStyle = '#64748B'; ctx.font = '9px Arial'; ctx.textAlign = 'center';
  ctx.fillText(`← ${L}cm →`, lmx, lmy);
}

// ── Canvas component ───────────────────────────────────────────────────────────

function Canvas3D({ L, W, H, boxes, rx, ry, compact, trigger }: {
  L: number; W: number; H: number;
  boxes: PkgBox[];
  rx: number; ry: number;
  compact?: boolean;
  trigger?: number; // increment to force redraw
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cw = canvas.width, ch = canvas.height;
    if (cw < 2 || ch < 2) return;
    drawScene(ctx, cw, ch, L, W, H, boxes, rx, ry, !compact);
  }, [L, W, H, boxes, rx, ry, compact]);

  // Redraw when trigger changes (Modal open/close)
  useEffect(() => { draw(); }, [draw]);

  // Size setup with delay for Modal animation
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const getSize = () => ({
      w: Math.max(2, parent.clientWidth),
      h: compact ? 110 : Math.max(2, parent.clientHeight || 320),
    });

    const update = () => {
      const { w, h } = getSize();
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        draw();
      }
    };

    update();
    // Small delay to ensure Modal has finished opening
    const tid = setTimeout(update, 60);

    const ro = new ResizeObserver(update);
    ro.observe(parent);
    return () => { clearTimeout(tid); ro.disconnect(); };
  }, [draw, compact]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: compact ? 110 : 320, overflow: 'hidden', borderRadius: 6 }}
    >
      <canvas
        ref={ref}
        style={{ display: 'block', width: '100%', height: '100%', cursor: compact ? 'default' : 'grab' }}
      />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ULD3DView({ uld, onRemove, onCargoRemove, onOpenModal, compact = false }: Props) {
  const [rx, setRx] = useState(-0.55);
  const [ry, setRy] = useState(0.60);
  const [modalOpen, setModalOpen] = useState(false);
  const [renderKey, setRenderKey] = useState(0); // force canvas redraw
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

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (compact) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [compact]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || compact) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setRy(r => r + dx * 0.012);
    setRx(r => Math.max(-1.4, Math.min(-0.05, r + dy * 0.012)));
  }, [compact]);

  const onPointerUp = useCallback(() => { dragging.current = false; }, []);

  // Trigger redraw when modal opens
  const handleOpenModal = useCallback(() => {
    setModalOpen(true);
    setRenderKey(k => k + 1);
    onOpenModal?.(uld);
    setTimeout(() => setRenderKey(k => k + 1), 80);
  }, [uld, onOpenModal]);

  const rxDeg = Math.round(-rx * 180 / Math.PI);
  const ryDeg = Math.round(ry * 180 / Math.PI);

  if (compact) {
    return (
      <div style={{ userSelect: 'none' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
          <Text style={{ fontSize: 10, fontWeight: 700, color: '#1F4E79' }}>{uld.uld_serial || uld.uld_code}</Text>
          <Tag color={fillColor} style={{ fontSize: 8, margin: 0 }}>{Math.round(fillPct * 100)}%</Tag>
          <Text style={{ fontSize: 9, color: '#64748B' }}>{uld.cargoItems.length}件</Text>
        </div>
        <div style={{ background: 'linear-gradient(160deg,#F8FAFC,#EFF6FF)', borderRadius: 4, border: '1px solid #E2E8F0' }}>
          <Canvas3D L={L} W={W} H={H} boxes={boxes} rx={rx} ry={ry} compact trigger={renderKey} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ userSelect: 'none', padding: '4px 4px 8px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Space size={4} wrap>
          <Text style={{ fontSize: 12, fontWeight: 700, color: '#1F4E79' }}>{uld.uld_serial || uld.uld_code}</Text>
          <Text style={{ fontSize: 10, color: '#64748B' }}>{L}×{W}×{H}cm</Text>
          <Tag color={fillColor} style={{ fontSize: 9, margin: 0 }}>{Math.round(fillPct * 100)}% 装载</Tag>
          <Text style={{ fontSize: 10, color: '#64748B' }}>{uld.cargoItems.length} 件</Text>
          {uld.position && <Tag color="blue" style={{ fontSize: 9 }}>{uld.position}</Tag>}
        </Space>
        <Space size={2}>
          {onCargoRemove && <Tooltip title="移除 ULD"><Button size="small" icon={<DeleteOutlined />} danger onClick={() => onRemove(uld.id)} /></Tooltip>}
          <Button size="small" icon={<ExpandOutlined />} onClick={handleOpenModal}>全屏</Button>
        </Space>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Text style={{ fontSize: 9, color: '#64748B', width: 48 }}>俯仰 {rxDeg}°</Text>
        <Slider min={-80} max={-3} value={rxDeg} onChange={v => setRx(-v * Math.PI / 180)} style={{ flex: 1 }}
          tooltip={{ formatter: v => `${v}°` }}
          styles={{ track: { background: '#3B82F6' } }} />
        <Text style={{ fontSize: 9, color: '#64748B', width: 48 }}>旋转 {ryDeg}°</Text>
        <Slider min={0} max={360} value={ryDeg} onChange={v => setRy(v * Math.PI / 180)} style={{ flex: 1 }}
          tooltip={{ formatter: v => `${v}°` }}
          styles={{ track: { background: '#3B82F6' } }} />
        <Button size="small" onClick={() => { setRx(-0.55); setRy(0.60); }} style={{ fontSize: 9 }}>重置</Button>
      </div>

      {/* 3D Viewport — drag to rotate 360° */}
      <div
        style={{
          background: 'linear-gradient(160deg,#F8FAFC 0%,#EFF6FF 100%)',
          borderRadius: 8, border: '1px solid #E2E8F0', padding: 8,
          cursor: 'grab', touchAction: 'none', userSelect: 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <Canvas3D L={L} W={W} H={H} boxes={boxes} rx={rx} ry={ry} trigger={renderKey} />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
        {Object.entries(CAT).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 10, height: 10, background: v.c, borderRadius: 2 }} />
            <span style={{ fontSize: 8, color: '#374151' }}>{v.label}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 8, color: '#94A3B8' }}>
          拖拽旋转 · {L}cm × {W}cm × {H}cm
        </div>
      </div>

      {/* Cargo chips */}
      {uld.cargoItems.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {uld.cargoItems.map(c => (
            <div key={c.id} style={{ background: CAT[c.category]?.c || '#3B82F6', borderRadius: 3, padding: '2px 6px' }}>
              <Text style={{ fontSize: 8, color: '#fff', fontWeight: 600, lineHeight: 1.2 }}>{c.description?.slice(0, 12)}</Text>
              <Text style={{ fontSize: 7, color: 'rgba(255,255,255,0.8)', lineHeight: 1.2 }}>{c.length_cm}×{c.width_cm}×{c.height_cm}</Text>
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
