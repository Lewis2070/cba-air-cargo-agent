import { useState } from 'react'
import { Card, Row, Col, Button, Select, Table, Tag, Space, Modal, Progress } from 'antd'
import { PlayCircleOutlined, SaveOutlined, DownloadOutlined } from '@ant-design/icons'

const mockCargoList = [
  { key: '1', id: 'C0001', weight: 450, volume: 1.8, pieces: 3, priority: 1, destination: 'LAX', type: '普通' },
  { key: '2', id: 'C0002', weight: 320, volume: 1.2, pieces: 2, priority: 2, destination: 'FRA', type: '普通' },
  { key: '3', id: 'C0003', weight: 180, volume: 0.8, pieces: 1, priority: 3, destination: 'NRT', type: '普通' },
  { key: '4', id: 'DG001', weight: 50, volume: 0.2, pieces: 1, priority: 5, destination: 'LHR', type: 'DGR' },
  { key: '5', id: 'C0004', weight: 560, volume: 2.2, pieces: 5, priority: 1, destination: 'CDG', type: '普通' },
]

const mockULDPositions = [
  { key: '1', uld: 'ULD01', type: 'P1P', capacity: 4626, used: 3200, status: 'loading' },
  { key: '2', uld: 'ULD02', type: 'PAG', capacity: 4626, used: 2800, status: 'loaded' },
  { key: '3', uld: 'ULD03', type: 'AKE', capacity: 1588, used: 0, status: 'empty' },
  { key: '4', uld: 'ULD04', type: 'PMC', capacity: 4626, used: 1500, status: 'loading' },
]

export default function LoadPlanningPage() {
  const [optimizing, setOptimizing] = useState(false)
  const [show3D, setShow3D] = useState(false)

  const handleOptimize = () => {
    setOptimizing(true)
    setTimeout(() => setOptimizing(false), 2000)
  }

  const columns = [
    { title: '货物编号', dataIndex: 'id', key: 'id', width: 100 },
    { title: '重量(kg)', dataIndex: 'weight', key: 'weight', width: 100 },
    { title: '体积(cbm)', dataIndex: 'volume', key: 'volume', width: 100 },
    { title: '件数', dataIndex: 'pieces', key: 'pieces', width: 80 },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80,
      render: (p: number) => <Tag color={p <= 2 ? 'red' : p <= 3 ? 'orange' : 'blue'}>P{p}</Tag>
    },
    { title: '目的站', dataIndex: 'destination', key: 'destination', width: 80 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 80,
      render: (t: string) => t === 'DGR' ? <Tag color="red">DGR</Tag> : <Tag>普通</Tag>
    },
  ]

  const uldColumns = [
    { title: 'ULD编号', dataIndex: 'uld', key: 'uld', width: 100 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 80 },
    { title: '容量(kg)', dataIndex: 'capacity', key: 'capacity', width: 100 },
    { title: '已装载', key: 'used', width: 150,
      render: (_: any, record: any) => (
        <Progress percent={Math.round(record.used / record.capacity * 100)} size="small" />
      )
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => {
        const map: Record<string, { color: string; text: string }> = {
          empty: { color: 'default', text: '空' },
          loading: { color: 'processing', text: '装载中' },
          loaded: { color: 'success', text: '已装载' },
        }
        return <Tag color={map[s]?.color}>{map[s]?.text}</Tag>
      }
    },
  ]

  return (
    <div>
      <h1>智能排舱</h1>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <Select defaultValue="CA1001" style={{ width: 150 }}
              options={[
                { value: 'CA1001', label: 'CA1001' },
                { value: 'CA1002', label: 'CA1002' },
                { value: 'CA1003', label: 'CA1003' },
              ]}
            />
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleOptimize} loading={optimizing}>
              {optimizing ? '优化中...' : '开始优化'}
            </Button>
            <Button icon={<SaveOutlined />}>保存方案</Button>
            <Button icon={<DownloadOutlined />}>导出</Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card title="货物列表">
            <Table columns={columns} dataSource={mockCargoList} pagination={false} size="small" />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="ULD装载状态">
            <Table columns={uldColumns} dataSource={mockULDPositions} pagination={false} size="small" />
          </Card>
          
          <Card title="优化统计" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <div>装载率: <strong>78.5%</strong></div>
                <div>ULD使用: <strong>4/6</strong></div>
              </Col>
              <Col span={12}>
                <div>优化时间: <strong>1.2s</strong></div>
                <div>重心偏差: <strong>2.3%</strong></div>
              </Col>
            </Row>
          </Card>

          <Card title="3D货舱视图" style={{ marginTop: 16 }}>
            <div style={{ height: 200, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Button onClick={() => setShow3D(true)}>点击查看3D可视化</Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal title="3D货舱可视化" open={show3D} onCancel={() => setShow3D(false)} width={800} footer={null}>
        <div style={{ height: 500, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <div style={{ textAlign: 'center' }}>
            <p>Three.js 3D货舱视图</p>
            <p style={{ fontSize: 12, color: '#999' }}>集成中...</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
