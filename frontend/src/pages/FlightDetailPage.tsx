import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Row, Col, Descriptions, Table, Tag, Button, Space, Tabs } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

export default function FlightDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const flightData = {
    flight_number: 'CA1001',
    flight_date: '2026-03-15',
    departure: 'PVG',
    arrival: 'LAX',
    aircraft_type: 'B777-300ER',
    capacity_weight: 80000,
    capacity_volume: 200,
    booked_weight: 65000,
    booked_volume: 160,
    status: 'scheduled',
    etd: '2026-03-15 14:30',
    eta: '2026-03-15 16:45',
  }

  const bookings = [
    { key: '1', awb: '999-12345678', customer: 'ABC Co.', weight: 450, volume: 1.8, status: 'confirmed' },
    { key: '2', awb: '999-12345679', customer: 'XYZ Inc.', weight: 320, volume: 1.2, status: 'loaded' },
    { key: '3', awb: '999-12345680', customer: 'Tech Ltd.', weight: 180, volume: 0.8, status: 'confirmed' },
  ]

  const bookingColumns = [
    { title: 'AWB', dataIndex: 'awb', key: 'awb' },
    { title: '客户', dataIndex: 'customer', key: 'customer' },
    { title: '重量', dataIndex: 'weight', key: 'weight' },
    { title: '体积', dataIndex: 'volume', key: 'volume' },
    { title: '状态', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag>{s}</Tag>
    },
  ]

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/flights')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>

      <Card title={`航班 ${flightData.flight_number}`} style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="航班号">{flightData.flight_number}</Descriptions.Item>
          <Descriptions.Item label="日期">{flightData.flight_date}</Descriptions.Item>
          <Descriptions.Item label="航线">{flightData.departure} → {flightData.arrival}</Descriptions.Item>
          <Descriptions.Item label="机型">{flightData.aircraft_type}</Descriptions.Item>
          <Descriptions.Item label="状态"><Tag color="blue">{flightData.status}</Tag></Descriptions.Item>
          <Descriptions.Item label="预计起飞">{flightData.etd}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <div>可用容量</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{flightData.capacity_weight} kg</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div>已订舱</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{flightData.booked_weight} kg</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div>装载率</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>
              {((flightData.booked_weight / flightData.capacity_weight) * 100).toFixed(1)}%
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="订舱列表">
        <Table columns={bookingColumns} dataSource={bookings} pagination={false} />
      </Card>
    </div>
  )
}
