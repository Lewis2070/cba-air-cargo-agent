import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Progress, Tag } from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  GlobalOutlined,
  InboxOutlined,
  DollarOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// Mock data
const mockFlightStats = [
  { name: '周一', flights: 12, load: 85 },
  { name: '周二', flights: 15, load: 78 },
  { name: '周三', flights: 14, load: 82 },
  { name: '周四', flights: 16, load: 88 },
  { name: '周五', flights: 18, load: 92 },
  { name: '周六', flights: 10, load: 75 },
  { name: '周日', flights: 8, load: 68 },
]

const mockRecentFlights = [
  { id: '1', number: 'CA1001', route: 'PVG-LAX', date: '2026-03-15', status: 'scheduled', load: 85 },
  { id: '2', number: 'CA1002', route: 'PVG-FRA', date: '2026-03-15', status: 'boarding', load: 92 },
  { id: '3', number: 'CA1003', route: 'PVG-NRT', date: '2026-03-16', status: 'scheduled', load: 78 },
  { id: '4', number: 'CA1005', route: 'PVG-LHR', date: '2026-03-16', status: 'scheduled', load: 65 },
  { id: '5', number: 'CA1008', route: 'PVG-CDG', date: '2026-03-17', status: 'scheduled', load: 88 },
]

const COLORS = ['#1F4E79', '#2E75B6', '#4472C4', '#5B9BD5', '#7CB5EC']

const statusMap: Record<string, { color: string; text: string }> = {
  scheduled: { color: 'blue', text: '待起飞' },
  boarding: { color: 'orange', text: '登机中' },
  departed: { color: 'green', text: '已起飞' },
  arrived: { color: 'green', text: '已到达' },
  cancelled: { color: 'red', text: '已取消' },
}

export default function DashboardPage() {
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>运营仪表盘</h1>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日航班"
              value={25}
              prefix={<GlobalOutlined />}
              valueStyle={{ color: '#1F4E79' }}
            />
            <div style={{ marginTop: 8 }}>
              <ArrowUpOutlined style={{ color: '#52c41a' }} /> 较昨日 +3
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日订舱"
              value={156}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#2E75B6' }}
            />
            <div style={{ marginTop: 8 }}>
              <ArrowUpOutlined style={{ color: '#52c41a' }} /> 较昨日 +12
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均装载率"
              value={82.5}
              suffix="%"
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#4472C4' }}
            />
            <div style={{ marginTop: 8 }}>
              <ArrowUpOutlined style={{ color: '#52c41a' }} /> 较昨日 +5.2%
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日收入"
              value={2850000}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
              precision={0}
            />
            <div style={{ marginTop: 8 }}>
              <ArrowUpOutlined style={{ color: '#52c41a' }} /> 较昨日 +8.5%
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="本周航班装载率趋势">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockFlightStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[60, 100]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="load"
                  name="装载率%"
                  stroke="#1F4E79"
                  strokeWidth={2}
                  dot={{ fill: '#1F4E79' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="航班状态分布">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: '待起飞', value: 12 },
                    { name: '登机中', value: 3 },
                    { name: '已起飞', value: 8 },
                    { name: '已到达', value: 15 },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {[0, 1, 2, 3].map((index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Recent Flights & Alerts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="近期航班">
            <Table
              dataSource={mockRecentFlights}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { title: '航班号', dataIndex: 'number', key: 'number' },
                { title: '航线', dataIndex: 'route', key: 'route' },
                { title: '日期', dataIndex: 'date', key: 'date' },
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => (
                    <Tag color={statusMap[status]?.color}>
                      {statusMap[status]?.text || status}
                    </Tag>
                  ),
                },
                {
                  title: '装载率',
                  dataIndex: 'load',
                  key: 'load',
                  render: (load: number) => (
                    <Progress
                      percent={load}
                      size="small"
                      strokeColor={
                        load >= 90 ? '#52c41a' : load >= 70 ? '#1890ff' : '#faad14'
                      }
                    />
                  ),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <span>
                <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
                预警提醒
              </span>
            }
          >
            <div style={{ padding: '8px 0' }}>
              <div style={{ marginBottom: 16 }}>
                <Tag color="red">爆舱预警</Tag>
                <span>CA1002 (PVG-FRA) 装载率 92%</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Tag color="orange">空舱预警</Tag>
                <span>CA1005 (PVG-LHR) 装载率仅 65%</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Tag color="blue">DGR待审</Tag>
                <span>3票危险品货物待合规检查</span>
              </div>
              <div>
                <Tag color="green">系统正常</Tag>
                <span>AI模型运行正常</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
