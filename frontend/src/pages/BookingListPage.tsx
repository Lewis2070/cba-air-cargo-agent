import { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Space, Modal, message, Form, Input, InputNumber, Select, DatePicker } from 'antd'
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { bookingApi } from '../services/api'

const { RangePicker } = DatePicker

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'processing', text: '待确认' },
  confirmed: { color: 'blue', text: '已确认' },
  loaded: { color: 'green', text: '已装载' },
  departed: { color: 'purple', text: '已起飞' },
  delivered: { color: 'default', text: '已交付' },
  cancelled: { color: 'red', text: '已取消' },
}

export default function BookingListPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    // Mock data for now
    setBookings([
      { id: '1', awb: '999-12345678', customer: 'ABC Co.', flight: 'CA1001', route: 'PVG-LAX', weight: 450, volume: 1.8, status: 'confirmed', date: '2026-03-15' },
      { id: '2', awb: '999-12345679', customer: 'XYZ Inc.', flight: 'CA1001', route: 'PVG-LAX', weight: 320, volume: 1.2, status: 'pending', date: '2026-03-15' },
      { id: '3', awb: '999-12345680', customer: 'Tech Ltd.', flight: 'CA1002', route: 'PVG-FRA', weight: 180, volume: 0.8, status: 'loaded', date: '2026-03-16' },
      { id: '4', awb: '999-12345681', customer: 'Global Trade', flight: 'CA1003', route: 'PVG-NRT', weight: 560, volume: 2.2, status: 'pending', date: '2026-03-16' },
      { id: '5', awb: '999-12345682', cargo: 'Electronic Parts', flight: 'CA1005', route: 'PVG-LHR', weight: 250, volume: 1.0, status: 'confirmed', date: '2026-03-17' },
    ])
  }, [])

  const columns = [
    { title: 'AWB单号', dataIndex: 'awb', key: 'awb', width: 140 },
    { title: '客户', dataIndex: 'customer', key: 'customer', width: 150 },
    { title: '航班', dataIndex: 'flight', key: 'flight', width: 100 },
    { title: '航线', dataIndex: 'route', key: 'route', width: 120 },
    { title: '重量(kg)', dataIndex: 'weight', key: 'weight', width: 100 },
    { title: '体积(cbm)', dataIndex: 'volume', key: 'volume', width: 100 },
    { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (status: string) => (
        <Tag color={statusMap[status]?.color}>{statusMap[status]?.text || status}</Tag>
      )
    },
    { title: '操作', key: 'action', width: 120,
      render: () => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
        </Space>
      )
    },
  ]

  const handleSubmit = async (values: any) => {
    console.log('New booking:', values)
    message.success('订舱成功')
    setModalVisible(false)
    form.resetFields()
  }

  return (
    <div>
      <h1>订舱管理</h1>
      
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input placeholder="AWB/客户" prefix={<SearchOutlined />} style={{ width: 180 }} />
          <Select placeholder="状态" style={{ width: 120 }}
            options={[
              { value: '', label: '全部' },
              { value: 'pending', label: '待确认' },
              { value: 'confirmed', label: '已确认' },
              { value: 'loaded', label: '已装载' },
            ]}
          />
          <RangePicker />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>新建订舱</Button>
        </Space>
      </Card>

      <Card>
        <Table columns={columns} dataSource={bookings} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="新建订舱" open={modalVisible} onCancel={() => setModalVisible(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="awb" label="AWB单号" rules={[{ required: true }]}>
            <Input placeholder="999-XXXXXXXX" />
          </Form.Item>
          <Form.Item name="customer" label="客户名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="flight" label="航班" rules={[{ required: true }]}>
            <Select placeholder="选择航班"
              options={[
                { value: 'CA1001', label: 'CA1001' },
                { value: 'CA1002', label: 'CA1002' },
              ]}
            />
          </Form.Item>
          <Form.Item name="weight" label="重量(kg)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="volume" label="体积(cbm)">
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>提交</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
