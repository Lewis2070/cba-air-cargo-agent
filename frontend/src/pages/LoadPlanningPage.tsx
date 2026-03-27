// LoadPlanningPage.tsx - 智能排舱页面 v5.0 (简化稳定版)
// 问题修复：去掉可能导致崩溃的复杂 recharts 3D 组件，保留核心功能
import React, { useState, useMemo } from 'react';
import { Card, Button, Select, Tag, Row, Col, Progress, Space, Divider, Table, message, Alert } from 'antd';
import { ThunderboltOutlined, ReloadOutlined, SwapOutlined } from '@ant-design/icons';
import { B767_300BCF, getPositionsByDeck } from '../data/b767_bcf_config';
import { ULD_TYPES, recommendULD, calcChargeableWeight } from '../data/uld_specs';

interface CargoItem {
  key: string; awb: string; description: string;
  weight_kg: number; length_cm: number; width_cm: number; height_cm: number;
  volume_m3: number; chargeableWeight: number; is_dgr: boolean; placed?: boolean;
  placedPosition?: string; placedUldType?: string;
}

const DEFAULT_FLIGHT = {
  id: 'FL001', flight_number: 'CA1001', flight_date: '2026-03-27',
  departure_airport: 'PVG', arrival_airport: 'LAX', aircraft_type: 'B767-300BCF',
  capacity_weight: 52000, booked_weight: 28400,
};

const MOCK_CARGO: CargoItem[] = [
  { key: '1', awb: '999-12345678', description: '电子元器件', weight_kg: 450, length_cm: 100, width_cm: 80, height_cm: 60, volume_m3: 0.48, chargeableWeight: 450, is_dgr: false },
  { key: '2', awb: '999-12345679', description: '锂电池', weight_kg: 320, length_cm: 60, width_cm: 50, height_cm: 40, volume_m3: 0.12, chargeableWeight: 320, is_dgr: true },
  { key: '3', awb: '999-12345680', description: '纺织品', weight_kg: 680, length_cm: 120, width_cm: 100, height_cm: 80, volume_m3: 0.96, chargeableWeight: 680, is_dgr: false },
  { key: '4', awb: '999-12345681', description: '机械设备', weight_kg: 1200, length_cm: 150, width_cm: 120, height_cm: 100, volume_m3: 1.80, chargeableWeight: 1200, is_dgr: false },
  { key: '5', awb: '999-12345682', description: '医药用品', weight_kg: 280, length_cm: 80, width_cm: 60, height_cm: 50, volume_m3: 0.24, chargeableWeight: 280, is_dgr: false },
  { key: '6', awb: '999-12345683', description: '化工原料', weight_kg: 550, length_cm: 100, width_cm: 90, height_cm: 70, volume_m3: 0.63, chargeableWeight: 550, is_dgr: true },
  { key: '7', awb: '999-12345684', description: '汽车配件', weight_kg: 890, length_cm: 130, width_cm: 110, height_cm: 90, volume_m3: 1.29, chargeableWeight: 890, is_dgr: false },
  { key: '8', awb: '999-12345685', description: '食品', weight_kg: 360, length_cm: 90, width_cm: 70, height_cm: 55, volume_m3: 0.35, chargeableWeight: 360, is_dgr: false },
];

const statusMap: Record<string, { color: string; text: string }> = {
  main_fwd: { color: '#1E4E8A', text: '主舱前' },
  main_ctr: { color: '#2563EB', text: '主舱中' },
  main_aft: { color: '#3B82F6', text: '主舱后' },
  lower_fwd: { color: '#065F46', text: '下舱前' },
  lower_aft: { color: '#059669', text: '下舱后' },
  bulk: { color: '#92400E', text: '散货' },
};

export default function LoadPlanningPage() {
  const [cargoList, setCargoList] = useState<CargoItem[]>(MOCK_CARGO);
  const [selectedULDType, setSelectedULDType] = useState('LD-7');
  const [placedMap, setPlacedMap] = useState<Record<string, CargoItem[]>>({});

  const mainDeck = getPositionsByDeck('main');
  const lowerDeck = getPositionsByDeck('lower');

  const totalPlacedWeight = Object.values(placedMap).flat().reduce((s, c) => s + c.weight_kg, 0);
  const totalPlacedVolume = Object.values(placedMap).flat().reduce((s, c) => s + c.volume_m3, 0);

  const handleAIPack = () => {
    const unplaced = cargoList.filter(c => !c.placed);
    if (unplaced.length === 0) { message.warning('所有货物已完成装载'); return; }
    const positions = [...mainDeck.slice(0, 8), ...lowerDeck.slice(0, 4)];
    const newPlaced: Record<string, CargoItem[]> = {};
    unplaced.forEach((c, i) => {
      const pos = positions[i % positions.length].code;
      if (!newPlaced[pos]) newPlaced[pos] = [];
      newPlaced[pos].push({ ...c, placed: true, placedPosition: pos, placedUldType: selectedULDType });
    });
    const merged = { ...placedMap };
    Object.entries(newPlaced).forEach(([pos, items]) => {
      merged[pos] = [...(merged[pos] || []), ...items];
    });
    setPlacedMap(merged);
    setCargoList(prev => prev.map(c => ({ ...c, placed: !!newPlaced[mainDeck.find(p => p.code === Object.keys(newPlaced).find(pk => newPlaced[pk].some(i => i.key === c.key)))?.[0]?.code] })));
    message.success('AI排舱完成！');
  };

  const handleReset = () => { setCargoList(MOCK_CARGO); setPlacedMap({}); message.info('已重置'); };

  const handleManualPlace = (key: string) => {
    if (!selectedULDType) { message.warning('请先选择ULD类型'); return; }
    const cargo = cargoList.find(c => c.key === key);
    if (!cargo) return;
    const pos = mainDeck[0]?.code || 'A1';
    setPlacedMap(prev => ({ ...prev, [pos]: [...(prev[pos] || []), { ...cargo, placed: true, placedPosition: pos, placedUldType: selectedULDType }] }));
    setCargoList(prev => prev.map(c => c.key === key ? { ...c, placed: true, placedPosition: pos, placedUldType: selectedULDType } : c));
    message.success(`货物已装载至 ${pos}`);
  };

  const columns = [
    { title: 'AWB', dataIndex: 'awb', width: 130, render: (t: string) => <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{t}</span> },
    { title: '货物', dataIndex: 'description', width: 100 },
    { title: '重量', dataIndex: 'weight_kg', width: 70, render: (v: number) => <span style={{ fontSize: 11 }}>{v}kg</span> },
    { title: '体积m³', render: (_: any, r: CargoItem) => <span style={{ fontSize: 11 }}>{r.volume_m3}</span> },
    { title: '计费重', render: (_: any, r: CargoItem) => <span style={{ fontSize: 11, color: r.chargeableWeight > r.weight_kg ? '#DC2626' : '#059669' }}>{r.chargeableWeight}kg</span> },
    { title: 'DGR', dataIndex: 'is_dgr', width: 60, render: (v: boolean) => v ? <Tag color="red" style={{ fontSize: 9 }}>危险品</Tag> : null },
    {
      title: '状态', width: 100,
      render: (_: any, r: CargoItem) => r.placed
        ? <Tag color="green" style={{ fontSize: 9 }}>{r.placedPosition}/{r.placedUldType}</Tag>
        : <Button size="small" type="link" style={{ fontSize: 10, padding: 0 }} onClick={() => handleManualPlace(r.key)}>装载→</Button>,
    },
  ];

  const uldOptions = ULD_TYPES.filter(u => u.type !== 'bulk').map(u => ({
    value: u.code, label: `${u.code} (${u.name}) ${u.volume}m³`,
  }));

  return (
    <div style={{ padding: 12, minHeight: 'calc(100vh - 64px)', background: 'transparent' }}>
      {/* 工具栏 */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', background: '#fff', padding: '8px 12px', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <Space size={8} align="center">
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1F4E79' }}>✈️ {DEFAULT_FLIGHT.flight_number}</span>
          <Tag color="blue">{DEFAULT_FLIGHT.aircraft_type}</Tag>
          <Tag color="green">{DEFAULT_FLIGHT.departure_airport} → {DEFAULT_FLIGHT.arrival_airport}</Tag>
        </Space>
        <Space size={8}>
          <span style={{ fontSize: 12, color: '#64748B' }}>ULD：</span>
          <Select value={selectedULDType} onChange={setSelectedULDType} options={uldOptions} style={{ width: 160 }} size="small" />
        </Space>
        <Button size="small" type="primary" icon={<ThunderboltOutlined />} onClick={handleAIPack}>AI排舱</Button>
        <Button size="small" icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
        <Space size={16} style={{ marginLeft: 'auto', fontSize: 12 }}>
          <span>总货物：<b>{cargoList.length}</b> 件</span>
          <span>已装：<b style={{ color: '#059669' }}>{cargoList.filter(c => c.placed).length}</b></span>
          <span>待装：<b style={{ color: '#F59E0B' }}>{cargoList.filter(c => !c.placed).length}</b></span>
          <span>总重：<b>{((totalPlacedWeight) / 1000).toFixed(1)}t</b></span>
        </Space>
      </div>

      <Row gutter={8}>
        {/* 左侧：舱位布局 */}
        <Col xs={24} md={10} lg={9}>
          <Card
            size="small"
            title={<span style={{ fontSize: 13, fontWeight: 700, color: '#1F4E79' }}>🛩️ 货舱布局 — B767-300BCF</span>}
            extra={<span style={{ fontSize: 11, color: '#64748B' }}>主舱{mainDeck.length}位 · 下舱{lowerDeck.length}位</span>}
            styles={{ body: { padding: 12 } }}
          >
            <div style={{ fontSize: 11, marginBottom: 8, color: '#64748B' }}>
              {DEFAULT_FLIGHT.departure_airport} → {DEFAULT_FLIGHT.arrival_airport} | 最大装载 {DEFAULT_FLIGHT.capacity_weight}kg
            </div>
            {/* 主舱 */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#1F4E79', marginBottom: 4 }}>主舱 (Main Deck)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {mainDeck.map(pos => {
                  const items = placedMap[pos.code] || [];
                  const isOccupied = items.length > 0;
                  return (
                    <div key={pos.code} style={{
                      width: 52, height: 52, borderRadius: 6, padding: '3px 4px',
                      background: isOccupied ? '#1E4E8A' : '#E8F0FB',
                      border: '1.5px solid',
                      borderColor: isOccupied ? '#1E4E8A' : '#93C5FD',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }} onClick={() => handleManualPlace(cargoList.find(c => !c.placed)?.key || '')}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: isOccupied ? '#fff' : '#1F4E79' }}>{pos.code}</span>
                      {isOccupied && <span style={{ fontSize: 8, color: '#93C5FD' }}>{items.length}件</span>}
                      {!isOccupied && <span style={{ fontSize: 8, color: '#94A3B8' }}>空闲</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* 下舱 */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#059669', marginBottom: 4 }}>下舱 (Lower Deck)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {lowerDeck.map(pos => {
                  const items = placedMap[pos.code] || [];
                  const isOccupied = items.length > 0;
                  return (
                    <div key={pos.code} style={{
                      width: 52, height: 52, borderRadius: 6, padding: '3px 4px',
                      background: isOccupied ? '#065F46' : '#ECFDF5',
                      border: '1.5px solid',
                      borderColor: isOccupied ? '#065F46' : '#6EE7B7',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: isOccupied ? '#fff' : '#059669' }}>{pos.code}</span>
                      {isOccupied && <span style={{ fontSize: 8, color: '#6EE7B7' }}>{items.length}件</span>}
                      {!isOccupied && <span style={{ fontSize: 8, color: '#94A3B8' }}>空闲</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* 装载进度 */}
          <Card size="small" title={<span style={{ fontSize: 12, fontWeight: 700, color: '#1F4E79' }}>📊 装载统计</span>} style={{ marginTop: 8 }} styles={{ body: { padding: 10 } }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: '主舱', weight: mainDeck.reduce((s, p) => s + (placedMap[p.code] || []).reduce((ss, c) => ss + c.weight_kg, 0), 0), max: 32000, color: '#1E4E8A' },
                { label: '下舱', weight: lowerDeck.reduce((s, p) => s + (placedMap[p.code] || []).reduce((ss, c) => ss + c.weight_kg, 0), 0), max: 20000, color: '#059669' },
                { label: '总重', weight: totalPlacedWeight, max: DEFAULT_FLIGHT.capacity_weight, color: '#7C3AED' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                    <span style={{ color: '#64748B' }}>{item.label}</span>
                    <span style={{ color: item.color, fontWeight: 600 }}>{(item.weight / 1000).toFixed(1)}t / {(item.max / 1000).toFixed(0)}t</span>
                  </div>
                  <Progress percent={Math.min(100, item.weight / item.max * 100)} size="small" strokeColor={item.color} />
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* 右侧：货物列表 */}
        <Col xs={24} md={14} lg={15}>
          <Card
            size="small"
            title={<span style={{ fontSize: 13, fontWeight: 700, color: '#1F4E79' }}>📋 货物列表</span>}
            extra={<span style={{ fontSize: 11, color: '#64748B' }}>共 {cargoList.length} 件货物</span>}
            styles={{ body: { padding: 8 } }}
          >
            <Table size="small" pagination={{ pageSize: 8 }} dataSource={cargoList} rowKey="key" columns={columns} />
          </Card>

          {/* ULD 推荐 */}
          <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 700, color: '#1F4E79' }}>💡 ULD 推荐</span>} style={{ marginTop: 8 }} styles={{ body: { padding: 10 } }}>
            <Space wrap size={8}>
              {ULD_TYPES.filter(u => u.type !== 'bulk').slice(0, 4).map(u => (
                <Tag key={u.code} color="blue" style={{ fontSize: 11, padding: '2px 8px' }}>
                  {u.code} · {u.name} · {u.volume}m³ · {u.maxLoad}kg
                </Tag>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
