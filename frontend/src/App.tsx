// App.tsx - CBA Air Cargo 智能货运系统 v5.0
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space, Tag, Modal, Button } from 'antd';
import { DashboardOutlined, UserOutlined, LogoutOutlined, SwapOutlined, SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined, ExpandOutlined } from '@ant-design/icons';
import { ThemeProvider, ThemeToggleButton } from './components/ThemeToggle';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CargoListPage from './pages/CargoListPage';
import LoadPlanningPage from './pages/LoadPlanningPage';
import FlightManagementPage from './pages/FlightManagementPage';
import RevenueManagementPage from './pages/RevenueManagementPage';
import BookingManagementPage from './pages/BookingManagementPage';

const { Header, Sider, Content } = Layout;

function MenuItem({ path, icon, label, collapsed }: { path: string; icon: any; label: string; collapsed: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname === path;
  return (
    <div
      onClick={() => navigate(path)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
        cursor: 'pointer', borderRadius: 8, marginBottom: 4,
        background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
        color: '#fff', fontSize: 13, fontWeight: active ? 600 : 400,
        borderLeft: active ? '3px solid #60A5FA' : '3px solid transparent',
        transition: 'all 0.2s',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      {!collapsed && <span>{label}</span>}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const pageTitles: Record<string, string> = {
    '/dashboard': '📊 仪表板',
    '/cargo': '📦 订舱管理',
    '/load-planning': '🛩️ 智能排舱',
    '/flights': '✈️ 航班管理',
    '/revenue': '💰 收益管理',
    '/bookings': '📋 货物列表',
  };

  if (!user) return <LoginPage onLogin={(u) => setUser(u)} />;

  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('cba_user'); setUser(null); };

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Layout style={{ minHeight: '100vh' }}>
          {/* 侧边栏 */}
          <Sider
            width={220}
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            trigger={null}
            className="main-sider"
            style={{ background: '#1F4E79', position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 10 }}
          >
            {/* Logo区 */}
            <div style={{ display: 'flex', alignItems: 'center', height: 64, padding: collapsed ? '0 8px' : '0 16px', justifyContent: collapsed ? 'center' : 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {!collapsed && <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>CBA Air Cargo</span>}
              <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} style={{ color: '#fff' }} size="small" />
            </div>

            {/* 菜单项 */}
            <div style={{ padding: '8px 8px', overflowY: 'auto', flex: 1 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', padding: '8px 8px 4px', fontWeight: 600, letterSpacing: '0.5px' }}>
                {!collapsed && 'NAVIGATION'}
              </div>
              <MenuItem path="/dashboard" icon="📊" label="仪表板" collapsed={collapsed} />
              <MenuItem path="/cargo" icon="📦" label="订舱管理" collapsed={collapsed} />
              <MenuItem path="/load-planning" icon="🛩️" label="智能排舱" collapsed={collapsed} />
              <MenuItem path="/flights" icon="✈️" label="航班管理" collapsed={collapsed} />
              <MenuItem path="/revenue" icon="💰" label="收益管理" collapsed={collapsed} />
              <MenuItem path="/bookings" icon="📋" label="货物列表" collapsed={collapsed} />
            </div>
          </Sider>

          {/* 主内容区 */}
          <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
            {/* 顶栏 */}
            <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 9, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Space size={12}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1F4E79' }}>
                  {/* 动态获取页面标题 */}
                </span>
              </Space>
              <Space size={12}>
                <ThemeToggleButton />
                <span style={{ fontSize: 12, color: '#64748B' }}>{user?.firstName} {user?.lastName}</span>
                <Tag color="blue" style={{ margin: 0 }}>{user?.role || 'Cargo Agent'}</Tag>
                <Button size="small" icon={<LogoutOutlined />} onClick={logout}>退出</Button>
              </Space>
            </Header>

            {/* 页面内容 */}
            <Content style={{ padding: 0, minHeight: 'calc(100vh - 64px)' }}>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage user={user} />} />
                <Route path="/cargo" element={<CargoListPage user={user} />} />
                <Route path="/load-planning" element={<LoadPlanningPage user={user} />} />
                <Route path="/flights" element={<FlightManagementPage user={user} />} />
                <Route path="/revenue" element={<RevenueManagementPage user={user} />} />
                <Route path="/bookings" element={<BookingManagementPage user={user} />} />
                <Route path="*" element={<DashboardPage user={user} />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}
