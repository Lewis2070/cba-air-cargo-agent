import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import FlightListPage from './pages/FlightListPage'
import FlightDetailPage from './pages/FlightDetailPage'
import BookingListPage from './pages/BookingListPage'
import CapacityForecastPage from './pages/CapacityForecastPage'
import LoadPlanningPage from './pages/LoadPlanningPage'
import DGRCompliancePage from './pages/DGRCompliancePage'
import RevenueManagementPage from './pages/RevenueManagementPage'
import PostFlightPage from './pages/PostFlightPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="flights" element={<FlightListPage />} />
        <Route path="flights/:id" element={<FlightDetailPage />} />
        <Route path="bookings" element={<BookingListPage />} />
        <Route path="capacity" element={<CapacityForecastPage />} />
        <Route path="planning" element={<LoadPlanningPage />} />
        <Route path="compliance" element={<DGRCompliancePage />} />
        <Route path="revenue" element={<RevenueManagementPage />} />
        <Route path="analysis" element={<PostFlightPage />} />
      </Route>
    </Routes>
  )
}

export default App
