// CBA v5.2 — Plan Confirmation Modal
import React from 'react';
import { Modal, Card, Tag, Space, Divider, Typography, Row, Col, Alert, Badge } from 'antd';
import { CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import type { PlanResult, UI } from './CargoTypes';

interface Props {
  open: boolean;
  plan: PlanResult | null;
  mode: 'manual' | 'ai';
  onConfirm: () => void;
  onCancel: () => void;
}

const CC: Record<string, string> = {
  normal: '#3B82F6',
  dgr: '#EF4444',
  live_animal: '#16A34A',
  perishable: '#F59E0B',
};

export default function ConfirmModal({ open, plan, mode, onConfirm, onCancel }: Props) {
  if (!plan) return null;

  const cgOk = plan.cg_status === 'ok';
  const ulds_placed = plan.ulds.filter(u => u.position);

  return (
    <Modal
      open={open}
      title={
        <Space>
          <CheckCircleOutlined style={{ color: '#16A34A' }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1F4E79' }}>
            {mode === 'ai' ? '🤖 AI排舱方案确认' : '📋 排舱方案确认'}
          </span>
        </Space>
      }
      width={680}
      onCancel={onCancel}
      footer={[
        <button
          key="cancel"
          onClick={onCancel}
          style={{
            padding: '6px 20px', border: '1px solid #E2E8F0', borderRadius: 6,
            background: '#fff', color: '#64748B', cursor: 'pointer', fontSize: 13,
          }}
        >
          取消，返回修改
        </button>,
        <button
          key="confirm"
          onClick={onConfirm}
          style={{
            padding: '6px 24px', border: 'none', borderRadius: 6,
            background: '#16A34A', color: '#fff', cursor: 'pointer', fontSize: 13,
            fontWeight: 600,
          }}
        >
          ✓ 确认提交
        </button>,
      ]}
    >
      {/* Objective */}
      <Card size="small" style={{ marginBottom: 12, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
        <Typography.Text style={{ fontSize: 12, color: '#1E4E8A', fontWeight: 600 }}>
          📌 排舱目标：单机计费重最大化（利润优先），满足载重平衡限制
        </Typography.Text>
      </Card>

      {/* Summary stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        {[
          { label: '总票数', value: `${plan.totalTickets}票`, color: '#1F4E79' },
          { label: '总重量', value: `${plan.totalWeight.toLocaleString()} kg`, color: '#374151' },
          { label: '容积利用率', value: `${plan.totalVolume > 0 ? ((plan.totalVolume / (plan.ulds.reduce((s,u) => s + u.volume_m3, 0) || 1)) * 100).toFixed(1) : 0}%`, color: '#7C3AED' },
          { label: '预计收益', value: `¥ ${plan.totalRevenue.toLocaleString()}`, color: '#16A34A' },
          { label: 'ULD板数', value: `${plan.ulds.length} 块`, color: '#374151' },
          { label: '已分配舱位', value: `${ulds_placed.length} 个`, color: ulds_placed.length === plan.ulds.length ? '#16A34A' : '#F59E0B' },
        ].map(item => (
          <Col span={8} key={item.label}>
            <Card size="small" style={{ textAlign: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 11, color: '#64748B' }}>{item.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{item.value}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* CG Status */}
      <Card size="small" style={{ marginBottom: 12, background: cgOk ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${cgOk ? '#A7F3D0' : '#FECACA'}` }}>
        <Space>
          {cgOk ? <CheckCircleOutlined style={{ color: '#16A34A' }} /> : <WarningOutlined style={{ color: '#DC2626' }} />}
          <Typography.Text style={{ color: cgOk ? '#166534' : '#991B1B', fontWeight: 600 }}>
            重心 CG：{plan.cg_mac_pct.toFixed(1)}% MAC
            {cgOk ? ' ✓ 正常' : ' ⚠ 超出限制'}
          </Typography.Text>
        </Space>
      </Card>

      {/* DGR warnings */}
      {plan.dgr_warnings.length > 0 && (
        <Alert
          type="error"
          icon={<WarningOutlined />}
          message="DGR 冲突警告"
          description={
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11 }}>
              {plan.dgr_warnings.slice(0, 5).map((w, i) => <li key={i}>{w}</li>)}
              {plan.dgr_warnings.length > 5 && <li>...共{plan.dgr_warnings.length}项冲突</li>}
            </ul>
          }
          style={{ marginBottom: 12 }}
        />
      )}

      {/* ULD summary table */}
      <Typography.Text style={{ fontSize: 12, fontWeight: 700, color: '#1F4E79', display: 'block', marginBottom: 6 }}>📦 ULD 货物清单</Typography.Text>
      <div style={{ border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#F1F5F9' }}>
              <th style={{ padding: '4px 8px', textAlign: 'left', color: '#64748B', fontWeight: 600 }}>ULD编号</th>
              <th style={{ padding: '4px 8px', textAlign: 'left', color: '#64748B', fontWeight: 600 }}>舱位</th>
              <th style={{ padding: '4px 8px', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>件数</th>
              <th style={{ padding: '4px 8px', textAlign: 'right', color: '#64748B', fontWeight: 600 }}>重量kg</th>
              <th style={{ padding: '4px 8px', textAlign: 'right', color: '#64748B', fontWeight: 600 }}>容积m³</th>
              <th style={{ padding: '4px 8px', textAlign: 'right', color: '#64748B', fontWeight: 600 }}>收入¥</th>
            </tr>
          </thead>
          <tbody>
            {plan.ulds.map(u => {
              const w = u.cargoItems.reduce((s, c) => s + c.weight_kg, 0);
              const v = u.cargoItems.reduce((s, c) => s + c.volume_m3, 0);
              const rev = u.cargoItems.reduce((s, c) => s + c.chargeableWeight_kg * c.fee_per_kg, 0);
              return (
                <tr key={u.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '4px 8px' }}>
                    <Space size={2}>
                      <Tag color={u.deck === 'main' ? 'blue' : 'green'} style={{ margin: 0, fontSize: 10 }}>
                        {u.uld_serial || u.uld_code}
                      </Tag>
                    </Space>
                  </td>
                  <td style={{ padding: '4px 8px', color: u.position ? '#059669' : '#94A3B8' }}>
                    {u.position || '未分配'}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'center' }}>{u.cargoItems.length}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600 }}>{w.toLocaleString()}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{v.toFixed(2)}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', color: '#16A34A', fontWeight: 600 }}>
                    {rev.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Unplaced cargo */}
      {plan.unplaced.length > 0 && (
        <>
          <Divider style={{ margin: '10px 0' }} />
          <Typography.Text style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>
            ⚠ {plan.unplaced.length} 件货物未分配（超出容量）
          </Typography.Text>
        </>
      )}
    </Modal>
  );
}
