// ULDContainer3D.tsx - ULD 3D内部填充可视化 (CSS 3D Transforms)
// 依据：IATA ULD Specifications + 767-300BCF 配置
// v5.0 | 2026-03-26

import React, { useMemo, useState } from 'react';
import { Card, Tag, Button, Slider, Progress, Tooltip } from 'antd';
import { ULD_TYPES, rateFill, type FillRating } from '../data/uld_specs';

interface CargoItem {
  awb: string;
  description: string;
  weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  is_dgr?: boolean;
  category?: 'normal' | 'cold_chain' | 'valuable' | 'oversize' | 'bulk';
  priority?: 'high' | 'normal' | 'low';
}

interface Props {
  uldType: string;          // ULD代码: LD-3, LD-6, LD-7等
  cargoItems: CargoItem[];  // 已装载货物列表
  uldId?: string;
}

// 货物颜色编码
const CARGO_COLORS: Record<string, string> = {
  normal:   '#3B82F6',  // 蓝 - 普通货物
  dgr:      '#EF4444',  // 红 - 危险品
  cold_chain: '#06B6D4', // 青 - 冷链
  valuable: '#F59E0B',    // 金 - 高价值
  oversize: '#F97316',   // 橙 - 超尺寸
  bulk:     '#8B5CF6',    // 紫 - 散货
};
const CARGO_LABELS: Record<string, string> = {
  normal: '普通货', dgr: '危险品', cold_chain: '冷链', valuable: '高价值', oversize: '超尺寸', bulk: '散货',
};

// 根据ULD类型获取尺寸
function getULDSize(code: string): { L: number; W: number; H: number } {
  const uld = ULD_TYPES.find(u => u.code === code || u.altCode.includes(code));
  if (!uld) return { L: 300, W: 240, H: 160 };
  return { L: uld.intLength, W: uld.intWidth, H: uld.intHeight };
}

function px(v: number, max: number, scale: number): number {
  return Math.max(4, Math.min(v / max * scale, scale));
}

// 渲染单个货物3D块
function CargoBlock3D({ item, maxDims, scale, fill }: {
  item: CargoItem; maxDims: { L: number; W: number; H: number }; scale: number; fill: number;
}) {
  const color = CARGO_COLORS[item.category || (item.is_dgr ? 'dgr' : 'normal')];
  const label = item.description?.substring(0, 12) || item.awb;
  const lw = px(item.length_cm, maxDims.L, scale * 0.85);
  const ww = px(item.width_cm, maxDims.W, scale * 0.45);
  const hw = px(item.height_cm, maxDims.H, scale * 0.4);

  return (
    <div style={{ position: 'relative', width: lw, height: ww, margin: '1px', transformStyle: 'preserve-3d' }}>
      {/* 正面 */}
      <div style={{
        position: 'absolute', width: lw, height: ww,
        background: `${color}cc`,
        border: `1.5px solid ${color}`,
        borderRadius: 3,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontSize: Math.max(6, Math.min(9, lw / 6)),
        color: '#fff', fontWeight: 700,
        overflow: 'hidden', textAlign: 'center',
        transform: 'translateZ(0)',
        boxShadow: `0 0 6px ${color}66`,
      }}>
        <div style={{ fontSize: Math.max(5, lw / 7), overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: lw - 4 }}>{label}</div>
        <div style={{ fontSize: Math.max(5, ww / 4), opacity: 0.8 }}>{item.weight_kg}kg</div>
        {item.is_dgr && <div style={{ fontSize: 6, color: '#FCA5A5' }}>⚠️DGR</div>}
      </div>
      {/* 顶面 */}
      <div style={{
        position: 'absolute', width: lw, height: hw,
        background: `${color}77`, borderTop: `1.5px solid ${color}`,
        transform: `rotateX(-80deg) translateY(-${hw}px)`,
        transformOrigin: 'bottom', borderRadius: '3px 3px 0 0',
      }} />
      {/* 右面 */}
      <div style={{
        position: 'absolute', width: hw, height: ww, right: 0,
        background: `${color}99`, borderRight: `1.5px solid ${color}`,
        transform: `rotateY(80deg) translateX(${hw}px)`,
        transformOrigin: 'left', borderRadius: '0 3px 3px 0',
      }} />
    </div>
  );
}

// 主组件
export default function ULDContainer3D({ uldType, cargoItems, uldId }: Props) {
  const uld = ULD_TYPES.find(u => u.code === uldType || u.altCode.includes(uldType));
  const { L, W, H } = getULDSize(uldType);
  const scale = 120; // 基准scale

  const totalCargoWeight = cargoItems.reduce((s, i) => s + i.weight_kg, 0);
  const totalCargoVolume = cargoItems.reduce((s, i) => s + (i.length_cm * i.width_cm * i.height_cm / 6000), 0);
  const fillRate = uld && uld.volume > 0 ? (totalCargoVolume / uld.volume) * 100 : 0;
  const fillRating = rateFill(fillRate);
  const maxLoad_pct = uld && uld.maxLoad > 0 ? (totalCargoWeight / uld.maxLoad) * 100 : 0;
  const weightRating = rateFill(maxLoad_pct);

  const [rotateX, setRotateX] = useState(-25);
  const [rotateY, setRotateY] = useState(25);
  const [view3D, setView3D] = useState(true);

  const remainingWeight_pct = uld ? Math.max(0, 100 - maxLoad_pct) : 0;
  const remainingVol_pct = uld ? Math.max(0, 100 - fillRate) : 0;

  // 模拟堆叠顺序：按体积/重量排序，大件在下
  const sortedItems = useMemo(() =>
    [...cargoItems].sort((a, b) => (b.length_cm * b.width_cm * b.height_cm) - (a.length_cm * a.width_cm * a.height_cm)),
    [cargoItems]
  );

  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1F4E79' }}>
            📦 {uld?.name || uldType} ({uld?.code || uldType})
          </span>
          {uldId && <Tag color="blue" style={{ fontSize: 10 }}>{uldId}</Tag>}
          {uldId && <Tag style={{ fontSize: 10, background: fillRating.color + '22', color: fillRating.color, borderColor: fillRating.color }}>
            {fillRating.label}
          </Tag>}
        </div>
      }
      extra={
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Button size="small" onClick={() => { setRotateX(-25); setRotateY(25); }}>重置</Button>
          <Button size="small" type={view3D ? 'primary' : 'default'} onClick={() => setView3D(!view3D)}>
            {view3D ? '2D' : '3D'}
          </Button>
        </div>
      }
      style={{ borderRadius: 8 }}
    >
      {/* ULD规格 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        {[
          { label: '内尺寸', value: uld ? `${uld.intLength}×${uld.intWidth}×${uld.intHeight}cm` : '—', color: '#475569' },
          { label: '最大载重', value: uld ? `${uld.maxLoad}kg` : '—', color: '#DC2626' },
          { label: '最大容积', value: uld ? `${uld.volume}m³` : '—', color: '#7C3AED' },
          { label: '当前载重', value: `${totalCargoWeight.toFixed(0)}kg`, color: weightRating.color },
          { label: '当前体积', value: `${totalCargoVolume.toFixed(1)}m³`, color: fillRating.color },
        ].map(item => (
          <div key={item.label} style={{ fontSize: 10 }}>
            <span style={{ color: '#94A3B8' }}>{item.label}: </span>
            <b style={{ color: item.color }}>{item.value}</b>
          </div>
        ))}
      </div>

      {/* 装载进度条 */}
      {uld && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#64748B', marginBottom: 2 }}>
              <span>重量填充</span><span style={{ color: weightRating.color }}>{Math.min(100, maxLoad_pct).toFixed(0)}%</span>
            </div>
            <Progress percent={Math.min(100, maxLoad_pct)} size="small" showInfo={false}
              strokeColor={weightRating.color} trailColor="#E2E8F0" />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#64748B', marginBottom: 2 }}>
              <span>体积填充</span><span style={{ color: fillRating.color }}>{fillRate.toFixed(1)}%</span>
            </div>
            <Progress percent={Math.min(100, fillRate)} size="small" showInfo={false}
              strokeColor={fillRating.color} trailColor="#E2E8F0" />
          </div>
        </div>
      )}

      {/* 3D/2D 可视化 */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1b35 0%, #0a1428 100%)',
        borderRadius: 8, padding: '16px 12px',
        minHeight: 200, overflow: 'hidden',
        perspective: 600, perspectiveOrigin: '50% 30%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 8,
      }}>
        {cargoItems.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', fontSize: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 4 }}>📭</div>
            暂无货物装载<br />
            <span style={{ fontSize: 10 }}>请从左侧货物列表添加货物至 {uld?.code || uldType}</span>
          </div>
        ) : view3D ? (
          <div style={{ transformStyle: 'preserve-3d', transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`, transition: 'transform 0.3s', transformOrigin: 'center' }}>
            {/* ULD 外框 */}
            <div style={{
              width: scale, height: scale * 0.75, depth: scale * 0.5,
              position: 'relative', transformStyle: 'preserve-3d',
            }}>
              {/* 底面 */}
              <div style={{
                position: 'absolute', width: scale, height: scale * 0.5,
                background: 'rgba(30,80,160,0.2)', border: '1px dashed rgba(100,150,255,0.3)',
                transform: `rotateX(90deg) translateZ(-${scale * 0.25}px)`,
                transformOrigin: 'bottom', borderRadius: 2,
              }} />
              {/* 货物堆叠 */}
              <div style={{
                position: 'absolute', top: 0, left: 0,
                display: 'flex', flexWrap: 'wrap', gap: 2, padding: 4,
                width: scale * 0.9, height: scale * 0.9,
                alignItems: 'flex-end', justifyContent: 'center',
              }}>
                {sortedItems.map((item, i) => (
                  <CargoBlock3D key={item.awb + i} item={item}
                    maxDims={{ L, W, H }} scale={scale * 0.28} fill={fillRate} />
                ))}
              </div>
              {/* ULD 外框线 */}
              <div style={{
                position: 'absolute', width: scale, height: scale * 0.75,
                border: '2px solid rgba(100,150,255,0.6)',
                borderRadius: 4,
                background: 'rgba(30,60,130,0.15)',
                transform: 'translateZ(1px)',
                boxShadow: '0 0 12px rgba(59,130,246,0.3)',
              }} />
            </div>
          </div>
        ) : (
          /* 2D 平面图 */
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', alignItems: 'flex-end', padding: 8, width: '100%' }}>
            {sortedItems.map((item, i) => {
              const color = CARGO_COLORS[item.category || (item.is_dgr ? 'dgr' : 'normal')];
              const w = Math.max(24, Math.min(80, (item.length_cm / L) * 100));
              const h = Math.max(20, Math.min(60, (item.height_cm / H) * 80));
              return (
                <Tooltip key={item.awb + i} title={`${item.description}\n${item.weight_kg}kg | ${item.length_cm}×${item.width_cm}×${item.height_cm}cm`}>
                  <div style={{
                    width: w, height: h,
                    background: `${color}aa`, border: `1.5px solid ${color}`,
                    borderRadius: 4, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', cursor: 'default',
                    boxShadow: `0 0 4px ${color}44`,
                  }}>
                    <div style={{ fontSize: Math.max(6, w / 4), color: '#fff', fontWeight: 700, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: w - 4 }}>
                      {item.description?.substring(0, 6)}
                    </div>
                    <div style={{ fontSize: Math.max(5, w / 5), color: 'rgba(255,255,255,0.7)' }}>{item.weight_kg}kg</div>
                    {item.is_dgr && <div style={{ fontSize: 6, color: '#FCA5A5' }}>⚠️</div>}
                  </div>
                </Tooltip>
              );
            })}
            {/* 剩余空间 */}
            {remainingVol_pct > 10 && (
              <div style={{
                width: Math.max(30, remainingVol_pct * 0.8), height: 30,
                border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.25)', fontSize: 9,
              }}>
                空{remainingVol_pct.toFixed(0)}%
              </div>
            )}
          </div>
        )}

        {/* 控制条 */}
        {view3D && (
          <div style={{ width: '100%', maxWidth: 300, marginTop: 8 }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
              旋转视角 X: {rotateX}° | Y: {rotateY}°
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Slider min={-60} max={0} value={rotateX} onChange={setRotateX}
                style={{ flex: 1 }} size="small" />
              <Slider min={-60} max={60} value={rotateY} onChange={setRotateY}
                style={{ flex: 1 }} size="small" />
            </div>
          </div>
        )}
      </div>

      {/* 货物列表 */}
      {cargoItems.length > 0 && (
        <div style={{ marginTop: 6, maxHeight: 100, overflowY: 'auto' }}>
          <div style={{ fontSize: 9, color: '#94A3B8', marginBottom: 4 }}>
            已装载 {cargoItems.length} 件货物：
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {cargoItems.map((item, i) => (
              <Tag key={item.awb + i} style={{
                fontSize: 9, margin: 0,
                background: (CARGO_COLORS[item.category || (item.is_dgr ? 'dgr' : 'normal')]) + '22',
                borderColor: CARGO_COLORS[item.category || (item.is_dgr ? 'dgr' : 'normal')],
                color: CARGO_COLORS[item.category || (item.is_dgr ? 'dgr' : 'normal')],
              }}>
                {item.description?.substring(0, 15)} {item.weight_kg}kg
                {item.is_dgr && ' ⚠️'}
              </Tag>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
