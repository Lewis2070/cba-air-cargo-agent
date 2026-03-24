const http = require('http');
const url = require('url');

const flights = [
  { id:'1', flight_number:'CA1001', flight_date:'2026-03-23', departure_airport:'PVG', arrival_airport:'LAX', aircraft_type:'B777-300ER', capacity_weight:80000, capacity_volume:200, booked_weight:68200, booked_volume:172, total_revenue:1158000, status:'scheduled', etd:'23:55', eta:'19:30' },
  { id:'2', flight_number:'CA1002', flight_date:'2026-03-23', departure_airport:'PVG', arrival_airport:'FRA', aircraft_type:'B747-400F', capacity_weight:100000, capacity_volume:250, booked_weight:72500, booked_volume:185, total_revenue:1280000, status:'scheduled', etd:'14:30', eta:'06:45' },
  { id:'3', flight_number:'CA1003', flight_date:'2026-03-24', departure_airport:'PVG', arrival_airport:'NRT', aircraft_type:'A330-300', capacity_weight:45000, capacity_volume:120, booked_weight:38700, booked_volume:108, total_revenue:684000, status:'scheduled', etd:'08:00', eta:'13:20' },
  { id:'4', flight_number:'CA1005', flight_date:'2026-03-24', departure_airport:'PVG', arrival_airport:'LHR', aircraft_type:'B747-400F', capacity_weight:100000, capacity_volume:250, booked_weight:91800, booked_volume:228, total_revenue:1620000, status:'boarding', etd:'11:00', eta:'17:30' },
  { id:'5', flight_number:'CA1008', flight_date:'2026-03-25', departure_airport:'PVG', arrival_airport:'CDG', aircraft_type:'B777-300ER', capacity_weight:80000, capacity_volume:200, booked_weight:52400, booked_volume:138, total_revenue:892000, status:'scheduled', etd:'09:30', eta:'16:45' },
  { id:'6', flight_number:'CA1010', flight_date:'2026-03-25', departure_airport:'PVG', arrival_airport:'JFK', aircraft_type:'B777-300ER', capacity_weight:80000, capacity_volume:200, booked_weight:75600, booked_volume:189, total_revenue:1340000, status:'scheduled', etd:'13:00', eta:'14:00' },
  { id:'7', flight_number:'CA1012', flight_date:'2026-03-26', departure_airport:'PVG', arrival_airport:'ORD', aircraft_type:'B777-300ER', capacity_weight:80000, capacity_volume:200, booked_weight:41200, booked_volume:112, total_revenue:720000, status:'scheduled', etd:'07:00', eta:'09:30' },
  { id:'8', flight_number:'CA1015', flight_date:'2026-03-26', departure_airport:'PVG', arrival_airport:'SIN', aircraft_type:'A330-300', capacity_weight:45000, capacity_volume:120, booked_weight:31500, booked_volume:82, total_revenue:540000, status:'scheduled', etd:'16:00', eta:'21:30' },
];

const bookings = [
  { id:'B001', awb:'999-12345678', customer:'ABC Trading Co', weight_kg:450, volume_m3:1.8, pieces:3, length_cm:80, width_cm:60, height_cm:40, goods_description:'电子元器件', is_dgr:false, status:'confirmed', flight_id:'1', destination:'LAX' },
  { id:'B002', awb:'999-12345679', customer:'XYZ Logistics', weight_kg:320, volume_m3:1.2, pieces:2, length_cm:60, width_cm:50, height_cm:40, goods_description:'汽车配件', is_dgr:false, status:'confirmed', flight_id:'1', destination:'LAX' },
  { id:'B003', awb:'999-12345680', customer:'Tech Industries', weight_kg:1800, volume_m3:6.5, pieces:15, length_cm:120, width_cm:100, height_cm:55, goods_description:'机械设备零件', is_dgr:false, status:'loaded', flight_id:'1', destination:'LAX' },
  { id:'B004', awb:'999-12345681', customer:'Global Exports', weight_kg:560, volume_m3:2.2, pieces:5, length_cm:100, width_cm:80, height_cm:28, goods_description:'纺织品', is_dgr:false, status:'confirmed', flight_id:'2', destination:'FRA' },
  { id:'B005', awb:'999-12345682', customer:'Pacific Trading', weight_kg:250, volume_m3:1.0, pieces:2, length_cm:50, width_cm:40, height_cm:50, goods_description:'陶瓷制品', is_dgr:false, status:'confirmed', flight_id:'2', destination:'FRA' },
  { id:'B006', awb:'999-12345683', customer:'Euro Cargo GmbH', weight_kg:3200, volume_m3:12.0, pieces:20, length_cm:200, width_cm:120, height_cm:50, goods_description:'医疗设备', is_dgr:false, status:'confirmed', flight_id:'3', destination:'NRT' },
  { id:'B007', awb:'999-12345684', customer:'Shanghai Electronics', weight_kg:50, volume_m3:0.2, pieces:1, length_cm:30, width_cm:25, height_cm:30, goods_description:'锂电池(UN3481)', is_dgr:true, dgr_class:'9', un_number:'UN3481', dgr_name:'锂离子电池', status:'confirmed', flight_id:'4', destination:'LHR' },
  { id:'B008', awb:'999-12345685', customer:'American Imports', weight_kg:890, volume_m3:3.5, pieces:8, length_cm:110, width_cm:70, height_cm:45, goods_description:'药品', is_dgr:false, status:'confirmed', flight_id:'5', destination:'CDG' },
];

const users = [
  { id:'1', email:'admin@cba.com', password:'Admin@2026', firstName:'张伟', lastName:'Admin', role:'admin' },
];

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { resolve({}); } });
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  try {
    if (pathname === '/api/health') {
      res.writeHead(200, {'Content-Type':'application/json'});
      res.end(JSON.stringify({ status:'ok', timestamp: new Date().toISOString() }));
    } else if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await parseBody(req);
      const user = users.find(u => u.email === body.email && u.password === body.password);
      if (user) {
        const { password, ...safeUser } = user;
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ accessToken:'mock_jwt_token_'+Date.now(), user:safeUser }));
      } else {
        res.writeHead(401, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ message:'Invalid credentials' }));
      }
    } else if (pathname === '/api/flights' && req.method === 'GET') {
      let result = [...flights];
      if (query.departure) result = result.filter(f => f.flight_number.includes(query.departure));
      if (query.status) result = result.filter(f => f.status === query.status);
      res.writeHead(200, {'Content-Type':'application/json'});
      res.end(JSON.stringify({ data: result, meta: { total: result.length } }));
    } else if (pathname === '/api/bookings' && req.method === 'GET') {
      res.writeHead(200, {'Content-Type':'application/json'});
      res.end(JSON.stringify({ data: bookings, meta: { total: bookings.length } }));
    } else if (pathname === '/api/bookings' && req.method === 'POST') {
      const body = await parseBody(req);
      const newBooking = { id:'B'+Date.now(), ...body, status:'pending' };
      bookings.push(newBooking);
      res.writeHead(201, {'Content-Type':'application/json'});
      res.end(JSON.stringify({ data: newBooking }));
    } else if (pathname === '/api/ulds/types') {
      res.writeHead(200, {'Content-Type':'application/json'});
      res.end(JSON.stringify({ data: ['P1P','PAG','PMC','AKE','AVP','RKN'] }));
    } else {
      res.writeHead(404, {'Content-Type':'application/json'});
      res.end(JSON.stringify({ message:'Not Found' }));
    }
  } catch (e) {
    res.writeHead(500, {'Content-Type':'application/json'});
    res.end(JSON.stringify({ message: e.message }));
  }
});

server.listen(3000, '0.0.0.0', () => {
  console.log('CBA API Server running on :3000');
});
