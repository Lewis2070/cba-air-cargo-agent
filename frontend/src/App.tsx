import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Sidebar from './components/Layout/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BookingListPage from './pages/BookingListPage';
import FlightListPage from './pages/FlightListPage';
import FlightDetailPage from './pages/FlightDetailPage';
import CargoListPage from './pages/CargoListPage';
import LoadPlanningPage from './pages/LoadPlanningPage';
import DGRCompliancePage from './pages/DGRCompliancePage';
import CapacityForecastPage from './pages/CapacityForecastPage';
import RevenueManagementPage from './pages/RevenueManagementPage';
import PostFlightPage from './pages/PostFlightPage';
import NotFound from './pages/NotFound';

function AuthRedirect() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const loc = useLocation();
  useEffect(() => {
    if (isAuthenticated() && loc.pathname === '/login') {
      navigate('/dashboard', { replace: true });
    } else if (!isAuthenticated() && loc.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate, loc.pathname]);
  return null;
}

export default function App() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/bookings" element={<BookingListPage />} />
          <Route path="/flights" element={<FlightListPage />} />
          <Route path="/flight/:id" element={<FlightDetailPage />} />
          <Route path="/cargo" element={<CargoListPage />} />
          <Route path="/load-planning" element={<LoadPlanningPage />} />
          <Route path="/dgr-compliance" element={<DGRCompliancePage />} />
          <Route path="/capacity" element={<CapacityForecastPage />} />
          <Route path="/revenue" element={<RevenueManagementPage />} />
          <Route path="/post-flight" element={<PostFlightPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <AuthRedirect />
    </div>
  );
}
