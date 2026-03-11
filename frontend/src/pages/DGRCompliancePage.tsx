import { useState } from 'react'
import { Card, Table, Button, Input, Tag, Space, Modal, message, Result } from 'antd'
import { SafetyCertificateOutlined, SearchOutlined, CheckCircleOutlined } from '@ant-design/icons'

const mockDGRList = [
  { key: '1', awb: '999-12345678', goods: '锂离子电池', un: 'UN3481', class: '9', status: 'pending', check_time: '-' },
  { key: '2', awb: '999-12345679', goods: '电子元件', un: '-', class: '-', status: 'passed', check_time: '2026-03-11 10:30' },
  { key: '3', awb: '999-12345680', goods: '含锂电池设备', un: 'UN3481', class: '9', status: 'failed', check_time: '2026-03-11 11:00' },
]

export default function DGRCompliancePage() {
  const [checking, setChecking] = useState(false)
  const [goodsDesc, setGoodsDesc] = useState('')
  const [result, setResult] = useState<any>(null)

  const handleCheck = () => {
    if (!goodsDesc) {
      message.warning('请输入货物品名')
      return
    }
    setChecking(true)
    setTimeout(() => {
      setChecking(false)
      const isDGR = goodsDesc.includes('锂') || goodsDesc.includes('battery') || goodsDesc.includes('电池')
      setResult({
        is_dgr: isDGR,
        confidence: 0.95,
        dgr_info: isDGR ? { un_number: 'UN3481', class: '9', name: '锂离子电池' } : null
      })
    }, 1500)
  }

  const columns = [
    { title: 'AWB单号', dataIndex: 'awb', key: 'awb', width: 140 },
    { title: '货物品名', dataIndex: 'goods', key: 'goods', width: 200 },
    { title: 'UN编号', dataIndex: 'un', key: 'un', width: 100 },
    { title: '类别', dataIndex: 'class', key: 'class', width: 80 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => {
        const map: Record<string, { color: string; icon: any }> = {
          pending: { color: 'processing', icon: <SafetyCertificateOutlined /> },
          passed: { color: 'success', icon: <CheckCircleOutlined /> },
          failed: { color: 'error', icon: <SafetyCertificateOutlined /> },
        }
        return <Tag color={map[s]?.color} icon={map[s]?.icon}>{s === 'passed' ? '通过' : s === 'failed' ? '不通过' : '待审核'}</Tag>
      }
    },
    { title: '检查时间', dataIndex: 'check_time', key: 'check_time', width: 160 },
  ]

  return (
    <div>
      <h1>DGR合规检查</h1>

      <Card style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input 
            placeholder="输入货物品名进行DGR检查" 
            value={goodsDesc}
            onChange={(e) => setGoodsDesc(e.target.value)}
            onPressEnter={handleCheck}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleCheck} loading={checking}>
            开始检查
          </Button>
        </Space.Compact>
      </Card>

      {result && (
        <Card style={{ marginBottom: 16 }}>
          {result.is_dgr ? (
            <Result
              status="warning"
              title="危险品识别"
              subTitle={`UN编号: ${result.dgr_info?.un_number}, 类别: ${result.dgr_info?.class}`}
              extra={[
                <Button type="primary" key="detail">查看详情</Button>,
                <Button key="ignore">忽略</Button>,
              ]}
            />
          ) : (
            <Result
              status="success"
              title="普通货物"
              subTitle="该货物品名不属于危险品范畴"
            />
          )}
          <div style={{ textAlign: 'center', color: '#999' }}>置信度: {(result.confidence * 100).toFixed(1)}%</div>
        </Card>
      )}

      <Card title="DGR检查记录">
        <Table columns={columns} dataSource={mockDGRList} pagination={false} />
      </Card>
    </div>
  )
}
