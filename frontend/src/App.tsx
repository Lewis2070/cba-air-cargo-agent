// App.tsx - CBA Air Cargo v5.2
// 注意：BrowserRouter 在 main.tsx 中已包裹 <App />，不要重复嵌套
import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Space, Tag, Button } from 'antd';
import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { ThemeProvider, ThemeToggleButton } from './components/ThemeToggle';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BookingListPage from './pages/BookingListPage';
import LoadPlanningPage from './pages/LoadPlanningPage';
import FlightListPage from './pages/FlightListPage';
import RevenueManagementPage from './pages/RevenueManagementPage';
import CargoListPage from './pages/CargoListPage';

const { Header, Sider, Content } = Layout;

function MenuItem({ path, icon, label, collapsed, onClick }: { path: string; icon: any; label: string; collapsed: boolean; onClick: (p: string) => void }) {
  const location = useLocation();
  const active = location.pathname === path;
  return (
    <div
      onClick={() => onClick(path)}
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

function Sidebar({ collapsed, onCollapse }: { collapsed: boolean; onCollapse: (v: boolean) => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: '运营仪表盘' },
    { path: '/flights', icon: '✈️', label: '航班管理' },
    { path: '/bookings', icon: '📦', label: '订舱管理' },
    { path: '/cargo', icon: '📋', label: '货物列表' },
    { path: '/load-planning', icon: '🔧', label: '智能排舱' },
    { path: '/revenue', icon: '💰', label: '收益管理' },
  ];

  return (
    <Sider
      width={220}
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      trigger={null}
      style={{ background: 'linear-gradient(180deg, #1F4E79 0%, #2E75B6 100%)' }}
    >
      <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>CBA Air Cargo</span>
      </div>
      <div style={{ padding: '8px 0' }}>
        {menuItems.map(item => (
          <MenuItem
            key={item.path}
            path={item.path}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
            onClick={navigate}
          />
        ))}
      </div>
    </Sider>
  );
}

export default function App() {
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  // ✅ 核心认证守卫：未登录强制显示登录页
  if (!user) return <LoginPage />;

  const handleLogout = () => { logout(); };

  return (
    <ThemeProvider>
      <Layout style={{ minHeight: '100vh' }}>
        <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
        <Layout>
          <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ color: '#1F4E79', fontSize: 18 }}
            />
            <Space>
              <ThemeToggleButton />
              <Tag color="blue" style={{ fontFamily: 'monospace' }}>V5.4.0</Tag>
              <Button icon={<LogoutOutlined />} danger size="small" onClick={handleLogout}>退出</Button>
            </Space>
          </Header>
          <Content style={{ padding: 16, background: '#F5F7FA' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/flights" element={<FlightListPage />} />
              <Route path="/bookings" element={<BookingListPage />} />
              <Route path="/cargo" element={<CargoListPage />} />
              <Route path="/load-planning" element={<LoadPlanningPage />} />
              <Route path="/revenue" element={<RevenueManagementPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </ThemeProvider>
  );
}
