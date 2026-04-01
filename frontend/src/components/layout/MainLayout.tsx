import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Button, theme } from 'antd'
import {
  DashboardOutlined,
  GlobalOutlined,
  InboxOutlined,
  LineChartOutlined,
  AppstoreOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../../stores/authStore'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '运营仪表盘' },
  { key: '/flights', icon: <GlobalOutlined />, label: '航班管理' },
  { key: '/bookings', icon: <InboxOutlined />, label: '订舱管理' },
  { key: '/capacity', icon: <LineChartOutlined />, label: '舱位预测' },
  { key: '/planning', icon: <AppstoreOutlined />, label: '智能排舱' },
  { key: '/compliance', icon: <SafetyCertificateOutlined />, label: 'DGR合规' },
  { key: '/revenue', icon: <DollarOutlined />, label: '收益管理' },
  { key: '/analysis', icon: <BarChartOutlined />, label: '航班复盘' },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { token } = theme.useToken()
  const [collapsed, setCollapsed] = useState(false)

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人中心',
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme="dark"
        width={220}
        collapsedWidth={80}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        style={{
          background: '#1F4E79',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          zIndex: 10,
          transition: 'width 0.2s ease',
          overflow: 'hidden',
        }}
      >
        {/* Logo + 折叠按钮区 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 64,
            padding: collapsed ? '0 8px' : '0 16px',
            justifyContent: collapsed ? 'center' : 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {!collapsed && (
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: '0.5px' }}>
              CBA Air Cargo
            </span>
          )}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: '#fff', flexShrink: 0 }}
            size="small"
          />
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            background: 'transparent',
            borderRight: 0,
            overflow: 'hidden',
          }}
          inlineCollapsed={collapsed}
        />
      </Sider>

      {/* 主内容区 - 随 Sider 宽度偏移 */}
      <div style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s ease' }}>
        <Header
          style={{
            padding: '0 16px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 9,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1F4E79' }} />
              <span>{user?.firstName || user?.email || 'User'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ padding: 24, background: '#F5F7FA', minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </div>
    </Layout>
  )
}
