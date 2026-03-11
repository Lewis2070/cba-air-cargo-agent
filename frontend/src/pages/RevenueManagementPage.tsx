import { Card, Row, Col, Table, Tag, Progress, Button, Space } from 'antd'
import { DollarOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const mockBidHistory = [
  { key: '1', time: '10:30', customer: 'C001', weight: 500, bid_price: 8500, requested: 9000, decision: 'ACCEPT' },
  { key: '2', time: '10:45', customer: 'C002', weight: 200, bid_price: 2800, requested: 2500, decision: 'REJECT' },
  { key: '3', time: '11:00', customer: 'C003', weight: 1000, bid_price: 18000, requested: 18500, decision: 'ACCEPT' },
  { key: '4', time: '11:15', customer: 'C004', weight: 300, bid_price: 4500, requested: 4200, decision: 'NEGOTIATE' },
]

const mockRevenueData = [
  { name: '00:00', revenue: 125000 },
  { name: '04:00', revenue: 98000 },
  { name: '08:00', revenue: 156000 },
  { name: '12:00', revenue: 234000 },
  { name: '16:00', revenue: 189000 },
  { name: '20:00', revenue: 145000 },
]

export default function RevenueManagementPage() {
  const columns = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 80 },
    { title: '客户', dataIndex: 'customer', key: 'customer', width: 80 },
    { title: '重量(kg)', dataIndex: 'weight', key: 'weight', width: 100 },
    { title: 'Bid Price', dataIndex: 'bid_price', key: 'bid_price', width: 120 },
    { title: '报价', dataIndex: 'requested', key: 'requested', width: 120 },
    { title: '决策', dataIndex: 'decision', key: 'decision', width: 100,
      render: (d: string) => {
        const map: Record<string, { color: string; text: string }> = {
          ACCEPT: { color: 'success', text: '接受' },
          REJECT: { color: 'error', text: '拒绝' },
          NEGOTIATE: { color: 'warning', text: '议价' },
        }
        return <Tag color={map[d]?.color}>{map[d]?.text}</Tag>
      }
    },
    { title: '操作', key: 'action', width: 100,
      render: () => <Button type="link" size="small">详情</Button>
    },
  ]

  return (
    <div>
      <h1>收益管理</h1>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="今日收入" value={947000} prefix={<DollarOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="接受率" value="68.5%" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="平均Bid Price" value="12.8" suffix="/kg" />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card title="实时收益趋势">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#1F4E79" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Bid Price决策">
            <div style={{ marginBottom: 16 }}>
              <Row>
                <Col span={12}>当前装载率: <strong>78.5%</strong></Col>
                <Col span={12}>Bid Price: <strong>¥12.5/kg</strong></Col>
              </Row>
            </div>
            <Button type="primary" block>调整定价策略</Button>
          </Card>
        </Col>
      </Row>

      <Card title="Bid Price决策记录" style={{ marginTop: 16 }}>
        <Table columns={columns} dataSource={mockBidHistory} pagination={false} />
      </Card>
    </div>
  )
}
