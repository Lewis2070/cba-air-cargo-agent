// CBA Air Cargo Backend - With Real Test Data
const http = require('http');
const url = require('url');

const PORT = 3000;

// ==================== TEST DATA ====================

// Flights data
const flights = [
  { id: '1', flight_number: 'CA1001', flight_date: '2026-03-15', departure_airport: 'PVG', arrival_airport: 'LAX', aircraft_type: 'B777-300ER', capacity_weight: 80000, capacity_volume: 200, booked_weight: 65000, booked_volume: 160, total_revenue: 850000, status: 'scheduled', etd: '2026-03-15 14:30', eta: '2026-03-15 16:45' },
  { id: '2', flight_number: 'CA1002', flight_date: '2026-03-15', departure_airport: 'PVG', arrival_airport: 'FRA', aircraft_type: 'B777-300ER', capacity_weight: 80000, capacity_volume: 200, booked_weight: 72000, booked_volume: 175, total_revenue: 920000, status: 'scheduled', etd: '2026-03-15 20:00', eta: '2026-03-16 05:30' },
  { id: '3', flight_number: 'CA1003', flight_date: '2026-03-16', departure_airport: 'PVG', arrival_airport: 'NRT', aircraft_type: 'A330-300', capacity_weight: 45000, capacity_volume: 120, booked_weight: 35000, booked_volume: 95, total_revenue: 420000, status: 'scheduled', etd: '2026-03-16 08:30', eta: '2026-03-16 12:15' },
  { id: '4', flight_number: 'CA1005', flight_date: '2026-03-16', departure_airport: 'PVG', arrival_airport: 'LHR', aircraft_type: 'B747-400F', capacity_weight: 100000, capacity_volume: 250, booked_weight: 65000, booked_volume: 160, total_revenue: 980000, status: 'scheduled', etd: '2026-03-16 22:00', eta: '2026-03-17 06:30' },
  { id: '5', flight_number: 'CA1008', flight_date: '2026-03-17', departure_airport: 'PVG', arrival_airport: 'CDG', aircraft_type: 'B777-300ER', capacity_weight: 80000, capacity_volume: 200, booked_weight: 68000, booked_volume: 165, total_revenue: 890000, status: 'scheduled', etd: '2026-03-17 01:30', eta: '2026-03-17 07:45' },
  { id: '6', flight_number: 'CA1010', flight_date: '2026-03-17', departure_airport: 'PVG', arrival_airport: 'ORD', aircraft_type: 'B777-300ER', capacity_weight: 80000, capacity_volume: 200, booked_weight: 55000, booked_volume: 140, total_revenue: 720000, status: 'scheduled', etd: '2026-03-17 20:00', eta: '2026-03-18 08:30' },
  { id: '7', flight_number: 'CA1012', flight_date: '2026-03-18', departure_airport: 'PVG', arrival_airport: 'ICN', aircraft_type: 'A330-200', capacity_weight: 38000, capacity_volume: 100, booked_weight: 28000, booked_volume: 75, total_revenue: 280000, status: 'scheduled', etd: '2026-03-18 09:00', eta: '2026-03-18 12:00' },
  { id: '8', flight_number: 'CA1015', flight_date: '2026-03-18', departure_airport: 'PVG', arrival_airport: 'JFK', aircraft_type: 'B777-300ER', capacity_weight: 80000, capacity_volume: 200, booked_weight: 78000, booked_volume: 195, total_revenue: 1050000, status: 'scheduled', etd: '2026-03-18 22:30', eta: '2026-03-19 06:00' },
];

// Bookings data
const bookings = [
  { id: '1', awb: '999-12345678', customer: 'ABC Trading Co.', customer_code: 'ABC001', flight_id: '1', weight: 450, volume: 1.8, pieces: 3, status: 'confirmed', goods_description: 'Electronic Components', rate_class: 'Q', total_charge: 6750, booking_date: '2026-03-10' },
  { id: '2', awb: '999-12345679', customer: 'XYZ Logistics', customer_code: 'XYZ002', flight_id: '1', weight: 320, volume: 1.2, pieces: 2, status: 'pending', goods_description: 'Auto Parts', rate_class: 'M', total_charge: 3840, booking_date: '2026-03-11' },
  { id: '3', awb: '999-12345680', customer: 'Tech Industries', customer_code: 'TECH003', flight_id: '2', weight: 1800, volume: 6.5, pieces: 15, status: 'confirmed', goods_description: 'Machinery Parts', rate_class: 'C', total_charge: 32400, booking_date: '2026-03-09' },
  { id: '4', awb: '999-12345681', customer: 'Global Exports', customer_code: 'GLO004', flight_id: '2', weight: 560, volume: 2.2, pieces: 5, status: 'loaded', goods_description: 'Textile Products', rate_class: 'Q', total_charge: 7840, booking_date: '2026-03-08' },
  { id: '5', awb: '999-12345682', customer: 'Pacific Trading', customer_code: 'PAC005', flight_id: '3', weight: 250, volume: 1.0, pieces: 2, status: 'confirmed', goods_description: 'Ceramic Products', rate_class: 'S', total_charge: 3000, booking_date: '2026-03-12' },
  { id: '6', awb: '999-12345683', customer: 'Euro Cargo GmbH', customer_code: 'EUR006', flight_id: '4', weight: 3200, volume: 12.0, pieces: 20, status: 'confirmed', goods_description: 'Medical Equipment', rate_class: 'C', total_charge: 64000, booking_date: '2026-03-07' },
  { id: '7', awb: '999-12345684', customer: 'American Imports Inc', customer_code: 'AMR007', flight_id: '5', weight: 890, volume: 3.5, pieces: 8, status: 'pending', goods_description: 'Pharmaceutical Products', rate_class: 'Q', total_charge: 13350, booking_date: '2026-03-13' },
  { id: '8', awb: '999-12345685', customer: 'Shanghai Electronics', customer_code: 'SHE008', flight_id: '1', weight: 150, volume: 0.6, pieces: 1, status: 'confirmed', goods_description: 'Lithium Batteries', rate_class: 'DGR', total_charge: 4500, is_dgr: true, dgr_class: '9', un_number: 'UN3481', booking_date: '2026-03-14' },
];

// ULD Types
const uldTypes = [
  { code: 'P1P', name: 'Pallet P1P', max_weight: 4626, max_volume: 14.32, length: 224, width: 318, height: 300 },
  { code: 'PAG', name: 'Pallet PAG', max_weight: 4626, max_volume: 14.32, length: 224, width: 318, height: 300 },
  { code: 'PMC', name: 'Pallet PMC', max_weight: 4626, max_volume: 13.5, length: 317, width: 223, height: 160 },
  { code: 'AKE', name: 'Container AKE', max_weight: 1588, max_volume: 4.9, length: 153, width: 198, height: 160 },
  { code: 'AVP', name: 'Container AVP', max_weight: 1150, max_volume: 3.8, length: 150, width: 120, height: 120 },
  { code: 'RKN', name: 'Reefer RKN', max_weight: 2500, max_volume: 6.5, length: 200, width: 150, height: 160 },
];

// ULD Positions for a flight
const uldPositions = [
  { id: 'ULD01', flight_id: '1', uld_type: 'P1P', position_code: 'A', max_weight: 4626, max_volume: 14.32, current_weight: 3200, current_volume: 12.5, status: 'loaded' },
  { id: 'ULD02', flight_id: '1', uld_type: 'PAG', position_code: 'B', max_weight: 4626, max_volume: 14.32, current_weight: 2800, current_volume: 11.0, status: 'loaded' },
  { id: 'ULD03', flight_id: '1', uld_type: 'AKE', position_code: 'C', max_weight: 1588, max_volume: 4.9, current_weight: 0, current_volume: 0, status: 'empty' },
  { id: 'ULD04', flight_id: '1', uld_type: 'PMC', position_code: 'D', max_weight: 4626, max_volume: 13.5, current_weight: 1500, current_volume: 6.0, status: 'loading' },
  { id: 'ULD05', flight_id: '1', uld_type: 'AKE', position_code: 'E', max_weight: 1588, max_volume: 4.9, current_weight: 0, current_volume: 0, status: 'empty' },
  { id: 'ULD06', flight_id: '1', uld_type: 'RKN', position_code: 'F', max_weight: 2500, max_volume: 6.5, current_weight: 0, current_volume: 0, status: 'empty' },
];

// Capacity Forecast
const forecasts = [];
for (let i = 1; i <= 14; i++) {
  const date = new Date('2026-03-15');
  date.setDate(date.getDate() + i);
  forecasts.push({
    id: i,
    flight_id: '1',
    forecast_date: date.toISOString().split('T')[0],
    forecast_horizon: i,
    predicted_weight: Math.floor(60000 + Math.random() * 25000),
    predicted_volume: Math.floor(150 + Math.random() * 60),
    confidence_level: (0.95 - i * 0.02).toFixed(2)
  });
}

// User (admin)
const users = [
  { id: '1', email: 'admin@cba.com', password: 'Admin@2026', first_name: 'System', last_name: 'Administrator', role: 'admin', department: 'IT' }
];

// ==================== API FUNCTIONS ====================

function sendJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  
  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }
  
  console.log(`${method} ${pathname}`);
  
  // ==================== AUTH ====================
  if (pathname === '/api/auth/login' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { email, password } = JSON.parse(body || '{}');
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        sendJSON(res, {
          user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role },
          accessToken: 'jwt-mock-token-' + Date.now()
        });
      } else {
        sendJSON(res, { message: 'Invalid credentials' }, 401);
      }
    });
    return;
  }
  
  // ==================== FLIGHTS ====================
  if (pathname === '/api/flights' && method === 'GET') {
    const { status, departure, arrival, dateFrom, dateTo } = parsedUrl.query;
    let result = [...flights];
    
    if (status) result = result.filter(f => f.status === status);
    if (departure) result = result.filter(f => f.departure_airport === departure);
    if (arrival) result = result.filter(f => f.arrival_airport === arrival);
    
    sendJSON(res, { data: result, meta: { total: result.length } });
    return;
  }
  
  if (pathname.match(/^\/api\/flights\/(\w+)$/) && method === 'GET') {
    const id = pathname.match(/^\/api\/flights\/(\w+)$/)[1];
    const flight = flights.find(f => f.id === id || f.flight_number === id);
    if (flight) {
      // Get bookings for this flight
      const flightBookings = bookings.filter(b => b.flight_id === flight.id);
      const ulds = uldPositions.filter(u => u.flight_id === flight.id);
      sendJSON(res, { ...flight, bookings: flightBookings, ulds: ulds });
    } else {
      sendJSON(res, { message: 'Flight not found' }, 404);
    }
    return;
  }
  
  if (pathname.match(/^\/api\/flights\/stats\/(\w+)$/) && method === 'GET') {
    const id = pathname.match(/^\/api\/flights\/stats\/(\w+)$/)[1];
    const flight = flights.find(f => f.id === id);
    if (flight) {
      sendJSON(res, {
        flightId: flight.id,
        flightNumber: flight.flight_number,
        flightDate: flight.flight_date,
        capacity: { weight: flight.capacity_weight, volume: flight.capacity_volume },
        booked: { weight: flight.booked_weight, volume: flight.booked_volume },
        utilization: {
          weight: ((flight.booked_weight / flight.capacity_weight) * 100).toFixed(1) + '%',
          volume: ((flight.booked_volume / flight.capacity_volume) * 100).toFixed(1) + '%'
        },
        revenue: {
          total: flight.total_revenue,
          cost: flight.total_revenue * 0.7,
          profit: flight.total_revenue * 0.3
        }
      });
    } else {
      sendJSON(res, { message: 'Flight not found' }, 404);
    }
    return;
  }
  
  // ==================== BOOKINGS ====================
  if (pathname === '/api/bookings' && method === 'GET') {
    const { flight_id, status } = parsedUrl.query;
    let result = [...bookings];
    
    if (flight_id) result = result.filter(b => b.flight_id === flight_id);
    if (status) result = result.filter(b => b.status === status);
    
    sendJSON(res, { data: result, meta: { total: result.length } });
    return;
  }
  
  if (pathname === '/api/bookings' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body || '{}');
      const newBooking = {
        id: String(bookings.length + 1),
        ...data,
        booking_date: new Date().toISOString().split('T')[0]
      };
      bookings.push(newBooking);
      sendJSON(res, newBooking, 201);
    });
    return;
  }
  
  // ==================== ULD TYPES ====================
  if (pathname === '/api/ulds/types' && method === 'GET') {
    sendJSON(res, { data: uldTypes });
    return;
  }
  
  if (pathname === '/api/ulds' && method === 'GET') {
    const { flight_id } = parsedUrl.query;
    let result = [...uldPositions];
    if (flight_id) result = result.filter(u => u.flight_id === flight_id);
    sendJSON(res, { data: result });
    return;
  }
  
  // ==================== CAPACITY FORECAST ====================
  if (pathname.match(/^\/api\/capacity\/forecast\/(\w+)$/) && method === 'GET') {
    const flightId = pathname.match(/^\/api\/capacity\/forecast\/(\w+)$/)[1];
    const flightForecasts = forecasts.filter(f => f.flight_id === flightId);
    sendJSON(res, { data: flightForecasts });
    return;
  }
  
  // ==================== AI DGR ====================
  if (pathname === '/api/ai/dgr/classify' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { description } = JSON.parse(body || '{}');
      const isDGR = /锂|电池|battery|chemical|explosive|flammable|gas|poison|corrosive/i.test(description);
      sendJSON(res, {
        input: description,
        is_dgr: isDGR,
        dgr_info: isDGR ? {
          un_number: 'UN3481',
          class: '9',
          name: 'Lithium Ion Battery',
          packing_instruction: '965'
        } : null,
        confidence: 0.95,
        processing_time_ms: 45
      });
    });
    return;
  }
  
  // ==================== HEALTH ====================
  if (pathname === '/health' || pathname === '/api/health') {
    sendJSON(res, { status: 'healthy', timestamp: new Date().toISOString() });
    return;
  }
  
  // 404
  sendJSON(res, { message: 'API endpoint not found' }, 404);
}

// Start server
http.createServer(handleRequest).listen(PORT, () => {
  console.log(`🚀 CBA API Server running on http://localhost:${PORT}`);
  console.log(`📚 Endpoints:`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/flights`);
  console.log(`   GET  /api/flights/:id`);
  console.log(`   GET  /api/flights/stats/:id`);
  console.log(`   GET  /api/bookings`);
  console.log(`   POST /api/bookings`);
  console.log(`   GET  /api/ulds/types`);
  console.log(`   GET  /api/ulds`);
  console.log(`   GET  /api/capacity/forecast/:flightId`);
  console.log(`   POST /api/ai/dgr/classify`);
});
