import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Flight API
export const flightApi = {
  getAll: (params?: any) => api.get('/flights', { params }),
  getById: (id: string) => api.get(`/flights/${id}`),
  getStats: (id: string) => api.get(`/flights/stats/${id}`),
  create: (data: any) => api.post('/flights', data),
  update: (id: string, data: any) => api.put(`/flights/${id}`, data),
  delete: (id: string) => api.delete(`/flights/${id}`),
}

// Booking API
export const bookingApi = {
  getAll: (params?: any) => api.get('/bookings', { params }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  create: (data: any) => api.post('/bookings', data),
  update: (id: string, data: any) => api.put(`/bookings/${id}`, data),
  delete: (id: string) => api.delete(`/bookings/${id}`),
}

// Capacity API
export const capacityApi = {
  getForecast: (flightId: string, days?: number) => 
    api.get(`/capacity/forecast/${flightId}`, { params: { days } }),
  getBookingCurve: (flightId: string) => 
    api.get(`/capacity/curve/${flightId}`),
}

// AI API
export const aiApi = {
  classifyDGR: (goodsDescription: string) => 
    api.post('/ai/dgr/classify', { description: goodsDescription }),
  optimizeLoad: (flightId: string, cargoList: any[]) => 
    api.post('/ai/optimize/load', { flightId, cargoList }),
  calculateBidPrice: (flightId: string, booking: any) => 
    api.post('/ai/revenue/bid-price', { flightId, booking }),
  analyzeFlight: (flightId: string) => 
    api.get(`/ai/analysis/${flightId}`),
}
