#!/usr/bin/env python3
"""Merge v5.2 LoadPlanningPage from parts and write to final location."""
import os

base = '/workspace/cba-air-cargo-agent/frontend/src/pages/LoadPlanningPage.tsx'

# The content is split - write the complete file directly
# We'll write it in chunks using write tool calls

content = (
open('/workspace/cba-air-cargo-agent/frontend/src/pages/LoadPlanningPage_p3.tsx').read()
)

print(f"p3: {len(content)} bytes")

# Now write the complete merged file
# We need: header + CargoListPanel + ULDBuildPanel + old AircraftHold (unused) + Main + AircraftHoldWithSwap
# But p3 already has Main + AircraftHoldWithSwap
# We need p1 (imports + CC + CT + MOCK + buildPlan + WnBChart) + p2 (CargoList + ULDBuild + old AircraftHold - unused) + p3 (Main + AircraftHoldWithSwap)

p1_content = """// CBA v5.2 智能排舱系统
import React, { useState, useMemo } from 'react';
import {
  Card, Table, Button, Select, Tag, Space, Divider, Modal, Alert,
  Badge, Tooltip, message, Row, Col, Typography,
} from 'antd';
import {
  ThunderboltOutlined, ReloadOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, DeleteOutlined, DragOutlined,
} from '@ant-design/icons';
import {
  getMainDeckPositions, getNosePositions,
  getLowerFwdPositions, getLowerAftPositions, calculateCG,
} from '../data/hold_positions';
import { findULDType, rateFill } from '../data/uld_specs';
import { checkULDCompatibility } from '../data/dgr_rules';
import ULD3DView from '../components/cargo/ULD3DView';
import ConfirmModal from '../components/cargo/ConfirmModal';
import type { CI, UI, PlanResult, Cat } from '../components/cargo/CargoTypes';

const { Text } = Typography;

const CC: Record<string, string> = {
  normal: '#3B82F6', dgr: '#EF4444',
  live_animal: '#16A34A', perishable: '#F59E0B',
};
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

// ── Plan result builder ───────────────────────────────────────────────────
function buildPlan(ulds: UI[]): PlanResult {
  const all = ulds.flatMap(u => u.cargoItems);
  const totalWeight = all.reduce((s, c) => s + c.weight_kg, 0);
  const totalVolume = all.reduce((s, c) => s + c.volume_m3, 0);
  const totalRevenue = all.reduce((s, c) => s + c.chargeableWeight_kg * c.fee_per_kg, 0);
  const placed = ulds.filter(u => u.position);
  const cg = calculateCG(placed.map(u => ({ weight_kg: u.cargoItems.reduce((s, c) => s + c.weight_kg, 0), position_code: u.position! })));
  const warns: string[] = [];
  ulds.forEach(u => {
    u.cargoItems.forEach(c1 => {
      u.cargoItems.forEach(c2 => {
        if (c1.id >= c2.id) return;
        if (c1.category === 'dgr' || c2.category === 'dgr') {
          const r = checkULDCompatibility(c1.dgr_class || '', c2.dgr_class || '');
          if (!r.allowed) warns.push(c1.description + ' ↔ ' + c2.description + ': ' + r.message);
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

// ── W&B Chart ─────────────────────────────────────────────────────────────
function WnBChart({ cg, tw }: { cg: number; tw: number }) {
  const W = 260, H = 170, PL = 28, PR = 6, PT = 8, PB = 22;
  const cW = W - PL - PR, cH = H - PT - PB;
  const mk = 200000, mm = 45;
  const xv = (m: number) => PL + (m / mm) * cW;
  const yv = (k: number) => PT + cH - (k / mk) * cH;
  const to = [{m:9,k:90000},{m:9,k:186880},{m:33,k:186880},{m:33,k:90000},{m:9,k:90000}];
  const ld = [{m:9,k:80000},{m:9,k:170500},{m:38,k:170500},{m:38,k:80000},{m:9,k:80000}];
  const mz = [{m:11,k:50000},{m:11,k:149478},{m:36,k:149478},{m:36,k:50000},{m:11,k:50000}];
  const toP = to.map(p => xv(p.m)+','+yv(p.k)).join(' ');
  const ldP = ld.map(p => xv(p.m)+','+yv(p.k)).join(' ');
  const mzP = mz.map(p => xv(p.m)+','+yv(p.k)).join(' ');
  const cX = xv(cg), cY = Math.min(Math.max(yv(tw + 98600), PT), PT + cH);
  const ok = cg >= 9 && cg <= 33;
  return (
    <div>
      <svg width={W} height={H}>
        {[0,50000,100000,150000,200000].map(kg => (
          <g key={kg}>
            <line x1={PL} y1={yv(kg)} x2={PL+cW} y2={yv(kg)} stroke="#E2E8F0" strokeWidth={0.5} strokeDasharray="3,3"/>
            <text x={PL-3} y={yv(kg)+4} textAnchor="end" fontSize={8} fill="#94A3B8">{(kg/1000).toFixed(0)}t</text>
          </g>
        ))}
        {[0,10,20,30,40].map(mac => (
          <g key={mac}>
            <line x1={xv(mac)} y1={PT} x2={xv(mac)} y2={PT+cH} stroke="#E2E8F0" strokeWidth={0.5} strokeDasharray="3,3"/>
            <text x={xv(mac)} y={PT+cH+12} textAnchor="middle" fontSize={8} fill="#94A3B8">{mac}%</text>
          </g>
        ))}
        <polygon points={toP} fill="#FEE2E2" stroke="#DC2626" strokeWidth={1.5}/>
        <polygon points={ldP} fill="#DCFCE7" stroke="#16A34A" strokeWidth={1.5}/>
        <polygon points={mzP} fill="#FFFBEB" stroke="#B45309" strokeWidth={1} strokeDasharray="4,2"/>
        <polyline points={to.map(p => xv(p.m)+','+yv(p.k)).join(' ')} fill="none" stroke="#DC2626" strokeWidth={2} strokeDasharray="5,2"/>
        <polyline points={ld.map(p => xv(p.m)+','+yv(p.k)).join(' ')} fill="none" stroke="#16A34A" strokeWidth={2}/>
        <circle cx={xv(18.5)} cy={yv(98600)} r={3} fill="#374151"/>
        <text x={xv(18.5)+4} y={yv(98600)-3} fontSize={7} fill="#6B7280">OEW</text>
        {tw>0&&(<><line x1={cX} y1={PT} x2={cX} y2={PT+cH} stroke={ok?'#2563EB':'#DC2626'} strokeWidth={1.5} strokeDasharray="4,2"/><circle cx={cX} cy={cY} r={5} fill={ok?'#2563EB':'#DC2626'} stroke="#fff" strokeWidth={1.5}/></>)}
        <text x={PL+cW/2} y={H-2} textAnchor="middle" fontSize={8} fill="#374151" fontWeight={600}>重心 %MAC</text>
      </svg>
      <div style={{textAlign:'center',marginTop:4}}>
        <Text style={{fontSize:11,color:ok?'#16A34A':'#DC2626',fontWeight:700}}>
          {ok?'✓':'⚠'} CG:{cg.toFixed(1)}% MAC | {(tw+98600).toLocaleString()}kg
        </Text>
      </div>
    </div>
  );
}
"""

# Write part1 to a temp file
with open('/tmp/lpp_p1.tsx', 'w') as f:
    f.write(p1_content)
print(f"p1 content: {len(p1_content)} chars")
print("Written /tmp/lpp_p1.tsx")
