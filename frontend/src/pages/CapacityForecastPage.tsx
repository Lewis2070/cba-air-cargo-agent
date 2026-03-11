import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Progress, Tag, Button, Tabs } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, WarningOutlined } from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const mockForecastData = Array.from({ length: 14 }, (_, i) => ({
  day: `Day ${i + 1}`,
  predicted: Math.floor(Math.random() * 20000) + 50000,
  upper: Math.floor(Math.random() * 20000) + 60000,
  lower: Math.floor(Math.random() * 20000) + 40000,
}))

const mockAlerts = [
  { id: 1, type: 'overbooking', level: 'high', flight: 'CA1001', message: '预计爆舱，建议关闭订舱', date: '2026-03-15' },
  { id: 2, type: 'low_load', level: 'medium', flight: 'CA1005', message: '装载率偏低，建议加强揽货', date: '2026-03-16' },
  { id: 3, type: 'normal', level: 'low', flight: 'CA1003', message: '装载率正常', date: '2026-03-17' },
]

export default function CapacityForecastPage() {
  const [loading, setLoading] = useState(false)

  const columns = [
    { title: '航班号', dataIndex: 'flight', key: 'flight', width: 100 },
    { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
    { title: '预测装载量(kg)', dataIndex: 'predicted', key: 'predicted', width: 150 },
    { title: '容量(kg)', dataIndex: 'capacity', key: 'capacity', width: 120 },
    { title: '预测装载率', key: 'utilization', width: 150,
      render: (_: any, record: any) => {
        const util = (record.predicted / record.capacity * 100).toFixed(1)
        return <Progress percent={parseFloat(util)} strokeColor={parseFloat(util) > 90 ? '#ff4d4f' : '#1890ff'} />
      }
    },
    { title: '置信度', dataIndex: 'confidence', key: 'confidence', width: 100 },
    { title: '预警', key: 'alert', width: 100,
      render: (_: any, record: any) => {
        const util = record.predicted / record.capacity
        if (util > 0.9) return <Tag color="red">爆舱预警</Tag>
        if (util < 0.6) return <Tag color="orange">空舱预警</Tag>
        return <Tag color="green">正常</Tag>
      }
    },
  ]

  const tableData = [
    { key: '1', flight: 'CA1001', date: '2026-03-15', predicted: 75000, capacity: 80000, confidence: '95%' },
    { key: '2', flight: 'CA1002', date: '2026-03-15', predicted: 82000, capacity: 80000, confidence: '92%' },
    { key: '3', flight: 'CA1003', date: '2026-03-16', predicted: 45000, capacity: 45000, confidence: '88%' },
    { key: '4', flight: 'CA1005', date: '2026-03-16', predicted: 52000, capacity: 100000, confidence: '90%' },
    { key: '5', flight: 'CA1008', date: '2026-03-17', predicted: 68000, capacity: 80000, confidence: '87%' },
  ]

  return (
    <div>
      <h1>舱位预测</h1>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="今日预测航班"
              value={12}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="爆舱预警"
              value={2}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="平均预测准确率"
              value="91.5%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="CA1001 未来14天需求预测">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockForecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="predicted" stroke="#1F4E79" strokeWidth={2} name="预测值" />
                <Line type="monotone" dataKey="upper" stroke="#52c41a" strokeDasharray="5 5" name="上限" />
                <Line type="monotone" dataKey="lower" stroke="#ff4d4f" strokeDasharray="5 5" name="下限" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="预警列表">
            {mockAlerts.map(alert => (
              <div key={alert.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Tag color={alert.level === 'high' ? 'red' : alert.level === 'medium' ? 'orange' : 'blue'}>
                  {alert.level === 'high' ? '爆舱' : alert.level === 'medium' ? '空舱' : '正常'}
                </Tag>
                <span style={{ marginLeft: 8 }}>{alert.flight}</span>
                <div style={{ marginTop: 4, color: '#666' }}>{alert.message}</div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      <Card title="航班预测列表" style={{ marginTop: 16 }}>
        <Table columns={columns} dataSource={tableData} pagination={false} />
      </Card>
    </div>
  )
}
