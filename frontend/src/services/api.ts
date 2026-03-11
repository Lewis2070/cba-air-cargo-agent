import axios from 'axios'

// For demo: use mock data when API is not available
const DEMO_MODE = true
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Mock data for demo
const mockFlights = [
  { id: '1', flight_number: 'CA1001', flight_date: '2026-03-15', departure_airport: 'PVG', arrival_airport: 'LAX', aircraft_type: 'B777', capacity_weight: 80000, capacity_volume: 200, booked_weight: 65000, booked_volume: 160, status: 'scheduled' },
  { id: '2', flight_number: 'CA1002', flight_date: '2026-03-15', departure_airport: 'PVG', arrival_airport: 'FRA', aircraft_type: 'B777', capacity_weight: 80000, capacity_volume: 200, booked_weight: 72000, booked_volume: 170, status: 'scheduled' },
  { id: '3', flight_number: 'CA1003', flight_date: '2026-03-16', departure_airport: 'PVG', arrival_airport: 'NRT', aircraft_type: 'A330', capacity_weight: 45000, capacity_volume: 120, booked_weight: 35000, booked_volume: 95, status: 'scheduled' },
  { id: '4', flight_number: 'CA1005', flight_date: '2026-03-16', departure_airport: 'PVG', arrival_airport: 'LHR', aircraft_type: 'B747', capacity_weight: 100000, capacity_volume: 250, booked_weight: 65000, booked_volume: 160, status: 'scheduled' },
  { id: '5', flight_number: 'CA1008', flight_date: '2026-03-17', departure_airport: 'PVG', arrival_airport: 'CDG', aircraft_type: 'B777', capacity_weight: 80000, capacity_volume: 200, booked_weight: 68000, booked_volume: 165, status: 'scheduled' },
]

const mockBookings = [
  { id: '1', awb: '999-12345678', customer: 'ABC Co.', flight_id: '1', weight: 450, volume: 1.8, status: 'confirmed' },
  { id: '2', awb: '999-12345679', customer: 'XYZ Inc.', flight_id: '1', weight: 320, volume: 1.2, status: 'pending' },
  { id: '3', awb: '999-12345680', customer: 'Tech Ltd.', flight_id: '2', weight: 180, volume: 0.8, status: 'loaded' },
]

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle errors - fallback to demo mode
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (DEMO_MODE) {
      console.log('Demo mode: using mock data')
    }
    return Promise.reject(error)
  }
)

// Flight API - with demo fallback
export const flightApi = {
  getAll: async (params?: any) => {
    if (DEMO_MODE) {
      return { data: { data: mockFlights, meta: { total: mockFlights.length } } }
    }
    return api.get('/flights', { params })
  },
  getById: async (id: string) => {
    if (DEMO_MODE) {
      const flight = mockFlights.find(f => f.id === id)
      return { data: flight || mockFlights[0] }
    }
    return api.get(`/flights/${id}`)
  },
  getStats: async (id: string) => {
    if (DEMO_MODE) {
      const flight = mockFlights.find(f => f.id === id) || mockFlights[0]
      return { data: { flightId: id, flightNumber: flight.flight_number, booked: { weight: flight.booked_weight }, capacity: { weight: flight.capacity_weight } } }
    }
    return api.get(`/flights/stats/${id}`)
  },
}

// Booking API - with demo fallback
export const bookingApi = {
  getAll: async (params?: any) => {
    if (DEMO_MODE) {
      return { data: { data: mockBookings, meta: { total: mockBookings.length } } }
    }
    return api.get('/bookings', { params })
  },
}

// AI API - mock for demo
export const aiApi = {
  classifyDGR: async (goodsDescription: string) => {
    if (DEMO_MODE) {
      const isDGR = goodsDescription.includes('锂') || goodsDescription.includes('电池') || goodsDescription.toLowerCase().includes('battery')
      return { data: { input: goodsDescription, is_dgr: isDGR, dgr_info: isDGR ? { un_number: 'UN3481', class: '9' } : null, confidence: 0.95 } }
    }
    return api.post('/ai/dgr/classify', { description: goodsDescription })
  },
  optimizeLoad: async (flightId: string, cargoList: any[]) => {
    if (DEMO_MODE) {
      return { data: { solution: { package_count: 25, volume_utilization: '82.5%' }, validation: { valid: true } } }
    }
    return api.post('/ai/optimize/load', { flightId, cargoList })
  },
  calculateBidPrice: async (flightId: string, booking: any) => {
    if (DEMO_MODE) {
      return { data: { bid_price_final: Math.floor(booking.weight * 12.5), decision: 'ACCEPT', margin: '15%' } }
    }
    return api.post('/ai/revenue/bid-price', { flightId, booking })
  },
}
