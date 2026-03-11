// Simple combined server for demo (no Docker needed)
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

// Mock Data
const flights = [
  { id: '1', flight_number: 'CA1001', flight_date: '2026-03-15', departure_airport: 'PVG', arrival_airport: 'LAX', aircraft_type: 'B777', capacity_weight: 80000, capacity_volume: 200, booked_weight: 65000, booked_volume: 160, status: 'scheduled' },
  { id: '2', flight_number: 'CA1002', flight_date: '2026-03-15', departure_airport: 'PVG', arrival_airport: 'FRA', aircraft_type: 'B777', capacity_weight: 80000, capacity_volume: 200, booked_weight: 72000, booked_volume: 170, status: 'scheduled' },
  { id: '3', flight_number: 'CA1003', flight_date: '2026-03-16', departure_airport: 'PVG', arrival_airport: 'NRT', aircraft_type: 'A330', capacity_weight: 45000, capacity_volume: 120, booked_weight: 35000, booked_volume: 95, status: 'scheduled' },
  { id: '4', flight_number: 'CA1005', flight_date: '2026-03-16', departure_airport: 'PVG', arrival_airport: 'LHR', aircraft_type: 'B747', capacity_weight: 100000, capacity_volume: 250, booked_weight: 65000, booked_volume: 160, status: 'scheduled' },
  { id: '5', flight_number: 'CA1008', flight_date: '2026-03-17', departure_airport: 'PVG', arrival_airport: 'CDG', aircraft_type: 'B777', capacity_weight: 80000, capacity_volume: 200, booked_weight: 68000, booked_volume: 165, status: 'scheduled' },
];

const bookings = [
  { id: '1', awb: '999-12345678', customer: 'ABC Co.', flight_id: '1', weight: 450, volume: 1.8, status: 'confirmed' },
  { id: '2', awb: '999-12345679', customer: 'XYZ Inc.', flight_id: '1', weight: 320, volume: 1.2, status: 'pending' },
  { id: '3', awb: '999-12345680', customer: 'Tech Ltd.', flight_id: '2', weight: 180, volume: 0.8, status: 'loaded' },
];

// Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@cba.com' && password === 'Admin@2026') {
    res.json({
      user: { id: '1', email: 'admin@cba.com', firstName: 'Admin', role: 'admin' },
      accessToken: 'mock-jwt-token-12345'
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Flights
app.get('/api/flights', (req, res) => {
  res.json({ data: flights, meta: { total: flights.length } });
});

app.get('/api/flights/:id', (req, res) => {
  const flight = flights.find(f => f.id === req.params.id);
  flight ? res.json(flight) : res.status(404).json({ message: 'Not found' });
});

app.get('/api/flights/stats/:id', (req, res) => {
  const flight = flights.find(f => f.id === req.params.id);
  if (!flight) return res.status(404).json({ message: 'Not found' });
  
  res.json({
    flightId: flight.id,
    flightNumber: flight.flight_number,
    capacity: { weight: flight.capacity_weight, volume: flight.capacity_volume },
    booked: { weight: flight.booked_weight, volume: flight.booked_volume },
    utilization: {
      weight: ((flight.booked_weight / flight.capacity_weight) * 100).toFixed(1) + '%',
      volume: ((flight.booked_volume / flight.capacity_volume) * 100).toFixed(1) + '%'
    }
  });
});

// Bookings
app.get('/api/bookings', (req, res) => {
  res.json({ data: bookings, meta: { total: bookings.length } });
});

// AI Endpoints
app.post('/api/ai/dgr/classify', (req, res) => {
  const { description } = req.body;
  const isDGR = description.includes('锂') || description.includes('电池') || description.toLowerCase().includes('battery');
  res.json({
    input: description,
    is_dgr: isDGR,
    dgr_info: isDGR ? { un_number: 'UN3481', class: '9', name: '锂离子电池' } : null,
    confidence: 0.95
  });
});

app.post('/api/ai/capacity/forecast', (req, res) => {
  const { flight_number, forecast_days } = req.body;
  const forecasts = [];
  for (let i = 1; i <= (forecast_days || 14); i++) {
    forecasts.push({
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      flight_number,
      predicted_weight: Math.floor(Math.random() * 20000) + 50000,
      confidence: (0.95 - i * 0.02).toFixed(2)
    });
  }
  res.json({ forecasts });
});

app.post('/api/ai/optimize/load', (req, res) => {
  res.json({
    solution: { package_count: 25, volume_utilization: '82.5%', solve_time: '1.2s' },
    validation: { valid: true }
  });
});

app.post('/api/ai/revenue/bid-price', (req, res) => {
  const { booking } = req.body;
  res.json({
    bid_price_final: Math.floor(booking.weight * 12.5),
    decision: 'ACCEPT',
    margin: '15%'
  });
});

// Health
app.get('/health', (req, res) => res.json({ status: 'healthy' }));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 CBA API Server running on http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/docs (mock)`);
});
