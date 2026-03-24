import { useState, useEffect } from 'react'
import { Card, Table, Button, Input, Select, DatePicker, Tag, Space, Modal, message } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { flightApi } from '../services/api'

const { RangePicker } = DatePicker

const statusMap: Record<string, { color: string; text: string }> = {
  scheduled: { color: 'blue', text: '待起飞' },
  boarding: { color: 'orange', text: '登机中' },
  departed: { color: 'green', text: '已起飞' },
  arrived: { color: 'green', text: '已到达' },
  cancelled: { color: 'red', text: '已取消' },
}

export default function FlightListPage() {
  const [flights, setFlights] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [filters, setFilters] = useState({ status: '', departure: '', arrival: '' })

  const fetchFlights = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
      }
      const res = await flightApi.getAll(params)
      setFlights(res.data.data || [])
      setPagination({ ...pagination, total: res.data.meta?.total || 0 })
    } catch (error) {
      message.error('获取航班列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlights()
  }, [pagination.current, filters])

  const columns = [
    { title: '航班号', dataIndex: 'flight_number', key: 'flight_number', fixed: 'left' as const, width: 100 },
    { title: '日期', dataIndex: 'flight_date', key: 'flight_date', width: 120 },
    { title: '航线', key: 'route', width: 150,
      render: (_: any, record: any) => `${record.departure_airport}-${record.arrival_airport}`
    },
    { title: '机型', dataIndex: 'aircraft_type', key: 'aircraft_type', width: 80 },
    { title: '可用容量', key: 'capacity', width: 150,
      render: (_: any, record: any) => `${record.capacity_weight}kg / ${record.capacity_volume}cbm`
    },
    { title: '已订舱', key: 'booked', width: 150,
      render: (_: any, record: any) => `${record.booked_weight || 0}kg / ${record.booked_volume || 0}cbm`
    },
    { title: '装载率', key: 'utilization', width: 120,
      render: (_: any, record: any) => {
        const util = record.capacity_weight > 0 
          ? ((record.booked_weight || 0) / record.capacity_weight * 100).toFixed(1) + '%'
          : '0%'
        return util
      }
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (status: string) => (
        <Tag color={statusMap[status]?.color}>{statusMap[status]?.text || status}</Tag>
      )
    },
    { title: '操作', key: 'action', width: 150, fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Space>
      )
    },
  ]

  return (
    <div>
      <h1>航班管理</h1>
      
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input placeholder="航班号" prefix={<SearchOutlined />} style={{ width: 150 }} />
          <Select placeholder="状态" style={{ width: 120 }}
            options={[
              { value: '', label: '全部' },
              { value: 'scheduled', label: '待起飞' },
              { value: 'boarding', label: '登机中' },
              { value: 'departed', label: '已起飞' },
              { value: 'arrived', label: '已到达' },
            ]}
            onChange={(val) => setFilters({ ...filters, status: val })}
          />
          <Select placeholder="始发站" style={{ width: 100 }}
            options={[
              { value: '', label: '全部' },
              { value: 'PVG', label: 'PVG' },
              { value: 'PEK', label: 'PEK' },
              { value: 'CAN', label: 'CAN' },
            ]}
            onChange={(val) => setFilters({ ...filters, departure: val })}
          />
          <Select placeholder="目的站" style={{ width: 100 }}
            options={[
              { value: '', label: '全部' },
              { value: 'LAX', label: 'LAX' },
              { value: 'FRA', label: 'FRA' },
              { value: 'NRT', label: 'NRT' },
            ]}
            onChange={(val) => setFilters({ ...filters, arrival: val })}
          />
          <RangePicker />
          <Button type="primary" icon={<PlusOutlined />}>新建航班</Button>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={flights}
          rowKey="id"
          loading={loading}
          pagination={{ ...pagination, onChange: (page) => setPagination({ ...pagination, current: page }) }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  )
}
