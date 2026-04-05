// CBA v5.2 智能排舱系统
import React, { useState, useMemo } from 'react';
import { Card, Table, Button, Select, Tag, Space, Divider, Modal, Alert, Badge, Tooltip, message, Row, Col, Typography } from 'antd';
import { ThunderboltOutlined, ReloadOutlined, CheckCircleOutlined, DragOutlined } from '@ant-design/icons';
import { getMainDeckPositions, getNosePositions, getLowerFwdPositions, getLowerAftPositions, calculateCG } from '../data/hold_positions';
import { findULDType } from '../data/uld_specs';
import { checkULDCompatibility } from '../data/dgr_rules';
import { ULD3DView, Fullscreen3D } from '../components/cargo/ULD3DView';
import ConfirmModal from '../components/cargo/ConfirmModal';
import type { CI, UI, PlanResult, Cat } from '../components/cargo/CargoTypes';

const { Text } = Typography;

const CC: Record<string, string> = { normal: '#3B82F6', dgr: '#EF4444', live_animal: '#16A34A', perishable: '#F59E0B' };
const CT: Record<string, { t: string; c: string }> = {
  normal: { t: '普通', c: 'default' },
  dgr: { t: '危险品', c: 'error' },
  live_animal: { t: '活体', c: 'success' },
  perishable: { t: '生鲜', c: 'warning' },
};

const MOCK: CI[] = [
  { id: 'C001', awb: '999-12345678', description: '电子元器件', agent: '深圳华信货运', pieces: 2, weight_kg: 450, length_cm: 100, width_cm: 80, height_cm: 60, volume_m3: 0.48, chargeableWeight_kg: 450, category: 'normal', fee_per_kg: 8.5 },
  { id: 'C002', awb: '999-12345679', description: '锂电池设备(9类)', agent: '广州中贸货运', pieces: 1, weight_kg: 320, length_cm: 80, width_cm: 60, height_cm: 50, volume_m3: 0.24, chargeableWeight_kg: 320, category: 'dgr', dgr_class: '9', un_number: 'UN3481', fee_per_kg: 12.0 },
  { id: 'C003', awb: '999-12345680', description: '纺织品', agent: '上海德祥货运', pieces: 5, weight_kg: 680, length_cm: 120, width_cm: 100, height_cm: 80, volume_m3: 0.96, chargeableWeight_kg: 680, category: 'normal', fee_per_kg: 6.5 },
  { id: 'C004', awb: '999-12345681', description: '鲜活大闸蟹', agent: '顺丰冷链', pieces: 3, weight_kg: 120, length_cm: 40, width_cm: 40, height_cm: 30, volume_m3: 0.048, chargeableWeight_kg: 120, category: 'live_animal', temperature: 'chill', fee_per_kg: 22.0 },
  { id: 'C005', awb: '999-12345682', description: '进口药品', agent: '北京华润医药', pieces: 2, weight_kg: 85, length_cm: 40, width_cm: 30, height_cm: 25, volume_m3: 0.03, chargeableWeight_kg: 85, category: 'perishable', temperature: 'chill', fee_per_kg: 28.0 },
  { id: 'C006', awb: '999-12345683', description: '香水(3类)', agent: '上海化工物流', pieces: 4, weight_kg: 95, length_cm: 30, width_cm: 30, height_cm: 20, volume_m3: 0.018, chargeableWeight_kg: 95, category: 'dgr', dgr_class: '3', un_number: 'UN1266', fee_per_kg: 15.0 },
  { id: 'C007', awb: '999-12345684', description: '机械零件', agent: '振华重工物流', pieces: 1, weight_kg: 1200, length_cm: 150, width_cm: 120, height_cm: 100, volume_m3: 1.80, chargeableWeight_kg: 1200, category: 'normal', fee_per_kg: 7.0 },
  { id: 'C008', awb: '999-12345685', description: '生鲜水果', agent: '广州冷链', pieces: 10, weight_kg: 200, length_cm: 50, width_cm: 40, height_cm: 30, volume_m3: 0.06, chargeableWeight_kg: 200, category: 'perishable', temperature: 'ambient', fee_per_kg: 14.0 },
  { id: 'C009', awb: '999-12345686', description: '有机过氧化物', agent: '江苏化工', pieces: 2, weight_kg: 60, length_cm: 25, width_cm: 25, height_cm: 20, volume_m3: 0.013, chargeableWeight_kg: 60, category: 'dgr', dgr_class: '5.2', un_number: 'UN3101', fee_per_kg: 25.0 },
  { id: 'C010', awb: '999-12345687', description: '活体宠物犬', agent: '北京宠运', pieces: 1, weight_kg: 15, length_cm: 60, width_cm: 40, height_cm: 35, volume_m3: 0.084, chargeableWeight_kg: 15, category: 'live_animal', temperature: 'ambient', fee_per_kg: 38.0 },
  { id: 'C011', awb: '999-12345688', description: '服装', agent: '广州白云货运', pieces: 8, weight_kg: 520, length_cm: 100, width_cm: 80, height_cm: 60, volume_m3: 0.48, chargeableWeight_kg: 520, category: 'normal', fee_per_kg: 6.0 },
  { id: 'C012', awb: '999-12345689', description: '锂电池(9类)', agent: '深圳锂电池货运', pieces: 2, weight_kg: 250, length_cm: 60, width_cm: 50, height_cm: 40, volume_m3: 0.12, chargeableWeight_kg: 250, category: 'dgr', dgr_class: '9', un_number: 'UN3481', fee_per_kg: 12.0 },
];

// Build plan result
function buildPlan(ulds: UI[]): PlanResult {
  const all = ulds.flatMap(u => u.cargoItems);
  const totalWeight = all.reduce((s, c) => s + c.weight_kg, 0);
  const totalVolume = all.reduce((s, c) => s + c.volume_m3, 0);
  const totalRevenue = all.reduce((s, c) => s + c.chargeableWeight_kg * c.fee_per_kg, 0);
  const placed = ulds.filter(u => u.position);
  const cg = calculateCG(placed.map(u => ({
    weight_kg: u.cargoItems.reduce((s, c) => s + c.weight_kg, 0),
    position_code: u.position!
  })));
  const warns: string[] = [];
  ulds.forEach(u => {
    u.cargoItems.forEach(c1 => {
      u.cargoItems.forEach(c2 => {
        if (c1.id >= c2.id) return;
        if (c1.category === 'dgr' || c2.category === 'dgr') {
          const r = checkULDCompatibility(c1.dgr_class || '', c2.dgr_class || '');
          if (!r.allowed) warns.push(c1.description + ' 和 ' + c2.description + ': ' + r.message);
        }
      });
    });
  });
  const placedIds = new Set(all.map(c => c.id));
  return {
    ulds, totalWeight, totalVolume, totalRevenue,
    cg_mac_pct: cg.cg_mac_pct, cg_status: cg.status,
    dgr_warnings: warns,
    unplaced: MOCK.filter(c => !placedIds.has(c.id)),
    totalTickets: all.length,
  };
}

// W&B Chart component
function WnBChart({ cg, tw }: { cg: number; tw: number }) {
  const W = 260, H = 170, PL = 28, PR = 6, PT = 8, PB = 22;
  const cW = W - PL - PR, cH = H - PT - PB;
  const mk = 200000, mm = 45;
  const xv = (m: number) => PL + (m / mm) * cW;
  const yv = (k: number) => PT + cH - (k / mk) * cH;
  const to = [{m:9,k:90000},{m:9,k:186880},{m:33,k:186880},{m:33,k:90000},{m:9,k:90000}];
  const ld = [{m:9,k:80000},{m:9,k:170500},{m:38,k:170500},{m:38,k:80000},{m:9,k:80000}];
  const mz = [{m:11,k:50000},{m:11,k:149478},{m:36,k:149478},{m:36,k:50000},{m:11,k:50000}];
  const toP = to.map(p => `${xv(p.m)},${yv(p.k)}`).join(' ');
  const ldP = ld.map(p => `${xv(p.m)},${yv(p.k)}`).join(' ');
  const mzP = mz.map(p => `${xv(p.m)},${yv(p.k)}`).join(' ');
  const cX = xv(cg);
  const cY = Math.min(Math.max(yv(tw + 98600), PT), PT + cH);
  const ok = cg >= 9 && cg <= 33;
  return (
    <div>
      <svg width={W} height={H}>
        {[0, 50000, 100000, 150000, 200000].map(kg => (
          <g key={kg}>
            <line x1={PL} y1={yv(kg)} x2={PL + cW} y2={yv(kg)} stroke="#E2E8F0" strokeWidth={0.5} strokeDasharray="3,3" />
            <text x={PL - 3} y={yv(kg) + 4} textAnchor="end" fontSize={8} fill="#94A3B8">{(kg / 1000).toFixed(0)}t</text>
          </g>
        ))}
        {[0, 10, 20, 30, 40].map(mac => (
          <g key={mac}>
            <line x1={xv(mac)} y1={PT} x2={xv(mac)} y2={PT + cH} stroke="#E2E8F0" strokeWidth={0.5} strokeDasharray="3,3" />
            <text x={xv(mac)} y={PT + cH + 12} textAnchor="middle" fontSize={8} fill="#94A3B8">{mac}%</text>
          </g>
        ))}
        <polygon points={toP} fill="#FEE2E2" stroke="#DC2626" strokeWidth={1.5} />
        <polygon points={ldP} fill="#DCFCE7" stroke="#16A34A" strokeWidth={1.5} />
        <polygon points={mzP} fill="#FFFBEB" stroke="#B45309" strokeWidth={1} strokeDasharray="4,2" />
        <polyline points={to.map(p => `${xv(p.m)},${yv(p.k)}`).join(' ')} fill="none" stroke="#DC2626" strokeWidth={2} strokeDasharray="5,2" />
        <polyline points={ld.map(p => `${xv(p.m)},${yv(p.k)}`).join(' ')} fill="none" stroke="#16A34A" strokeWidth={2} />
        <circle cx={xv(18.5)} cy={yv(98600)} r={3} fill="#374151" />
        <text x={xv(18.5) + 4} y={yv(98600) - 3} fontSize={7} fill="#6B7280">OEW</text>
        {tw > 0 && (
          <>
            <line x1={cX} y1={PT} x2={cX} y2={PT + cH} stroke={ok ? '#2563EB' : '#DC2626'} strokeWidth={1.5} strokeDasharray="4,2" />
            <circle cx={cX} cy={cY} r={5} fill={ok ? '#2563EB' : '#DC2626'} stroke="#fff" strokeWidth={1.5} />
          </>
        )}
        <text x={PL + cW / 2} y={H - 2} textAnchor="middle" fontSize={8} fill="#374151" fontWeight={600}>重心 %MAC</text>
      </svg>
      <div style={{ textAlign: 'center', marginTop: 4 }}>
        <Text style={{ fontSize: 11, color: ok ? '#16A34A' : '#DC2626', fontWeight: 700 }}>
          {ok ? '✓' : '⚠'} CG:{cg.toFixed(1)}% MAC | {(tw + 98600).toLocaleString()}kg
        </Text>
      </div>
    </div>
  );
}

// Cargo List Panel
function CargoListPanel({ list, ulds, onDrag, onCargoRemove }: { list: CI[]; ulds: UI[]; onDrag: (e: React.DragEvent, id: string) => void; onCargoRemove?: (uid: string, cid: string) => void }) {
  const cols = [
    { title: 'AWB票号', dataIndex: 'awb', width: 130, fixed: 'left' as const, render: (t: string) => <Text style={{ fontSize: 11, fontFamily: 'monospace', color: '#1F4E79', fontWeight: 600 }}>{t}</Text>, sorter: (a: CI, b: CI) => a.awb.localeCompare(b.awb) },
    { title: '物品名称', dataIndex: 'description', width: 90, render: (t: string) => <Text style={{ fontSize: 11 }}>{t}</Text> },
    { title: '代理', dataIndex: 'agent', width: 82, render: (t: string) => <Text style={{ fontSize: 10, color: '#64748B' }}>{t}</Text> },
    { title: '特货', dataIndex: 'category', width: 135, render: (cat: Cat, r: CI) => (
      <Space size={1} wrap>
        <Tag color={CT[cat].c} style={{ fontSize: 9, margin: 0, borderRadius: 10 }}>{CT[cat].t}</Tag>
        {cat === 'dgr' && r.dgr_class && <Tag style={{ fontSize: 8, margin: 0, color: '#EF4444', borderColor: '#EF4444' }}>{r.dgr_class}类</Tag>}
        {cat === 'live_animal' && <Tag color="success" style={{ fontSize: 9, margin: 0 }}>🐾</Tag>}
        {cat === 'perishable' && <Tag color="warning" style={{ fontSize: 9, margin: 0 }}>{r.temperature === 'chill' ? '❄冷藏' : '常温'}</Tag>}
      </Space>
    ), filters: [{ text: '危险品', value: 'dgr' }, { text: '活体', value: 'live_animal' }, { text: '生鲜', value: 'perishable' }, { text: '普通', value: 'normal' }], onFilter: (v: unknown, r: CI) => r.category === v },
    { title: '件数', dataIndex: 'pieces', width: 42, render: (v: number) => <Text style={{ fontSize: 11 }}>{v}件</Text> },
    { title: 'kg', dataIndex: 'weight_kg', width: 62, render: (v: number) => <Text style={{ fontSize: 11, fontWeight: 700 }}>{v}</Text> },
    { title: 'm³', dataIndex: 'volume_m3', width: 54, render: (v: number) => <Text style={{ fontSize: 11, color: '#64748B' }}>{v.toFixed(3)}</Text> },
    { title: 'L×W×H(cm)', render: (_: unknown, r: CI) => <Text style={{ fontSize: 10, fontFamily: 'monospace', color: '#374151' }}>{r.length_cm}×{r.width_cm}×{r.height_cm}</Text> },
    { title: 'C/kg', render: (_: unknown, r: CI) => <Text style={{ fontSize: 10, color: r.chargeableWeight_kg > r.weight_kg ? '#EF4444' : '#16A34A', fontWeight: 700 }}>{r.chargeableWeight_kg}{r.chargeableWeight_kg > r.weight_kg ? ' ⚠' : ''}</Text> },
    { title: '状态', width: 100, render: (_: unknown, r: CI) => {
      const u = ulds.find(u => u.cargoItems.some(c => c.id === r.id));
      if (u) return (
        <Space size={2} wrap>
          <Tag color="blue" style={{ fontSize: 9 }}>{u.uld_serial || u.uld_code}{u.position ? '·' + u.position : ''}</Tag>
          {onCargoRemove && <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onCargoRemove(u.id, r.id)} style={{ fontSize: 9, padding: '0 4px', height: 20 }} />}
        </Space>
      );
      return <Tag style={{ fontSize: 9, color: '#94A3B8', borderColor: '#E2E8F0' }}>待装</Tag>;
    }},
    { title: '→ULD', width: 54, fixed: 'right' as const, render: (_: unknown, r: CI) => {
      const u = ulds.find(u => u.cargoItems.some(c => c.id === r.id));
      if (u) return <Text style={{ fontSize: 9, color: '#94A3B8' }}>—</Text>;
      return (
        <div draggable onDragStart={(e) => onDrag(e as unknown as React.DragEvent, r.id)} style={{ cursor: 'grab', display: 'flex', alignItems: 'center', gap: 2 }}>
          <DragOutlined style={{ fontSize: 11, color: '#2563EB' }} />
          <Text style={{ fontSize: 10, color: '#2563EB' }}>拖拽</Text>
        </div>
      );
    }},
  ];
  const tw = list.reduce((s, c) => s + c.weight_kg, 0);
  const tv = list.reduce((s, c) => s + c.volume_m3, 0);
  const dc = list.filter(c => c.category === 'dgr').length;
  return (
    <Card size="small"
      title={<Space size={8}><Text style={{ fontSize: 13, fontWeight: 700, color: '#1F4E79' }}>📦 货物列表</Text><Badge count={list.length} style={{ fontSize: 10 }} /></Space>}
      extra={<Space size={12}><Text style={{ fontSize: 10, color: '#64748B' }}>总重:<b>{tw.toLocaleString()}kg</b></Text><Text style={{ fontSize: 10, color: '#64748B' }}>体积:<b>{tv.toFixed(2)}m³</b></Text>{dc > 0 && <Tag color="error" style={{ fontSize: 9, margin: 0 }}>⚠{dc}类危品</Tag>}</Space>}
      styles={{ body: { padding: '8px' } }}>
      <Table size="small" pagination={{ pageSize: 8 }} dataSource={list} rowKey="id" columns={cols} scroll={{ x: 980, y: 360 }} />
    </Card>
  );
}

// ULD Build Panel
function ULDBuildPanel({ ulds, onRemove, onCargoRemove, onDrop, openUldModal }: {
  ulds: UI[]; onRemove: (id: string) => void; onCargoRemove: (uid: string, cid: string) => void;
  onDrop: (e: React.DragEvent, uid: string) => void;
}) {
  // 默认全部折叠，只有点击才展开
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const h = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };
  const deckColor = (d: string) => d === 'nose' ? '#C2410C' : d === 'main' ? '#1E4E8A' : '#065F46';
  const deckBg = (d: string) => d === 'nose' ? '#FFF7ED' : d === 'main' ? '#EFF6FF' : '#ECFDF5';

  // 每个 ULD 的 DGR 冲突警告（仅当 cargoItems 变化时重算，不在渲染路径重复计算）
  const uldDgrMap = useMemo(() => {
    const m = new Map<string, string[]>();
    ulds.forEach(u => {
      const warns: string[] = [];
      u.cargoItems.forEach((c1, i) => {
        u.cargoItems.slice(i + 1).forEach(c2 => {
          if (c1.category === 'dgr' || c2.category === 'dgr') {
            const r = checkULDCompatibility(c1.dgr_class || '', c2.dgr_class || '');
            if (!r.allowed) warns.push(`${c1.description}/${c2.description}`);
          }
        });
      });
      m.set(u.id, warns);
    });
    return m;
  }, [ulds]);

  // 每个 ULD 的货物类型标签
  const uldCatsMap = useMemo(() => {
    const m = new Map<string, Set<string>>();
    ulds.forEach(u => {
      const cats = new Set(u.cargoItems.map(c => c.category));
      m.set(u.id, cats);
    });
    return m;
  }, [ulds]);
  return (
    <Card size="small"
      title={<Space size={8}><Text style={{ fontSize: 13, fontWeight: 700, color: '#1F4E79' }}>📋 ULD组板工作台</Text><Badge count={ulds.length} /></Space>}
      styles={{ body: { padding: 8 } }}>
      {ulds.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#94A3B8', fontSize: 12 }}>从左侧拖拽货物或使用AI排舱</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
          {ulds.map(u => {
            const isExp = !!expanded[u.id];
            const wt = u.cargoItems.reduce((s: number, c: CI) => s + c.weight_kg, 0);
            return (
              <div key={u.id}
                draggable onDragOver={h} onDrop={(e) => { e.stopPropagation(); onDrop(e, u.id); }}
                onDragStart={(e) => { e.dataTransfer.setData('uldId', u.id); e.dataTransfer.setData('type', 'uld'); }}
                style={{
                  border: `2px solid ${u.position ? deckColor(u.deck) : '#E2E8F0'}`,
                  borderRadius: 8, overflow: 'hidden',
                  background: u.position ? deckBg(u.deck) : '#fff',
                  transition: 'all 0.15s', cursor: 'pointer',
                }}>
                {/* 折叠行：始终显示 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', cursor: 'pointer' }}
                  onClick={() => toggle(u.id)}>
                  <Tag style={{ fontSize: 9, margin: 0, borderRadius: 10, background: deckColor(u.deck), color: '#fff', border: 'none' }}>{u.uld_code}</Tag>
                  {uldCatsMap.get(u.id)?.has('dgr') && <Tag color="error" style={{ fontSize: 9, margin: 0 }}>危险品</Tag>}
                  {uldCatsMap.get(u.id)?.has('live_animal') && <Tag color="success" style={{ fontSize: 9, margin: 0 }}>活体</Tag>}
                  {uldCatsMap.get(u.id)?.has('perishable') && <Tag color="warning" style={{ fontSize: 9, margin: 0 }}>生鲜</Tag>}
                  {!uldCatsMap.get(u.id)?.has('dgr') && !uldCatsMap.get(u.id)?.has('live_animal') && !uldCatsMap.get(u.id)?.has('perishable') && <Tag style={{ fontSize: 9, margin: 0 }}>普通</Tag>}
                  {uldDgrMap.get(u.id)?.length > 0 && <Tag color="error" style={{ fontSize: 9, margin: 0 }}>⚠️冲突</Tag>}
                  <Text style={{ fontSize: 10, color: '#64748B', flex: 1 }}>{u.uld_serial}</Text>
                  <Text style={{ fontSize: 10 }}>{u.cargoItems.length}件 <b>{wt}kg</b></Text>
                  {u.position && <Tag style={{ fontSize: 8, margin: 0 }}>{u.position}</Tag>}
                  <Button size="small" icon={isExp ? '▲' : '▼'} style={{ fontSize: 9, padding: '0 4px', height: 20, border: 'none', background: 'none' }}
                    onClick={(e) => { e.stopPropagation(); toggle(u.id); }} />
                </div>
                {/* 展开内容 */}
                {isExp && (
                  <div style={{ borderTop: `1px dashed ${deckColor(u.deck)}40`, padding: 8 }}>
                    <ULD3DView uld={u} onRemove={onRemove} onCargoRemove={onCargoRemove} onExpand={openUldModal}  />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// Aircraft Hold with drag-drop swap
function AircraftHoldWithSwap({ ulds, onSlotDrop, onEmptySlotClick }: {
  ulds: UI[]; onSlotDrop: (e: React.DragEvent, pos: string) => void; onEmptySlotClick: (pos: string) => void;
}) {
  const [deck, setDeck] = useState<'main' | 'lower'>('main');
  const cgR = useMemo(() => {
    const p = ulds.filter(u => u.position).map(u => ({
      weight_kg: u.cargoItems.reduce((s, c) => s + c.weight_kg, 0),
      position_code: u.position!,
    }));
    return calculateCG(p);
  }, [ulds]);

  const gps = deck === 'main' ? [
    { k: 'main', l: '主舱MAIN', ps: getMainDeckPositions(), cols: 8, c: '#1E4E8A', bg: '#EFF6FF', fb: '#1E4E8A', bd: '#BFDBFE' },
    { k: 'nose', l: '鼻舱NOSE', ps: getNosePositions(), cols: 3, c: '#C2410C', bg: '#FFF7ED', fb: '#C2410C', bd: '#FED7AA' },
  ] : [
    { k: 'lf', l: '下舱前L1-L6', ps: getLowerFwdPositions(), cols: 4, c: '#065F46', bg: '#ECFDF5', fb: '#065F46', bd: '#A7F3D0' },
    { k: 'la', l: '下舱后L7-L12', ps: getLowerAftPositions(), cols: 4, c: '#059669', bg: '#ECFDF5', fb: '#059669', bd: '#A7F3D0' },
  ];

  return (
    <Card size="small"
      title={<Space size={8}>
        <Text style={{ fontSize: 13, fontWeight: 700, color: '#1F4E79' }}>✈️ B767-300BCF 货舱布局</Text>
        <Button size="small" type={deck === 'main' ? 'primary' : 'default'} onClick={() => setDeck('main')}>主舱</Button>
        <Button size="small" type={deck === 'lower' ? 'primary' : 'default'} onClick={() => setDeck('lower')}>下舱</Button>
      </Space>}
      styles={{ body: { padding: 8 } }}>
      {gps.map(g => (
        <div key={g.k} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: g.c, marginBottom: 4 }}>
            <Space><div style={{ width: 10, height: 10, background: g.c, borderRadius: 2 }} />{g.l} ({g.ps.length}位)</Space>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + g.cols + ', 1fr)', gap: 3 }}>
            {g.ps.map(pos => {
              const u = ulds.find(x => x.position === pos.code);
              return (
                <div key={pos.code}
                  draggable={!!u}
                  onDragStart={(e) => { if (!u) return; e.dataTransfer.setData('uldId', u.id); e.dataTransfer.setData('type', 'uld'); }}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => onSlotDrop(e, pos.code)}
                  onClick={() => !u && onEmptySlotClick(pos.code)}
                  style={{
                    padding: '3px 2px', minHeight: 44, borderRadius: 4,
                    border: '1.5px solid ' + (u ? g.fb : g.bd),
                    background: u ? g.fb : g.bg,
                    cursor: u ? 'grab' : 'pointer', transition: 'all 0.15s', textAlign: 'center',
                  }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: u ? '#fff' : g.c }}>{pos.code}</div>
                  {u ? (
                    <>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.85)' }}>{u.uld_serial || u.uld_code}</div>
                      <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.7)' }}>{u.cargoItems.reduce((s, c) => s + c.weight_kg, 0)}kg</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 7.5, color: '#94A3B8' }}>{pos.arm_mac_pct}%</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <Divider style={{ margin: '8px 0' }} />
      <div style={{ marginBottom: 4, fontSize: 11, fontWeight: 600, color: '#1F4E79' }}>📊 W&B 包线图</div>
      <WnBChart cg={cgR.cg_mac_pct} tw={cgR.total_weight_kg} />
      <div style={{ marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Text style={{ fontSize: 11 }}>装 <b style={{ color: '#059669' }}>{ulds.flatMap(u => u.cargoItems).length}</b> 件</Text>
        <Text style={{ fontSize: 11 }}>ULD <b>{ulds.filter(u => u.position).length}</b> 个</Text>
        <Text style={{ fontSize: 11 }}>总重 <b>{cgR.total_weight_kg.toLocaleString()}kg</b></Text>
        <Text style={{ fontSize: 11 }}>CG <b style={{ color: cgR.status === 'ok' ? '#16A34A' : '#DC2626' }}>{cgR.cg_mac_pct}%</b></Text>
      </div>
    </Card>
  );
}

// Main component
export default function LoadPlanningPage() {
  const [ulds, setUlds] = useState<UI[]>([]);
  const [counter, setCounter] = useState(1);
  const [modalUld, setModalUld] = useState<UI | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPlan, setConfirmPlan] = useState<PlanResult | null>(null);
  const [confirmMode, setConfirmMode] = useState<'manual' | 'ai'>('manual');
  const d = MOCK;

  const handleCargoDrag = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('cargoId', id);
    e.dataTransfer.setData('type', 'cargo');
  };

  const handleUldDrop = (e: React.DragEvent, uid: string) => {
    e.preventDefault();
    if (e.dataTransfer.getData('type') !== 'cargo') return;
    const cid = e.dataTransfer.getData('cargoId');
    const c = d.find(x => x.id === cid);
    if (!c) return;
    setUlds(prev => prev.map(u => u.id !== uid ? u : { ...u, cargoItems: [...u.cargoItems, c] }));
  };

  const addUld = (code: string) => {
    const ud = findULDType(code);
    const serial = 'LD' + String(counter).padStart(3, '0');
    setCounter(prev => prev + 1);
    setUlds(prev => [...prev, {
      id: 'U-' + Date.now(),
      uld_code: code,
      uld_name: ud?.common_names[0] || code,
      uld_full_name: ud?.full_name || code,
      uld_serial: serial,
      cargoItems: [],
      deck: (ud?.compatible_deck[0] === 'main' ? 'main' : 'lower') as 'main' | 'lower',
      dims: { l_cm: ud?.length_cm || 0, w_cm: ud?.width_cm || 0, h_cm: ud?.height_cm || 0 },
      max_load_kg: ud?.max_load_kg || 0,
      volume_m3: ud?.volume_m3 || 0,
    }]);
  };

  const removeUld = (id: string) => setUlds(prev => prev.filter(u => u.id !== id));
  const removeCargoFromUld = (uid: string, cid: string) => setUlds(prev => prev.map(u => u.id !== uid ? u : { ...u, cargoItems: u.cargoItems.filter(c => c.id !== cid) }));

  const handleUldSlotDrop = (e: React.DragEvent, posCode: string) => {
    e.preventDefault();
    if (e.dataTransfer.getData('type') !== 'uld') return;
    const uid = e.dataTransfer.getData('uldId');
    const targetUld = ulds.find(u => u.position === posCode);
    if (targetUld) {
      setUlds(prev => prev.map(u => u.id === uid ? { ...u, position: targetUld.position } : u.id === targetUld.id ? { ...u, position: posCode } : u));
    } else {
      setUlds(prev => prev.map(u => u.id === uid ? { ...u, position: posCode } : u));
    }
  };

  const handleEmptySlotClick = (posCode: string) => {
    const existing = ulds.find(u => u.position === posCode);
    if (existing) return;
    const free = ulds.find(u => !u.position);
    if (free) setUlds(prev => prev.map(u => u.id === free.id ? { ...u, position: posCode } : u));
  };

  // 检查货物 c 能否加入目标 ULD（基于 IATA DGR 隔离规则）
  const canAddToULD = (existingItems: CI[], newItem: CI): { allowed: boolean; reason: string } => {
    for (const existing of existingItems) {
      if (existing.category === 'dgr' || newItem.category === 'dgr') {
        const r = checkULDCompatibility(existing.dgr_class || '', newItem.dgr_class || '');
        if (!r.allowed) return { allowed: false, reason: r.message };
      }
    }
    return { allowed: true, reason: '' };
  };

  // 估算加入货物后，指定舱位重心是否仍在 W&B 安全包线内（9%~33% MAC）
  const canFitInPosition = (positionCode: string, uldWeight: number): boolean => {
    const cg = calculateCG([{ weight_kg: uldWeight, position_code: positionCode }]);
    return cg.status !== 'over_limit';
  };

  const aiPack = () => {
    const placedIds = new Set(ulds.flatMap(u => u.cargoItems.map(c => c.id)));
    const un = d.filter(c => !placedIds.has(c.id));
    if (!un.length) { message.info('所有货物已分配完毕'); return; }
    const sorted = [...un].sort((a, b) => (b.chargeableWeight_kg * b.fee_per_kg) - (a.chargeableWeight_kg * a.fee_per_kg));
    const nUI: UI[] = [];
    const mp = [...getMainDeckPositions(), ...getLowerFwdPositions(), ...getLowerAftPositions()];
    const mainSafe = mp.filter(p => p.code.startsWith('M'));
    const lowerSafe = mp.filter(p => p.code.startsWith('L'));

    sorted.forEach(c => {
      const deck = c.category === 'live_animal' || c.category === 'perishable' ? 'lower' : 'main';
      // 候选ULD：满足载重+数量 AND DGR兼容（关键约束）
      const candidates = nUI
        .filter(x => x.deck === deck
          && x.cargoItems.reduce((s, i) => s + i.weight_kg, 0) + c.weight_kg <= 5000
          && x.cargoItems.length < 10)
        .filter(x => canAddToULD(x.cargoItems, c).allowed)
        .sort((a, b) => b.cargoItems.reduce((s, i) => s + i.weight_kg, 0) - a.cargoItems.reduce((s, i) => s + i.weight_kg, 0));
      if (candidates.length > 0) {
        candidates[0].cargoItems.push(c);
      } else {
        const code = deck === 'main' ? 'LD-6' : 'LD-3';
        nUI.push({
          id: 'AI-' + Date.now() + '-' + nUI.length,
          uld_code: code, uld_name: deck === 'main' ? 'Q6' : 'AKE',
          uld_full_name: deck === 'main' ? 'LD-6(AKE)' : 'LD-3(AKE)',
          uld_serial: 'LD' + String(counter + nUI.length).padStart(3, '0'),
          cargoItems: [c], deck, dims: { l_cm: 0, w_cm: 0, h_cm: 0 }, max_load_kg: 0, volume_m3: 0,
        });
      }
    });

    // 位置分配：主舱优先填W&B安全舱位
    let mainIdx = 0, lowerIdx = 0;
    nUI.forEach(u => {
      if (u.deck === 'main' && mainIdx < mainSafe.length) {
        u.position = mainSafe[mainIdx++].code;
      } else if (u.deck === 'lower' && lowerIdx < lowerSafe.length) {
        u.position = lowerSafe[lowerIdx++].code;
      }
    });

    // 无法装载货物：如有则告知（因DGR冲突或舱位不足）
    const placedIdsAfter = new Set(nUI.flatMap(u => u.cargoItems.map(c => c.id)));
    const stillUnplaced = un.filter(c => !placedIdsAfter.has(c.id));
    if (stillUnplaced.length > 0) {
      message.warning(
        `以下货物无法装载（存在DGR隔离冲突或舱位不足）：${stillUnplaced.map(c => c.awb).join('、')}`,
        5
      );
    }

    setConfirmPlan(buildPlan(nUI));
    setConfirmMode('ai');
    setConfirmOpen(true);
  };

  const handleManualConfirm = () => {
    if (!ulds.length) { message.warning('请先组板'); return; }
    setConfirmPlan(buildPlan(ulds));
    setConfirmMode('manual');
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!confirmPlan) return;
    setUlds(confirmPlan.ulds);
    setConfirmOpen(false);
    message.success('排舱方案已提交生效');
  };

  const openUldModal = (u: UI) => setModalUld(u);
  const closeUldModal = () => setModalUld(null);

  const cgR = useMemo(() => {
    const p = ulds.filter(u => u.position).map(u => ({
      weight_kg: u.cargoItems.reduce((s, c) => s + c.weight_kg, 0),
      position_code: u.position!,
    }));
    return calculateCG(p);
  }, [ulds]);

  const allCargo = ulds.flatMap(u => u.cargoItems);
  const placedUlds = ulds.filter(u => u.position);

  return (
    <div style={{ padding: 12 }}>
      {/* Header toolbar */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap',
        background: '#fff', padding: '8px 12px', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>

        <Button size="small" type="primary" icon={<ThunderboltOutlined />} onClick={aiPack}>AI排舱</Button>
        <Button size="small" icon={<CheckCircleOutlined />} onClick={handleManualConfirm}
          style={{ background: '#16A34A', borderColor: '#16A34A', color: '#fff' }}>完成排舱</Button>
        <Button size="small" icon={<ReloadOutlined />}
          onClick={() => { setUlds([]); setCounter(1); message.info('已重置'); }}>重置</Button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Text style={{ fontSize: 11 }}>装<b style={{ color: '#059669' }}> {allCargo.length} </b>件</Text>
          <Text style={{ fontSize: 11 }}>ULD<b style={{ color: placedUlds.length === ulds.length && ulds.length > 0 ? '#16A34A' : '#F59E0B' }}> {placedUlds.length}/{ulds.length} </b>个</Text>
          <Text style={{ fontSize: 11 }}>收入<b style={{ color: '#16A34A' }}> ¥{allCargo.reduce((s, c) => s + c.chargeableWeight_kg * c.fee_per_kg, 0).toLocaleString()} </b></Text>
          <Text style={{ fontSize: 11 }}>CG <b style={{ color: cgR.status === 'ok' ? '#16A34A' : '#DC2626' }}>{cgR.cg_mac_pct}%</b></Text>
        </div>
      </div>


      {/* Three column layout */}
      <Row gutter={8}>
        <Col span={8}><CargoListPanel list={d} ulds={ulds} onDrag={handleCargoDrag} /></Col>
        <Col span={8}>
          <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: 700, color: '#1F4E79', marginRight: 4 }}>ULD板型：</Text>
            <Button size="small" style={{ fontWeight: 700, borderColor: '#1E40AF', color: '#1E40AF' }} onClick={() => addUld('LD-7')}>Q7 ×{ulds.filter(u => u.uld_code === 'LD-7').length}</Button>
            <Button size="small" style={{ fontWeight: 700, borderColor: '#2563EB', color: '#2563EB' }} onClick={() => addUld('LD-6')}>Q6 ×{ulds.filter(u => u.uld_code === 'LD-6').length}</Button>
            <Button size="small" style={{ fontWeight: 700, borderColor: '#065F46', color: '#065F46' }} onClick={() => addUld('LD-3')}>AKE ×{ulds.filter(u => u.uld_code === 'LD-3').length}</Button>
            <Button size="small" style={{ fontWeight: 700, borderColor: '#059669', color: '#059669' }} onClick={() => addUld('LD-2')}>AAU ×{ulds.filter(u => u.uld_code === 'LD-2').length}</Button>
            <Button size="small" style={{ fontWeight: 700, borderColor: '#7C3AED', color: '#7C3AED' }} onClick={() => addUld('LD-4')}>PLA ×{ulds.filter(u => u.uld_code === 'LD-4').length}</Button>
            <Button size="small" style={{ fontWeight: 700, borderColor: '#64748B', color: '#64748B' }} onClick={() => addUld('BULK')}>BULK ×{ulds.filter(u => u.uld_code === 'BULK').length}</Button>
          </div>
          <ULDBuildPanel ulds={ulds} onRemove={removeUld} onCargoRemove={removeCargoFromUld} onDrop={handleUldDrop} openUldModal={openUldModal} /></Col>
        <Col span={8}><AircraftHoldWithSwap ulds={ulds} onSlotDrop={handleUldSlotDrop} onEmptySlotClick={handleEmptySlotClick} /></Col>
      </Row>

      {/* ULD Fullscreen 3D — 替代旧 Modal */}
      {modalUld && (
        <Fullscreen3D
          uld={modalUld}
          onClose={closeUldModal}
          onCargoRemove={removeCargoFromUld}
        />
      )}


      {/* Confirm plan modal */}
      <ConfirmModal
        open={confirmOpen} plan={confirmPlan} mode={confirmMode}
        onConfirm={handleConfirm}
        onCancel={() => { setConfirmOpen(false); setConfirmPlan(null); message.info('方案已取消'); }}
      />
    </div>
  );
}
