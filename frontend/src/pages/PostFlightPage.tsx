import { Card, Row, Col, Table, Tag, Button, Timeline } from 'antd'
import { BarChartOutlined, RiseOutlined, ClockCircleOutlined } from '@ant-design/icons'

const mockAnalysisList = [
  { key: '1', flight: 'CA1001', date: '2026-03-10', route: 'PVG-LAX', utilization: 85.2, revenue: 850000, profit: 170000, status: 'completed' },
  { key: '2', flight: 'CA1002', date: '2026-03-10', route: 'PVG-FRA', utilization: 78.5, revenue: 720000, profit: 125000, status: 'completed' },
  { key: '3', flight: 'CA1003', date: '2026-03-11', route: 'PVG-NRT', utilization: 92.1, revenue: 580000, profit: 145000, status: 'generating' },
]

export default function PostFlightPage() {
  const columns = [
    { title: '航班', dataIndex: 'flight', key: 'flight', width: 100 },
    { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
    { title: '航线', dataIndex: 'route', key: 'route', width: 120 },
    { title: '装载率', dataIndex: 'utilization', key: 'utilization', width: 120,
      render: (v: number) => `${v}%`
    },
    { title: '收入', dataIndex: 'revenue', key: 'revenue', width: 120,
      render: (v: number) => `¥${(v/1000).toFixed(0)}K`
    },
    { title: '利润', dataIndex: 'profit', key: 'profit', width: 120,
      render: (v: number) => `¥${(v/1000).toFixed(0)}K`
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 120,
      render: (s: string) => s === 'completed' 
        ? <Tag color="green">已完成</Tag> 
        : <Tag color="processing">生成中</Tag>
    },
    { title: '操作', key: 'action', width: 120,
      render: () => <Button type="link" size="small">查看报告</Button>
    },
  ]

  return (
    <div>
      <h1>航班复盘分析</h1>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="复盘分析列表">
            <Table columns={columns} dataSource={mockAnalysisList} pagination={false} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="分析要点">
            <Timeline
              items={[
                { color: 'green', children: 'CA1001 装载率超预期,建议提高运价' },
                { color: 'green', children: 'CA1002 利润率达标,继续维持' },
                { color: 'orange', children: 'CA1003 准点率下降,需排查原因' },
                { color: 'blue', children: '本周平均装载率: 85.2%' },
              ]}
            />
          </Card>
          
          <Card title="AI归因分析" style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 8 }}><Tag color="red">高优先级</Tag> 装载率偏低,建议加强揽货</div>
            <div style={{ marginBottom: 8 }}><Tag color="orange">中优先级</Tag> 利润率有提升空间</div>
            <div><Tag color="blue">建议</Tag> 优化超订策略</div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
