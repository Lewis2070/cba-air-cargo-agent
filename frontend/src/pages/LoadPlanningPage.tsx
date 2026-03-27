// LoadPlanningPage.tsx - 智能排舱页面 v5.0
// B767-300BCF 专业版：货舱布局图 + 六线包线图 + ULD 3D可视化
import React, { useState, useMemo, useCallback } from 'react';
import { Card, Button, Select, Tag, Modal, Row, Col, Progress, Tooltip, message, Space, Divider, Table, Badge, Alert, Empty } from 'antd';
import { ThunderboltOutlined, ReloadOutlined, ExpandOutlined, CompressOutlined, SwapOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { B767_300BCF, getPositionsByDeck } from '../data/b767_bcf_config';
import { ULD_TYPES, recommendULD, calcVolumeWeight, calcChargeableWeight } from '../data/uld_specs';
import HoldLayout767BCF from '../components/HoldLayout767BCF';
import WeightBalanceEnvelope from '../components/WeightBalanceEnvelope';
import ULDContainer3D from '../components/ULDContainer3D';

// ─── Types ────────────────────────────────────────────────────────────────
interface CargoItem {
  key: string;
  awb: string;
  description: string;
  weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  volume_m3: number;
  chargeableWeight: number;
  is_dgr: boolean;
  un_number?: string;
  category?: string;
  placed?: boolean;
  placedPosition?: string;
  placedUldType?: string;
}

interface PlacedULD {
  position: string;
  uld_type: string;
  uld_id: string;
  cargoItems: CargoItem[];
  totalWeight: number;
  totalVolume: number;
  deck: string;
}

// ─── Mock航班数据 ─────────────────────────────────────────────────────────
const DEFAULT_FLIGHT = {
  id: 'FL001',
  flight_number: 'CA1001',
  flight_date: '2026-03-27',
  departure_airport: 'PVG',
  arrival_airport: 'LAX',
  aircraft_type: 'B767-300BCF',
  capacity_weight: 52000,
  booked_weight: 28400,
  booked_volume: 38.5,
  fuel_kg: 48000,
  status: 'scheduled',
};

// ─── Mock货物数据 ─────────────────────────────────────────────────────────
function genMockCargo(): CargoItem[] {
  return [
    { key: '1', awb: '999-12345678', description: '电子元器件', weight_kg: 320, length_cm: 80, width_cm: 60, height_cm: 40, volume_m3: 0.192, chargeableWeight: 320, is_dgr: false, category: 'normal' },
    { key: '2', awb: '999-12345679', description: '锂电池设备', weight_kg: 150, length_cm: 50, width_cm: 40, height_cm: 30, volume_m3: 0.060, chargeableWeight: 150, is_dgr: true, un_number: 'UN3481', category: 'dgr' },
    { key: '3', awb: '999-12345680', description: '纺织品服装', weight_kg: 450, length_cm: 100, width_cm: 80, height_cm: 60, volume_m3: 0.480, chargeableWeight: 800, is_dgr: false, category: 'normal' },
    { key: '4', awb: '999-12345681', description: '医疗器械', weight_kg: 200, length_cm: 60, width_cm: 50, height_cm: 40, volume_m3: 0.120, chargeableWeight: 200, is_dgr: false, category: 'normal' },
    { key: '5', awb: '999-12345682', description: '冷链疫苗制剂', weight_kg: 180, length_cm: 55, width_cm: 45, height_cm: 35, volume_m3: 0.087, chargeableWeight: 180, is_dgr: false, category: 'cold_chain' },
    { key: '6', awb: '999-12345683', description: '精密仪器', weight_kg: 280, length_cm: 70, width_cm: 55, height_cm: 45, volume_m3: 0.173, chargeableWeight: 280, is_dgr: false, category: 'valuable' },
    { key: '7', awb: '999-12345684', description: '锂电池组件', weight_kg: 95, length_cm: 40, width_cm: 35, height_cm: 25, volume_m3: 0.035, chargeableWeight: 95, is_dgr: true, un_number: 'UN3481', category: 'dgr' },
    { key: '8', awb: '999-12345685', description: '食品添加剂', weight_kg: 520, length_cm: 110, width_cm: 90, height_cm: 70, volume_m3: 0.693, chargeableWeight: 1155, is_dgr: false, category: 'normal' },
  ].map(c => ({ ...c, chargeableWeight: calcChargeableWeight(c.weight_kg, c.length_cm, c.width_cm, c.height_cm) }));
}

// ─── AI一键排舱算法 ────────────────────────────────────────────────────────
function aiAutoPack(cargoItems: CargoItem[], uldType: string): PlacedULD[] {
  const uld = ULD_TYPES.find(u => u.code === uldType);
  if (!uld) return [];

  const placed: PlacedULD[] = [];
  const unplaced = cargo.filter(c => !c.placed);

  // 按重量降序排列货物
  const sorted = [...unplaced].sort((a, b) => b.chargeableWeight - a.chargeableWeight);
  const deck = uld.compatibleDecks.includes('main') ? 'main' : 'lower';
  const positions = getPositionsByDeck(deck as any);

  let currentUld: PlacedULD | null = null;
  let posIdx = 0;

  for (const item of sorted) {
    if (!currentUld || (currentUld.totalWeight + item.chargeableWeight > uld.maxLoad) || (currentUld.totalVolume + item.volume_m3 > uld.volume * 0.95)) {
      if (currentUld && posIdx < positions.length) {
        placed.push(currentUld);
      }
      if (posIdx >= positions.length) break;
      const pos = positions[posIdx++];
      currentUld = {
        position: pos.code,
        uld_type: uldType,
        uld_id: `${uldType}-${pos.code}-${Date.now().toString().slice(-4)}`,
        cargoItems: [],
        totalWeight: 0,
        totalVolume: 0,
        deck: pos.deck,
      };
    }
    currentUld!.cargoItems.push({ ...item, placed: true, placedPosition: currentUld!.position, placedUldType: uldType });
    currentUld!.totalWeight += item.chargeableWeight;
    currentUld!.totalVolume += item.volume_m3;
  }

  if (currentUld) placed.push(currentUld);
  return placed;
}

// ─── 主组件 ───────────────────────────────────────────────────────────────
export default function LoadPlanningPage() {
  const [cargoList, setCargoList] = useState<CargoItem[]>(genMockCargo);
  const [placedULDs, setPlacedULDs] = useState<PlacedULD[]>([]);
  const [selectedULDType, setSelectedULDType] = useState('LD-3');
  const [selectedPos, setSelectedPos] = useState<string | null>(null);
  const [selectedUld, setSelectedUld] = useState<PlacedULD | null>(null);
  const [fullScreen, setFullScreen] = useState(false);
  const [uldModalVisible, setUldModalVisible] = useState(false);
  const [flight] = useState(DEFAULT_FLIGHT);

  // 计算全机载重
  const totalPlacedWeight = placedULDs.reduce((s, u) => s + u.totalWeight, 0);
  const totalPlacedVolume = placedULDs.reduce((s, u) => s + u.totalVolume, 0);
  const totalWeight = DEFAULT_FLIGHT.fuel_kg + DEFAULT_FLIGHT.booked_weight + totalPlacedWeight;

  // 计算重心（简化：按重量加权平均）
  const allPositions = getPositionsByDeck('main').concat(getPositionsByDeck('lower'));
  const cgPct = useMemo(() => {
    if (placedULDs.length === 0) return 25.0;
    let totalMoment = 0, totalW = 0;
    placedULDs.forEach(u => {
      const pos = allPositions.find(p => p.code === u.position);
      if (pos) { totalMoment += pos.arm_m * u.totalWeight; totalW += u.totalWeight; }
    });
    return totalW > 0 ? (totalMoment / totalW - 15.0) / 18.0 * 100 : 25.0;
  }, [placedULDs]);

  // 选中舱位 → 选中ULD
  const handlePosClick = useCallback((code: string) => {
    setSelectedPos(code);
    const found = placedULDs.find(u => u.position === code);
    if (found) {
      setSelectedUld(found);
      setUldModalVisible(true);
    }
  }, [placedULDs]);

  // 手动打板
  const handleManualPack = (item: CargoItem) => {
    if (!selectedPos) { message.warning('请先在舱位图上选择一个空闲仓位'); return; }
    const uld = ULD_TYPES.find(u => u.code === selectedULDType);
    const deck = uld?.compatibleDecks.includes('main') ? 'main' : 'lower';
    const newUld: PlacedULD = {
      position: selectedPos,
      uld_type: selectedULDType,
      uld_id: `${selectedULDType}-${selectedPos}-${Date.now().toString().slice(-4)}`,
      cargoItems: [{ ...item, placed: true, placedPosition: selectedPos, placedUldType: selectedULDType }],
      totalWeight: item.chargeableWeight,
      totalVolume: item.volume_m3,
      deck,
    };
    setPlacedULDs(prev => [...prev.filter(u => u.position !== selectedPos), newUld]);
    setCargoList(prev => prev.map(c => c.key === item.key ? { ...c, placed: true, placedPosition: selectedPos, placedUldType: selectedULDType } : c));
    message.success(`已装入 ${selectedPos} - ${item.awb}`);
  };

  // 移除货物
  const handleRemoveCargo = (uld: PlacedULD, item: CargoItem) => {
    const updatedItems = uld.cargoItems.filter(i => i.key !== item.key);
    if (updatedItems.length === 0) {
      setPlacedULDs(prev => prev.filter(u => u.position !== uld.position));
      setCargoList(prev => prev.map(c => c.key === item.key ? { ...c, placed: false, placedPosition: undefined, placedUldType: undefined } : c));
    } else {
      setPlacedULDs(prev => prev.map(u => u.position === uld.position ? { ...u, cargoItems: updatedItems, totalWeight: updatedItems.reduce((s, i) => s + i.chargeableWeight, 0), totalVolume: updatedItems.reduce((s, i) => s + i.volume_m3, 0) } : u));
      setCargoList(prev => prev.map(c => c.key === item.key ? { ...c, placed: false } : c));
    }
    setUldModalVisible(false);
  };

  // AI一键排舱
  const handleAIPack = () => {
    const unplaced = cargoList.filter(c => !c.placed);
    if (unplaced.length === 0) { message.info('所有货物已装载'); return; }
    const result = aiAutoPack(unplaced, selectedULDType);
    const newPlaced = result.filter(r => r.cargoItems.length > 0);
    setPlacedULDs(prev => {
      const remaining = prev.filter(u => !newPlaced.some(n => n.position === u.position));
      return [...remaining, ...newPlaced];
    });
    const placedKeys = newPlaced.flatMap(u => u.cargoItems.map(c => c.key));
    setCargoList(prev => prev.map(c => {
      if (placedKeys.includes(c.key)) {
        const ulo = newPlaced.find(u => u.cargoItems.some(i => i.key === c.key));
        return { ...c, placed: true, placedPosition: ulo?.position, placedUldType: ulo?.uld_type };
      }
      return c;
    }));
    message.success({ content: `AI排舱完成：${newPlaced.length}个ULD，装载${unplaced.length}件货物`, duration: 3 });
  };

  // 重置
  const handleReset = () => {
    setPlacedULDs([]);
    setCargoList(genMockCargo());
    setSelectedPos(null);
    setSelectedUld(null);
    message.info('已重置');
  };

  const unplacedCargo = cargoList.filter(c => !c.placed);
  const placedCargo = cargoList.filter(c => c.placed);

  const CARD_GUTTER = 8;
  const mainDeckPositions = getPositionsByDeck('main').length;
  const lowerDeckPositions = getPositionsByDeck('lower').length;

  return (
    <div style={{ padding: fullScreen ? 0 : 12, minHeight: 'calc(100vh - 64px)', background: fullScreen ? '#0f172a' : 'transparent', transition: 'all 0.3s' }}>
      {/* 工具栏 */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', background: fullScreen ? '#1e293b' : '#fff', padding: '8px 12px', borderRadius: fullScreen ? 0 : 8 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1F4E79' }}>✈️ {flight.flight_number}</span>
          <Tag color="blue">{flight.aircraft_type}</Tag>
          <Tag color="green">{flight.departure_airport} → {flight.arrival_airport}</Tag>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#64748B' }}>ULD板型：</span>
          <Select value={selectedULDType} onChange={setSelectedULDType} size="small" style={{ width: 120 }}
            options={ULD_TYPES.filter(u => u.type !== 'bulk').map(u => ({ value: u.code, label: `${u.code} (${u.name}) ${u.volume}m³` }))}
          />
        </div>
        <Button size="small" type="primary" icon={<ThunderboltOutlined />} onClick={handleAIPack} disabled={unplacedCargo.length === 0}>
          AI一键排舱
        </Button>
        <Button size="small" icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
        <Button size="small" icon={fullScreen ? <CompressOutlined /> : <ExpandOutlined />} onClick={() => setFullScreen(!fullScreen)}>
          {fullScreen ? '退出全屏' : '全屏'}
        </Button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, fontSize: 11, color: '#64748B' }}>
          <span>已装：<b style={{ color: '#059669' }}>{placedCargo.length}</b> 件</span>
          <span>待装：<b style={{ color: '#F59E0B' }}>{unplacedCargo.length}</b> 件</span>
          <span>总重：<b>{(totalPlacedWeight/1000).toFixed(1)}t</b></span>
          <span>总体积：<b>{totalPlacedVolume.toFixed(1)}m³</b></span>
        </div>
      </div>

      {/* 三区布局 */}
      <Row gutter={CARD_GUTTER}>
        {/* 左区：货舱布局图 */}
        <Col xs={24} md={10} lg={9}>
          <Card
            size="small" title={<span style={{ fontSize: 13, fontWeight: 700, color: '#1F4E79' }}>🛩️ 货舱布局 — B767-300BCF</span>}
            extra={<Space size={4}><span style={{ fontSize: 10, color: '#94A3B8' }}>主舱{mainDeckPositions}位 · 下舱{lowerDeckPositions}位</span></Space>}
            style={{ borderRadius: 8 }}
            styles={{ body: { padding: 10 } }}
          >
            <HoldLayout767BCF
              placedULDs={placedULDs}
              onPositionClick={handlePosClick}
              selectedPos={selectedPos || undefined}
              showDeck="main"
            />
          </Card>
        </Col>

        {/* 中区：ULD打板操作 */}
        <Col xs={24} md={14} lg={15}>
          <Card
            size="small" title={<span style={{ fontSize: 13, fontWeight: 700, color: '#1F4E79' }}>📋 货物列表 — 拖入舱位打板</span>}
            extra={<span style={{ fontSize: 10, color: '#94A3B8' }}>共 {cargoList.length} 件货物 | 已选仓位：<b style={{ color: selectedPos ? '#1F4E79' : '#DC2626' }}>{selectedPos || '请先点击舱位图选择'}</b></span>}
            style={{ borderRadius: 8, marginBottom: CARD_GUTTER }}
            styles={{ body: { padding: 8, maxHeight: 320, overflowY: 'auto' } }}
          >
            <Table
              size="small" pagination={false} dataSource={cargoList} rowKey="key"
              rowClassName={(r) => r.placed ? 'placed-row' : 'unplaced-row'}
              columns={[
                { title: 'AWB', dataIndex: 'awb', width: 120, render: t => <span style={{ fontSize: 11 }}>{t}</span> },
                { title: '货物', dataIndex: 'description', width: 100, render: t => <span style={{ fontSize: 11 }}>{t}</span> },
                { title: '重量', dataIndex: 'weight_kg', width: 60, render: v => <span style={{ fontSize: 11 }}>{v}kg</span>, sorter: (a, b) => a.weight_kg - b.weight_kg },
                { title: '体积cm', render: (_, r) => <span style={{ fontSize: 10, color: '#64748B' }}>{r.length_cm}×{r.width_cm}×{r.height_cm}</span> },
                { title: '计费重', render: (_, r) => <span style={{ fontSize: 11, color: r.chargeableWeight > r.weight_kg ? '#DC2626' : '#059669' }}>{r.chargeableWeight.toFixed(0)}kg</span> },
                {
                  title: 'DGR', dataIndex: 'is_dgr', width: 50,
                  render: v => v ? <Tag color="red" style={{ fontSize: 9, margin: 0 }}>危险品</Tag> : <Tag style={{ fontSize: 9, margin: 0, color: '#64748B', borderColor: '#E2E8F0' }}>普通</Tag>,
                  filters: [{ text: '危险品', value: true }, { text: '普通', value: false }],
                  onFilter: (v, r) => r.is_dgr === v,
                },
                {
                  title: '状态', render: (_, r) => r.placed
                    ? <Tag color="green" style={{ fontSize: 9, margin: 0 }}>已装 {r.placedPosition}/{r.placedUldType}</Tag>
                    : <Button size="xs" type="link" style={{ fontSize: 10, padding: 0, height: 20 }} onClick={() => handleManualPack(r)} disabled={!selectedPos}>打板→</Button>,
                },
              ]}
            />
          </Card>

          {/* ULD 3D 可视化 */}
          {selectedUld ? (
            <Card
              size="small" title={<span style={{ fontSize: 13, fontWeight: 700, color: '#1F4E79' }}>📦 ULD内腔3D视图 — {selectedUld.uld_id}</span>}
              extra={<Button size="small" onClick={() => setUldModalVisible(false)}>关闭</Button>}
              style={{ borderRadius: 8 }}
              styles={{ body: { padding: 8 } }}
            >
              <ULDContainer3D uldType={selectedUld.uld_type} cargoItems={selectedUld.cargoItems} uldId={selectedUld.uld_id} />
            </Card>
          ) : (
            <Card size="small" style={{ borderRadius: 8, textAlign: 'center', padding: '24px 0', color: '#94A3B8', fontSize: 12 }}>
              👆 点击左侧舱位，查看ULD内部3D填充情况
            </Card>
          )}
        </Col>

        {/* 右区：包线图 */}
        <Col xs={24} lg={8}>
          <Card
            size="small" title={<span style={{ fontSize: 13, fontWeight: 700, color: '#1F4E79' }}>⚖️ 载重平衡包线图</span>}
            style={{ borderRadius: 8, marginBottom: CARD_GUTTER }}
            styles={{ body: { padding: 10 } }}
          >
            <WeightBalanceEnvelope
              totalWeight_kg={DEFAULT_FLIGHT.booked_weight + DEFAULT_FLIGHT.fuel_kg + totalPlacedWeight}
              fuel_kg={DEFAULT_FLIGHT.fuel_kg}
              cargoWeight_kg={DEFAULT_FLIGHT.booked_weight + totalPlacedWeight}
              currentCG_pct={Math.max(14, Math.min(43, cgPct))}
              phase="takeoff"
            />
          </Card>

          {/* 载重统计 */}
          <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 700, color: '#1F4E79' }}>📊 装载统计</span>} style={{ borderRadius: 8 }} styles={{ body: { padding: 10 } }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: '主舱已装', weight: placedULDs.filter(u => u.deck === 'main').reduce((s, u) => s + u.totalWeight, 0), max: mainDeckPositions * 3400, color: '#1E4E8A' },
                { label: '下舱已装', weight: placedULDs.filter(u => u.deck === 'lower').reduce((s, u) => s + u.totalWeight, 0), max: lowerDeckPositions * 1500, color: '#065F46' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                    <span style={{ color: '#64748B' }}>{item.label}</span>
                    <span style={{ color: item.color, fontWeight: 600 }}>{(item.weight/1000).toFixed(2)}t / {(item.max/1000).toFixed(0)}t</span>
                  </div>
                  <Progress percent={Math.min(100, item.weight/item.max*100)} size="small" strokeColor={item.color} />
                </div>
              ))}

              <Divider style={{ margin: '6px 0' }} />

              {placedULDs.map(u => (
                <div key={u.position} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>{u.position}</Tag>
                  <span style={{ fontSize: 10, color: '#64748B' }}>{u.uld_type} · {u.cargoItems.length}件</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#1F4E79' }}>{(u.totalWeight/1000).toFixed(2)}t</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
