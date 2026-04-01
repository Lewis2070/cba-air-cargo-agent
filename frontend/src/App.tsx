// App.tsx - CBA Air Cargo v5.2.3
// 注意：BrowserRouter 在 main.tsx 中已包裹 <App />，不要重复嵌套
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeToggle'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
import MainLayout from './components/layout/MainLayout'
import DashboardPage from './pages/DashboardPage'
import BookingListPage from './pages/BookingListPage'
import LoadPlanningPage from './pages/LoadPlanningPage'
import FlightListPage from './pages/FlightListPage'
import RevenueManagementPage from './pages/RevenueManagementPage'
import CargoListPage from './pages/CargoListPage'

export default function App() {
  const { user } = useAuthStore()

  // ✅ 核心认证守卫：未登录强制显示登录页
  if (!user) return <LoginPage />

  return (
    <ThemeProvider>
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
    </ThemeProvider>
  )
}
