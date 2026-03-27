// LoadPlanningPage.tsx - CBA v5.1 智能排舱系统
// 三步流程：货物列表 → ULD组板 → 飞机装载
// 技术栈：React + Antd + CSS 3D (无Three.js)
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Card, Table, Button, Select, Tag, Space, Divider, Modal, Alert, Badge, Tooltip, message, Progress, Typography, Statistic, Row, Col, Checkbox, InputNumber, Empty, Slider } from 'antd';
import { ThunderboltOutlined, ReloadOutlined, SwapOutlined, CheckCircleOutlined, ExclamationCircleOutlined, WarningOutlined, InfoCircleOutlined, DeleteOutlined, PlusOutlined, DragOutlined } from '@ant-design/icons';
import { HOLD_POSITIONS, getMainDeckPositions, getNosePositions, getLowerFwdPositions, getLowerAftPositions, calculateCG, WB_ENVELOPE, HoldPosition } from '../data/hold_positions';
import { ULD_TYPES, findULDType, rateFill, calcChargeableWeight, normalizeULDCode } from '../data/uld_specs';
import { DGR_CATEGORIES, checkULDCompatibility, LIVE_ANIMAL_RULES, PERISHABLE_RULES } from '../data/dgr_rules';

const { Title, Text } = Typography;
const { confirm } = Modal;

// ─── Types ────────────────────────────────────────────────────────────────
type CargoCategory = 'normal' | 'dgr' | 'live_animal' | 'perishable';

interface CargoItem {
  id: string;
  awb: string;
  description: string;
  weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  volume_m3: number;
  chargeableWeight_kg: number;
  category: CargoCategory;
  dgr_class?: string;
  un_number?: string;
  packing_group?: string;
  temperature?: 'freeze' | 'chill' | 'ambient';
  fee_per_kg: number;        // 费率 元/kg
  shipper: string;
  consignee: string;
}

interface ULDUnit {
  id: string;
  uld_code: string;           // IATA代码：LD-7, LD-3...
  uld_name: string;           // 通俗名：Q7, AKE
  cargoItems: CargoItem[];
  deck: 'main' | 'lower' | 'nose';
  position?: string;          // 被分配到的舱位
}

// ─── Mock 货物数据 ────────────────────────────────────────────────────────
const MOCK_CARGO: CargoItem[] = [
  { id: 'C001', awb: '999-12345678', description: '电子元器件', weight_kg: 450, length_cm: 100, width_cm: 80, height_cm: 60, volume_m3: 0.48, chargeableWeight_kg: 450, category: 'normal', fee_per_kg: 8.5, shipper: '华为技术有限公司', consignee: '洛杉矶ABC电子' },
  { id: 'C002', awb: '999-12345679', description: '锂电池设备', weight_kg: 320, length_cm: 80, width_cm: 60, height_cm: 50, volume_m3: 0.24, chargeableWeight_kg: 320, category: 'dgr', dgr_class: '9', un_number: 'UN3481', fee_per_kg: 12.0, shipper: '宁德时代', consignee: '旧金山贸易公司' },
  { id: 'C003', awb: '999-12345680', description: '纺织品', weight_kg: 680, length_cm: 120, width_cm: 100, height_cm: 80, volume_m3: 0.96, chargeableWeight_kg: 680, category: 'normal', fee_per_kg: 6.5, shipper: '浙江纺织集团', consignee: '纽约服装批发商' },
  { id: 'C004', awb: '999-12345681', description: '鲜活海鲜', weight_kg: 280, length_cm: 60, width_cm: 50, height_cm: 40, volume_m3: 0.12, chargeableWeight_kg: 280, category: 'live_animal', fee_per_kg: 18.0, shipper: '东海渔业公司', consignee: '东京水产市场' },
  { id: 'C005', awb: '999-12345682', description: '医药用品', weight_kg: 180, length_cm: 50, width_cm: 40, height_cm: 30, volume_m3: 0.06, chargeableWeight_kg: 180, category: 'perishable', temperature: 'chill', fee_per_kg: 22.0, shipper: '华润医药集团', consignee: '首尔医疗器械' },
  { id: 'C006', awb: '999-12345683', description: '香水（易燃）', weight_kg: 95, length_cm: 30, width_cm: 30, height_cm: 20, volume_m3: 0.018, chargeableWeight_kg: 95, category: 'dgr', dgr_class: '3', un_number: 'UN1266', fee_per_kg: 15.0, shipper: '上海香料公司', consignee: '新加坡DFS免税店' },
  { id: 'C007', awb: '999-12345684', description: '机械零件', weight_kg: 1200, length_cm: 150, width_cm: 120, height_cm: 100, volume_m3: 1.80, chargeableWeight_kg: 1200, category: 'normal', fee_per_kg: 7.0, shipper: '上海振华重工', consignee: '汉堡西门子工厂' },
  { id: 'C008', awb: '999-12345685', description: '榴莲生鲜', weight_kg: 200, length_cm: 50, width_cm: 50, height_cm: 40, volume_m3: 0.10, chargeableWeight_kg: 200, category: 'perishable', temperature: 'ambient', fee_per_kg: 14.0, shipper: '马来西亚农贸', consignee: '广州江南市场' },
  { id: 'C009', awb: '999-12345686', description: '有机过氧化物', weight_kg: 60, length_cm: 30, width_cm: 30, height_cm: 25, volume_m3: 0.022, chargeableWeight_kg: 60, category: 'dgr', dgr_class: '5.2', un_number: 'UN3101', fee_per_kg: 25.0, shipper: '江苏化工集团', consignee: '法兰克福化工厂' },
  { id: 'C010', awb: '999-12345687', description: '活体宠物', weight_kg: 15, length_cm: 60, width_cm: 40, height_cm: 35, volume_m3: 0.084, chargeableWeight_kg: 15, category: 'live_animal', fee_per_kg: 35.0, shipper: '北京宠物托运', consignee: '伦敦动物进口商' },
  { id: 'C011', awb: '999-12345688', description: '服装', weight_kg: 520, length_cm: 100, width_cm: 80, height_cm: 60, volume_m3: 0.48, chargeableWeight_kg: 520, category: 'normal', fee_per_kg: 6.0, shipper: '广州服装城', consignee: '巴黎时尚中心' },
  { id: 'C012', awb: '999-12345689', description: '锂电池', weight_kg: 250, length_cm: 60, width_cm: 50, height_cm: 40, volume_m3: 0.12, chargeableWeight_kg: 250, category: 'dgr', dgr_class: '9', un_number: 'UN3481', fee_per_kg: 12.0, shipper: '比亚迪电子', consignee: '温哥华电器批发' },
];

// ─── 货舱区颜色配置 ─────────────────────────────────────────────────────
const DECK_COLORS: Record<string, { bg: string; border: string; label: string; text: string }> = {
  main_fwd:  { bg: '#1E4E8A', border: '#1E4E8A', label: '主舱前', text: '#fff' },
  main_ctr:  { bg: '#2563EB', border: '#2563EB', label: '主舱中', text: '#fff' },
  main_aft:  { bg: '#3B82F6', border: '#3B82F6', label: '主舱后', text: '#fff' },
  nose:      { bg: '#C2410C', border: '#C2410C', label: '鼻舱', text: '#fff' },
  lower_fwd: { bg: '#065F46', border: '#065F46', label: '下舱前', text: '#fff' },
  lower_aft: { bg: '#059669', border: '#059669', label: '下舱后', text: '#fff' },
};

// ─── 3D ULD 可视化组件 ─────────────────────────────────────────────────
function ULD3DView({ uld, onRemove }: { uld: ULDUnit; onRemove: (id: string) => void }) {
  const uldData = findULDType(uld.uld_code);
  const totalVol = uld.cargoItems.reduce((s, c) => s + c.volume_m3, 0);
  const fillInfo = rateFill(totalVol, uld.uld_code);
  const maxDim = 120; // px

  return (
    <div style={{ position: 'relative' }}>
      {/* ULD 外框（3D CSS） */}
      <div style={{ perspective: 600, display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <div style={{
          width: 160, height: 130,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: 'rotateX(-15deg) rotateY(-20deg)',
        }}>
          {/* 前面 */}
          <div style={{
            position: 'absolute', width: 160, height: 100, bottom: 0, left: 0,
            background: 'rgba(30,78,138,0.15)', border: '2px solid #1E4E8A',
            transform: 'translateZ(20px)', borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 2,
          }}>
            <Text style={{ fontSize: 10, color: '#1E4E8A', fontWeight: 700 }}>
              {uld.uld_code}
            </Text>
            <Text style={{ fontSize: 9, color: '#64748B' }}>
              {uld.uld_name}
            </Text>
          </div>
          {/* 货物堆叠 */}
          <div style={{ position: 'absolute', bottom: 2, left: 2, right: 22, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'flex-end', overflow: 'hidden' }}>
            {uld.cargoItems.map((c, i) => {
              const fillH = Math.min(80, Math.max(8, (c.volume_m3 / (uldData?.volume_m3 || 3.66)) * 80));
              return (
                <Tooltip key={c.id} title={`${c.description} · ${c.weight_kg}kg · ${c.volume_m3}m³`}>
                  <div
                    style={{
                      width: 14, height: fillH,
                      background: c.category === 'dgr' ? '#DC2626' : c.category === 'live_animal' ? '#16A34A' : c.category === 'perishable' ? '#F59E0B' : '#3B82F6',
                      borderRadius: 2, cursor: 'pointer', opacity: 0.9,
                      border: c.category !== 'normal' ? '1px solid #fff' : 'none',
                    }}
                    onClick={() => onRemove(c.id)}
                  />
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
      {/* 统计 */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Tag color={fillInfo.color} style={{ fontSize: 10 }}>{fillInfo.label}</Tag>
        <Text style={{ fontSize: 10, color: '#64748B' }}>{uld.cargoItems.length}件</Text>
        <Text style={{ fontSize: 10, color: '#64748B' }}>{(totalVol).toFixed(2)}/{uldData?.volume_m3 || '?'}m³</Text>
        <Text style={{ fontSize: 10, color: '#64748B' }}>{uld.cargoItems.reduce((s, c) => s + c.weight_kg, 0)}kg</Text>
      </div>
    </div>
  );
}

// ─── W&B 包线图组件 ──────────────────────────────────────────────────────
function WnBChart({ cg, totalWeight }: { cg: number; totalWeight: number }) {
  const W = 300, H = 220, PL = 40, PR = 15, PT = 15, PB = 35;
  const cW = W - PL - PR, cH = H - PT - PB;
  const maxKG = 200000;
  const maxMAC = 45;

  function x(mac: number) { return PL + (mac / maxMAC) * cW; }
  function y(kg: number) { return PT + cH - (kg / maxKG) * cH; }

  // TO 区域多边形点
  const toPts = WB_ENVELOPE.take_off.map(p => `${x(p.mac)},${y(p.kg)}`).join(' ');
  // LD 区域多边形点
  const ldPts = WB_ENVELOPE.landing.map(p => `${x(p.mac)},${y(p.kg)}`).join(' ');

  const currentX = x(cg);
  const currentY = y(totalWeight + 98600); // +OEW

  const inEnvelope = cg >= 9 && cg <= 33;

  return (
    <div style={{ position: 'relative' }}>
      <svg width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>
        {/* 网格线 */}
        {[0, 50000, 100000, 150000, 200000].map(kg => (
          <g key={kg}>
            <line x1={PL} y1={y(kg)} x2={PL + cW} y2={y(kg)} stroke="#E2E8F0" strokeWidth={0.5} strokeDasharray="3,3" />
            <text x={PL - 3} y={y(kg) + 4} textAnchor="end" fontSize={8} fill="#94A3B8">{`${(kg/1000).toFixed(0)}t`}</text>
          </g>
        ))}
        {[0, 10, 20, 30, 40].map(mac => (
          <g key={mac}>
            <line x1={x(mac)} y1={PT} x2={x(mac)} y2={PT + cH} stroke="#E2E8F0" strokeWidth={0.5} strokeDasharray="3,3" />
            <text x={x(mac)} y={PT + cH + 12} textAnchor="middle" fontSize={8} fill="#94A3B8">{mac}%</text>
          </g>
        ))}

        {/* 起飞区域 */}
        <polygon points={toPts} fill="#FEE2E2" stroke="#DC2626" strokeWidth={1.5} />
        {/* 落地区域 */}
        <polygon points={ldPts} fill="#DCFCE7" stroke="#16A34A" strokeWidth={1.5} />

        {/* TO 曲线 */}
        <polyline
          points={WB_ENVELOPE.take_off.map(p => `${x(p.mac)},${y(p.kg)}`).join(' ')}
          fill="none" stroke="#DC2626" strokeWidth={2} strokeDasharray="6,2"
        />
        {/* LD 曲线 */}
        <polyline
          points={WB_ENVELOPE.landing.map(p => `${x(p.mac)},${y(p.kg)}`).join(' ')}
          fill="none" stroke="#16A34A" strokeWidth={2}
        />
        {/* MZFW 线 */}
        <line x1={PL} y1={y(WB_ENVELOPE.mzfw_kg)} x2={PL + cW} y2={y(WB_ENVELOPE.mzfw_kg)} stroke="#B45309" strokeWidth={1} strokeDasharray="4,2" />
        <text x={PL + cW + 2} y={y(WB_ENVELOPE.mzfw_kg) + 4} fontSize={7} fill="#B45309">MZFW</text>

        {/* OEW 点 */}
        <circle cx={x(WB_ENVELOPE.oew_point.mac)} cy={y(WB_ENVELOPE.oew_point.kg)} r={3} fill="#1F2937" />
        <text x={x(WB_ENVELOPE.oew_point.mac) + 4} y={y(WB_ENVELOPE.oew_point.kg) - 4} fontSize={7} fill="#374151">空机</text>

        {/* 当前 CG */}
        {totalWeight > 0 && (
          <g>
            <line x1={currentX} y1={PT} x2={currentX} y2={PT + cH} stroke={inEnvelope ? '#2563EB' : '#DC2626'} strokeWidth={1.5} strokeDasharray="4,2" />
            <circle cx={currentX} cy={Math.min(Math.max(currentY, PT), PT + cH)} r={5} fill={inEnvelope ? '#2563EB' : '#DC2626'} stroke="#fff" strokeWidth={1.5} />
          </g>
        )}

        {/* 图例 */}
        <rect x={PL + 5} y={PT + 5} width={10} height={8} fill="#FEE2E2" stroke="#DC2626" strokeWidth={1} />
        <text x={PL + 18} y={PT + 13} fontSize={8} fill="#64748B">起飞限制</text>
        <rect x={PL + 80} y={PT + 5} width={10} height={8} fill="#DCFCE7" stroke="#16A34A" strokeWidth={1} />
        <text x={PL + 93} y={PT + 13} fontSize={8} fill="#64748B">落地限制</text>

        {/* 轴标签 */}
        <text x={PL + cW / 2} y={H - 2} textAnchor="middle" fontSize={9} fill="#374151" fontWeight={600}>重心位置 (% MAC)</text>
        <text x={8} y={PT + cH / 2} textAnchor="middle" fontSize={8} fill="#374151" transform={`rotate(-90, 8, ${PT + cH / 2})`}>重量 (kg)</text>
      </svg>

      {/* CG 状态指示 */}
      <div style={{ textAlign: 'center', marginTop: 4 }}>
        <Badge
          status={inEnvelope ? 'success' : 'error'}
          text={<Text style={{ fontSize: 11, color: inEnvelope ? '#059669' : '#DC2626' }}>CG: {cg.toFixed(1)}% MAC · {(totalWeight + 98600).toLocaleString()}kg</Text>}
        />
      </div>
    </div>
  );
}

// ─── 货舱布局面板 ────────────────────────────────────────────────────────
function AircraftHoldPanel({ ulds, onUldDrop, onUldRemove }: { ulds: ULDUnit[]; onUldDrop: (posCode: string) => void; onUldRemove: (posCode: string) => void }) {
  const [selectedPos, setSelectedPos] = useState<string | null>(null);
  const [showDeck, setShowDeck] = useState<'main' | 'lower'>('main');
  const [cgResult, setCgResult] = useState({ cg: 18, totalWeight: 0 });

  // 拖放处理
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e: React.DragEvent, posCode: string) => {
    e.preventDefault();
    const uldId = e.dataTransfer.getData('uldId');
    if (uldId) onUldDrop(posCode);
    setSelectedPos(posCode);
  };

  // 计算 CG
  useMemo(() => {
    const placed = ulds.filter(u => u.position).map(u => ({
      weight_kg: u.cargoItems.reduce((s, c) => s + c.weight_kg, 0),
      position_code: u.position!,
    }));
    const result = calculateCG(placed);
    setCgResult({ cg: result.cg_mac_pct, totalWeight: result.total_weight_kg });
  }, [ulds]);

  const posGroups = [
    { key: 'main', label: '主舱', positions: getMainDeckPositions(), cols: 8 },
    { key: 'nose', label: '鼻舱', positions: getNosePositions(), cols: 3 },
    { key: 'lower_fwd', label: '下舱前', positions: getLowerFwdPositions(), cols: 4 },
    { key: 'lower_aft', label: '下舱后', positions: getLowerAftPositions(), cols: 4 },
  ];

  const totalLoaded = ulds.filter(u => u.position).reduce((s, u) => s + u.cargoItems.reduce((ss, c) => ss + c.weight_kg, 0), 0);
  const totalCount = ulds.reduce((s, u) => s + u.cargoItems.length, 0);

  return (
    <div>
      <Card
        size="small"
        title={<span style={{ fontSize: 13, fontWeight: 700, color: '#1F4E79' }}>✈️ 飞机货舱布局 — B767-300BCF</span>}
        extra={
          <Space size={4}>
            <Button size="small" type={showDeck === 'main' ? 'primary' : 'default'} onClick={() => setShowDeck('main')}>主舱</Button>
            <Button size="small" type={showDeck === 'lower' ? 'primary' : 'default'} onClick={() => setShowDeck('lower')}>下舱</Button>
          </Space>
        }
        styles={{ body: { padding: 8 } }}
      >
        {/* 货舱区渲染 */}
        {(showDeck === 'main' ? posGroups.filter(g => g.key === 'main') : posGroups.filter(g => g.key !== 'main')).map(group => {
          const { bg, border, label, text } = DECK_COLORS[group.key] || {};
          return (
            <div key={group.key} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#1F4E79', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, background: bg, borderRadius: 2 }} />
                {label} ({group.positions.length}位)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${group.cols}, 1fr)`, gap: 3 }}>
                {group.positions.map(pos => {
                  const uld = ulds.find(u => u.position === pos.code);
                  const { bg: _bg, border: _border, text: _text } = DECK_COLORS[pos.deck] || {};
                  return (
                    <div
                      key={pos.code}
                      draggable
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, pos.code)}
                      onClick={() => setSelectedPos(selectedPos === pos.code ? null : pos.code)}
                      style={{
                        padding: '3px 2px',
                        minHeight: 38,
                        borderRadius: 4,
                        border: `1.5px solid ${uld ? _bg : selectedPos === pos.code ? '#F59E0B' : '#E2E8F0'}`,
                        background: uld ? _bg : selectedPos === pos.code ? '#FFFBEB' : `${_bg}20`,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s',
                        position: 'relative',
                      }}
                    >
                      <div style={{ fontSize: 9, fontWeight: 700, color: uld ? '#fff' : _bg }}>{pos.code}</div>
                      {uld ? (
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.85)' }}>{uld.uld_code}·{uld.cargoItems.length}件</div>
                      ) : (
                        <div style={{ fontSize: 7, color: '#94A3B8' }}>{pos.arm_mac_pct}%</div>
                      )}
                      {uld && (
                        <div
                          style={{ position: 'absolute', top: -6, right: -4, width: 14, height: 14, background: '#EF4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 8, color: '#fff' }}
                          onClick={(e) => { e.stopPropagation(); onUldRemove(pos.code); }}
                        >×</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <Divider style={{ margin: '8px 0' }} />

        {/* W&B 图 */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#1F4E79', marginBottom: 4 }}>📊 载重平衡包线</div>
          <WnBChart cg={cgResult.cg} totalWeight={cgResult.totalWeight} />
        </div>

        {/* 已装载汇总 */}
        <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Text style={{ fontSize: 11 }}>已装 <b style={{ color: '#059669' }}>{totalCount}</b> 件</Text>
          <Text style={{ fontSize: 11 }}>已用 ULD <b>{ulds.filter(u => u.position).length}</b> 个</Text>
          <Text style={{ fontSize: 11 }}>总重 <b>{(totalLoaded / 1000).toFixed(1)}t</b></Text>
        </div>
      </Card>
    </div>
  );
}

// ─── 主组件 ──────────────────────────────────────────────────────────────
export default function LoadPlanningPage() {
  const [cargoList] = useState<CargoItem[]>(MOCK_CARGO);
  const [selectedCargo, setSelectedCargo] = useState<Set<string>>(new Set());
  const [ulds, setUlds] = useState<ULDUnit[]>([]);
  const [selectedUldId, setSelectedUldId] = useState<string | null>(null);
  const [uldFilter, setUldFilter] = useState<'all' | 'main' | 'lower'>('all');
  const [conflictWarnings, setConflictWarnings] = useState<string[]>([]);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<ULDUnit[] | null>(null);

  // ─── ULD 推荐 ───────────────────────────────────────────────────────
  const recommendedForSelected = useMemo(() => {
    const total = selectedCargo.size;
    if (total === 0) return [];
    const sel = cargoList.filter(c => selectedCargo.has(c.id));
    const avgWeight = sel.reduce((s, c) => s + c.chargeableWeight_kg, 0) / total;
    const avgVol = sel.reduce((s, c) => s + c.volume_m3, 0) / total;
    // 优先下舱的货物
    const hasLower = sel.some(c => c.category === 'live_animal' || c.category === 'perishable');
    const deck = hasLower ? 'lower' : undefined;
    return avgWeight > 0 ? [] : [];
  }, [selectedCargo, cargoList]);

  // ─── 向 ULD 添加货物 ────────────────────────────────────────────────
  const addCargoToUld = useCallback((uldId: string, cargoId: string) => {
    setUlds(prev => prev.map(u => {
      if (u.id !== uldId) return u;
      const cargo = cargoList.find(c => c.id === cargoId);
      if (!cargo) return u;
      // 危险品冲突检测
      const conflicts: string[] = [];
      u.cargoItems.forEach(existing => {
        if (existing.category === 'dgr' || cargo.category === 'dgr') {
          const result = checkULDCompatibility(existing.dgr_class || '', cargo.dgr_class || '');
          if (!result.allowed) conflicts.push(`${existing.description} ↔ ${cargo.description}: ${result.message}`);
        }
      });
      if (conflicts.length > 0) {
        setConflictWarnings(prev => [...new Set([...prev, ...conflicts])]);
      }
      return { ...u, cargoItems: [...u.cargoItems, cargo] };
    }));
  }, [cargoList]);

  // ─── 从 ULD 移除货物 ───────────────────────────────────────────────
  const removeCargoFromUld = useCallback((uldId: string, cargoId: string) => {
    setUlds(prev => prev.map(u => u.id !== uldId ? u : { ...u, cargoItems: u.cargoItems.filter(c => c.id !== cargoId) }));
  }, []);

  // ─── 新建 ULD ──────────────────────────────────────────────────────
  const createUld = (uldCode: string) => {
    const uldData = findULDType(uldCode);
    const newUld: ULDUnit = {
      id: `ULD-${Date.now()}`,
      uld_code: uldCode,
      uld_name: uldData?.common_names[0] || uldCode,
      cargoItems: [],
      deck: uldData?.compatible_deck[0] || 'main',
    };
    setUlds(prev => [...prev, newUld]);
    setSelectedUldId(newUld.id);
  };

  // ─── AI 一键排舱 ───────────────────────────────────────────────────
  const handleAIPack = () => {
    const unplaced = cargoList.filter(c => !ulds.some(u => u.cargoItems.some(item => item.id === c.id)));
    if (unplaced.length === 0) { message.warning('所有货物已完成装载'); return; }

    // 贪心算法：按利润降序排列
    const sorted = [...unplaced].sort((a, b) => (b.chargeableWeight_kg * b.fee_per_kg) - (a.chargeableWeight_kg * a.fee_per_kg));

    // 预建 ULD
    const newUlds: ULDUnit[] = [];
    const mainPositions = getMainDeckPositions();
    const lowerPositions = [...getLowerFwdPositions(), ...getLowerAftPositions()];

    // 活体 → 下舱；普通/轻货 → 主舱
    const liveAnimals = sorted.filter(c => c.category === 'live_animal');
    const perishables = sorted.filter(c => c.category === 'perishable');
    const dgrs = sorted.filter(c => c.category === 'dgr');
    const normal = sorted.filter(c => c.category === 'normal');

    let uldIdCounter = 1;

    const assignToUld = (cargo: CargoItem, deck: 'main' | 'lower') => {
      const uldCode = deck === 'main' ? 'LD-6' : 'LD-3';
      const uldData = findULDType(uldCode);
      const existing = newUlds.find(u => u.deck === deck && u.cargoItems.reduce((s, c) => s + c.weight_kg, 0) + cargo.chargeableWeight_kg <= (uldData?.max_load_kg || 3000) && u.cargoItems.length < 8);
      if (existing) {
        existing.cargoItems.push(cargo);
      } else {
        newUlds.push({
          id: `ULD-AI-${uldIdCounter++}`,
          uld_code: uldCode,
          uld_name: uldData?.common_names[0] || uldCode,
          cargoItems: [cargo],
          deck,
        });
      }
    };

    // 活体 → 下舱
    liveAnimals.forEach(c => assignToUld(c, 'lower'));
    // 生鲜 → 下舱
    perishables.forEach(c => assignToUld(c, 'lower'));
    // 危险品 → 主舱后部（偏后平衡重心）
    dgrs.forEach(c => assignToUld(c, 'main'));
    // 普通货 → 主舱前中
    normal.forEach(c => assignToUld(c, 'main'));

    // 自动分配舱位
    const positions = [...mainPositions, ...lowerPositions];
    newUlds.forEach((uld, i) => {
      uld.position = positions[i]?.code;
    });

    setPendingPlan(newUlds);
    setConfirmVisible(true);
  };

  const confirmPlan = () => {
    if (!pendingPlan) return;
    setUlds(prev => {
      const existing = prev.filter(u => !pendingPlan!.some(p => p.id === u.id));
      return [...existing, ...pendingPlan];
    });
    setConfirmVisible(false);
    setPendingPlan(null);
    message.success('AI排舱方案已生效，请确认装载');
  };

  const rejectPlan = () => { setConfirmVisible(false); setPendingPlan(null); message.info('排舱方案已取消'); };

  // ─── 拖放 ───────────────────────────────────────────────────────────
  const handleCargoDragStart = (e: React.DragEvent, cargoId: string) => {
    e.dataTransfer.setData('cargoId', cargoId);
  };

  const handleUldDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };
  const handleUldDrop = (e: React.DragEvent, uldId: string) => {
    e.preventDefault();
    const cargoId = e.dataTransfer.getData('cargoId');
    if (cargoId) addCargoToUld(uldId, cargoId);
  };

  // 货物拖入舱位
  const handlePosDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handlePosDrop = (e: React.DragEvent, posCode: string) => {
    e.preventDefault();
    const uldId = e.dataTransfer.getData('uldId');
    if (uldId) {
      setUlds(prev => prev.map(u => u.id === uldId ? { ...u, position: posCode } : u));
    }
  };

  // 货物列表面板
  const cargoColumns = [
    { title: 'AWB', dataIndex: 'awb', width: 130, render: (t: string) => <Text style={{ fontSize: 11, fontFamily: 'monospace' }}>{t}</Text> },
    { title: '货物', dataIndex: 'description', width: 90, render: (t: string) => <Text style={{ fontSize: 11 }}>{t}</Text> },
    { title: '重量', dataIndex: 'weight_kg', width: 55, render: (v: number) => <Text style={{ fontSize: 11 }}>{v}kg</Text> },
    { title: '体积', render: (_: any, r: CargoItem) => <Text style={{ fontSize: 10, color: '#64748B' }}>{r.volume_m3}m³</Text> },
    {
      title: '类型', dataIndex: 'category', width: 70,
      render: (cat: CargoCategory, r: CargoItem) => {
        if (cat === 'dgr') return <Tag color="red" style={{ fontSize: 9, padding: '0 2px' }}>DGR {r.dgr_class}</Tag>;
        if (cat === 'live_animal') return <Tag color="green" style={{ fontSize: 9, padding: '0 2px' }}>活体</Tag>;
        if (cat === 'perishable') return <Tag color="orange" style={{ fontSize: 9, padding: '0 2px' }}>生鲜{r.temperature === 'chill' ? '冷藏' : ''}</Tag>;
        return <Tag style={{ fontSize: 9, padding: '0 2px' }}>普通</Tag>;
      }
    },
    {
      title: '操作', width: 50,
      render: (_: any, r: CargoItem) => {
        const isInUld = ulds.some(u => u.cargoItems.some(c => c.id === r.id));
        if (isInUld) {
          const u = ulds.find(u => u.cargoItems.some(c => c.id === r.id));
          return <Tag color="blue" style={{ fontSize: 9 }}>{u?.uld_code}·{u?.position || '未分配'}</Tag>;
        }
        return (
          <Button size="small" type="link" style={{ fontSize: 10, padding: 0 }} draggable onDragStart={(e) => handleCargoDragStart(e as any, r.id)}>
            拖拽 →
          </Button>
        );
      }
    },
  ];

  const selectedUld = ulds.find(u => u.id === selectedUldId);
  const totalRevenue = ulds.flatMap(u => u.cargoItems).reduce((s, c) => s + c.chargeableWeight_kg * c.fee_per_kg, 0);
  const totalWeight = ulds.flatMap(u => u.cargoItems).reduce((s, c) => s + c.weight_kg, 0);
  const totalVolume = ulds.flatMap(u => u.cargoItems).reduce((s, c) => s + c.volume_m3, 0);

  // 冲突警告
  const allConflicts = ulds.flatMap(u =>
    u.cargoItems.flatMap(c1 =>
      u.cargoItems
        .filter(c2 => c2.id !== c1.id)
        .map(c2 => {
          if (c1.category !== 'dgr' && c2.category !== 'dgr') return null;
          const r = checkULDCompatibility(c1.dgr_class || '', c2.dgr_class || '');
          return r.allowed ? null : { uld: u.uld_code, c1: c1.description, c2: c2.description, msg: r.message };
        })
    ).filter(Boolean)
  );

  return (
    <div style={{ padding: 12 }}>
      {/* 顶部工具栏 */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', background: '#fff', padding: '8px 12px', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <Space size={8}>
          <Title level={5} style={{ margin: 0, color: '#1F4E79', fontSize: 15 }}>🛩️ CBA v5.1 智能排舱系统</Title>
        </Space>
        <Space size={8}>
          <Select
            placeholder="添加ULD板型" size="small" style={{ width: 140 }}
            onChange={v => createUld(v)}
            options={[
              { value: 'LD-7', label: 'LD-7 · Q7/RAP · 主舱' },
              { value: 'LD-6', label: 'LD-6 · Q6/AKE · 主舱' },
              { value: 'LD-3', label: 'LD-3 · AKE · 下舱' },
              { value: 'LD-2', label: 'LD-2 · AAU · 下舱' },
            ]}
          />
        </Space>
        <Button size="small" type="primary" icon={<ThunderboltOutlined />} onClick={handleAIPack}>
          AI一键排舱
        </Button>
        <Button size="small" icon={<ReloadOutlined />} onClick={() => { setUlds([]); setSelectedCargo(new Set()); setConflictWarnings([]); message.info('已重置'); }}>
          重置
        </Button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <Statistic title="已装货物" value={ulds.flatMap(u => u.cargoItems).length} size="small" />
          <Statistic title="总重量" value={totalWeight} suffix="kg" size="small" />
          <Statistic title="总收入" value={totalRevenue} prefix="¥" size="small" />
        </div>
      </div>

      {/* 冲突警告 */}
      {allConflicts.length > 0 && (
        <Alert
          type="error"
          icon={<ExclamationCircleOutlined />}
          message="危险品隔离冲突"
          description={allConflicts.map((c: any) => `ULD ${c.uld}: ${c.c1} ↔ ${c.c2}: ${c.msg}`).join('；')}
          style={{ marginBottom: 8 }}
          closable onClose={() => setConflictWarnings([])}
        />
      )}

      {/* 三列布局 */}
      <Row gutter={8}>
        {/* ── 左：货物列表 ── */}
        <Col xs={24} md={8} lg={7}>
          <Card
            size="small"
            title={<span style={{ fontSize: 13, fontWeight: 700, color: '#1F4E79' }}>📦 货物列表 <Badge count={cargoList.length} style={{ fontSize: 10 }} /></span>}
            extra={<span style={{ fontSize: 10, color: '#64748B' }}>拖拽货物到中间ULD</span>}
            styles={{ body: { padding: 8 } }}
          >
            <Table
              size="small" pagination={{ pageSize: 8 }}
              dataSource={cargoList} rowKey="id"
              columns={cargoColumns}
              rowClassName={(r) => ulds.some(u => u.cargoItems.some(c => c.id === r.id)) ? 'placed-row' : 'unplaced-row'}
              scroll={{ y: 400 }}
            />
          </Card>
        </Col>

        {/* ── 中：ULD 组板 ── */}
        <Col xs={24} md={9} lg={9}>
          <Card
            size="small"
            title={<span style={{ fontSize: 13, fontWeight: 700, color: '#1F4E79' }}>📋 ULD 组板工作台</span>}
            extra={<Text style={{ fontSize: 11, color: '#64748B' }}>拖拽货物 或 直接AI排舱</Text>}
            styles={{ body: { padding: 8 } }}
          >
            {ulds.length === 0 ? (
              <Empty description="暂无ULD，请选择上方板型或使用AI排舱" image={Empty.PRESENTED_SIMPLE} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {ulds.map(uld => (
                  <div
                    key={uld.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData('uldId', uld.id); }}
                    onDragOver={handleUldDragOver}
                    onDrop={(e) => handleUldDrop(e, uld.id)}
                    onClick={() => setSelectedUldId(selectedUldId === uld.id ? null : uld.id)}
                    style={{
                      border: `2px solid ${selectedUldId === uld.id ? '#2563EB' : uld.position ? '#16A34A' : '#E2E8F0'}`,
                      borderRadius: 8, padding: 8, cursor: 'pointer',
                      background: selectedUldId === uld.id ? '#EFF6FF' : '#fff',
                      transition: 'all 0.15s',
                    }}
                  >
                    {/* ULD 头 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Space size={4}>
                        <Tag color={uld.deck === 'main' ? 'blue' : 'green'} style={{ margin: 0, fontSize: 10 }}>{uld.uld_code}</Tag>
                        <Text style={{ fontSize: 10, color: '#64748B' }}>{uld.uld_name}</Text>
                      </Space>
                      <Space size={2}>
                        {uld.position && <Tag color="cyan" style={{ fontSize: 9 }}>{uld.position}</Tag>}
                        <Button size="small" type="text" icon={<DeleteOutlined />} onClick={() => setUlds(prev => prev.filter(u => u.id !== uld.id))} style={{ fontSize: 10, color: '#EF4444', padding: 0, width: 16, height: 16 }} />
                      </Space>
                    </div>

                    {/* 3D 可视化 */}
                    <ULD3DView uld={uld} onRemove={(cid) => removeCargoFromUld(uld.id, cid)} />

                    {/* 货物列表 */}
                    {uld.cargoItems.length === 0 && (
                      <div style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center', padding: 4 }}>拖入货物</div>
                    )}
                    {uld.cargoItems.map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1px 0', borderBottom: '1px solid #F1F5F9', fontSize: 10 }}>
                        <Text style={{ fontSize: 10, color: c.category === 'dgr' ? '#DC2626' : c.category === 'live_animal' ? '#16A34A' : '#374151' }}>
                          {c.description.slice(0, 8)} <span style={{ color: '#94A3B8' }}>{c.weight_kg}kg</span>
                        </Text>
                        <Button size="small" type="text" icon={<DeleteOutlined />} onClick={() => removeCargoFromUld(uld.id, c.id)} style={{ fontSize: 9, color: '#94A3B8', padding: 0, width: 14, height: 14 }} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        {/* ── 右：飞机货舱布局 ── */}
        <Col xs={24} md={7} lg={8}>
          <AircraftHoldPanel ulds={ulds} onUldDrop={(posCode) => {
            // 将选中的ULD分配到舱位
            if (selectedUldId) {
              setUlds(prev => prev.map(u => u.id === selectedUldId ? { ...u, position: posCode } : u));
            }
          }} onUldRemove={(posCode) => {
            setUlds(prev => prev.map(u => u.position === posCode ? { ...u, position: undefined } : u));
          }} />
        </Col>
      </Row>

      {/* ─── AI 排舱确认弹窗 ─── */}
      <Modal
        title={<Space><CheckCircleOutlined style={{ color: '#16A34A' }} /><Text style={{ color: '#16A34A', fontWeight: 700 }}>AI 排舱方案已生成</Text></Space>}
        open={confirmVisible}
        onCancel={rejectPlan}
        width={600}
        footer={[
          <Button key="cancel" onClick={rejectPlan}>取消返回</Button>,
          <Button key="confirm" type="primary" icon={<CheckCircleOutlined />} onClick={confirmPlan} style={{ background: '#16A34A', borderColor: '#16A34A' }}>
            确认装载方案 ✓
          </Button>,
        ]}
      >
        {pendingPlan && (
          <div>
            {/* 方案汇总 */}
            <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
              <Col span={12}><Statistic title="装载ULD" value={pendingPlan.length} suffix="个" /></Col>
              <Col span={12}><Statistic title="总货物" value={pendingPlan.flatMap(u => u.cargoItems).length} suffix="件" /></Col>
              <Col span={12}><Statistic title="总重量" value={(pendingPlan.flatMap(u => u.cargoItems).reduce((s, c) => s + c.weight_kg, 0) / 1000).toFixed(1)} suffix="t" /></Col>
              <Col span={12}><Statistic title="总体积" value={pendingPlan.flatMap(u => u.cargoItems).reduce((s, c) => s + c.volume_m3, 0).toFixed(1)} suffix="m³" /></Col>
              <Col span={12}><Statistic title="预计收益" value={pendingPlan.flatMap(u => u.cargoItems).reduce((s, c) => s + c.chargeableWeight_kg * c.fee_per_kg, 0)} prefix="¥" /></Col>
              <Col span={12}><Statistic title="平均费率" value={(pendingPlan.flatMap(u => u.cargoItems).reduce((s, c) => s + c.fee_per_kg, 0) / Math.max(1, pendingPlan.flatMap(u => u.cargoItems).length)).toFixed(2)} suffix="元/kg" /></Col>
            </Row>

            {/* ULD 详情 */}
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {pendingPlan.map(uld => {
                const cg = calculateCG([{ weight_kg: uld.cargoItems.reduce((s, c) => s + c.weight_kg, 0), position_code: uld.position || '' }]);
                return (
                  <Card key={uld.id} size="small" style={{ marginBottom: 6 }} styles={{ body: { padding: 8 } }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Space>
                        <Tag color="blue">{uld.uld_code}</Tag>
                        <Text style={{ fontSize: 11 }}>{uld.uld_name}</Text>
                        {uld.position && <Tag color="cyan">{uld.position}</Tag>}
                      </Space>
                      <Space size={12}>
                        <Text style={{ fontSize: 10, color: '#64748B' }}>{uld.cargoItems.reduce((s, c) => s + c.weight_kg, 0)}kg</Text>
                        <Text style={{ fontSize: 10, color: '#64748B' }}>{uld.cargoItems.reduce((s, c) => s + c.volume_m3, 0).toFixed(2)}m³</Text>
                        <Text style={{ fontSize: 10, color: cg.status === 'ok' ? '#16A34A' : '#DC2626' }}>
                          CG {cg.cg_mac_pct}%
                        </Text>
                      </Space>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      {uld.cargoItems.map(c => (
                        <Tag key={c.id} color={c.category === 'dgr' ? 'red' : c.category === 'live_animal' ? 'green' : 'default'} style={{ fontSize: 9 }}>
                          {c.description.slice(0, 10)} {c.weight_kg}kg
                        </Tag>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* 风险提示 */}
            {allConflicts.length > 0 && (
              <Alert
                type="warning"
                icon={<WarningOutlined />}
                message="DGR 隔离冲突"
                description={allConflicts.slice(0, 3).map((c: any) => `${c.c1} ↔ ${c.c2}`).join('；')}
                style={{ marginTop: 8 }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
