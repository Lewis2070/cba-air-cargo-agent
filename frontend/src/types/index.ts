// ============================================================
// CBA Air Cargo — Global TypeScript Types
// ============================================================

// ---------- Aircraft & ULD ----------

export interface CGLimits {
  min_pct: number;
  max_pct: number;
}

export interface AircraftPosition {
  code: string;           // e.g. "A", "C", "L1"
  label_cn: string;       // 中文标签
  label_en: string;       // 英文标签
  deck: 'main' | 'lower' | 'nose';
  row: 'forward' | 'mid' | 'aft';
  arm_m: number;          // 力臂(m)
  max_weight_kg: number;
  allowed_uld: string[];  // 允许的ULD类型
  has_tie_down: boolean;
  cargo_type: 'general' | 'refrigerated';
  refrigerated?: boolean;
  esd?: boolean;          // Electrostatic Discharger
}

export interface AircraftConfig {
  name_cn: string;
  name_en: string;
  iata_code: string;
  max_payweight_kg: number;
  max_volume_m3: number;
  mac_m: number;
  mac_leading_edge_m: number;
  cg_limits: {
    takeoff: CGLimits;
    landing: CGLimits;
  };
  positions: {
    main: AircraftPosition[];
    lower: AircraftPosition[];
    nose?: AircraftPosition[]; // B747-400F has nose cargo
  };
}

export interface UldSpec {
  name: string;
  uld_class: string;
  max_weight_kg: number;
  max_volume_m3: number;
  inner_length_cm: number;
  inner_width_cm: number;
  inner_height_cm: number;
  tare_weight_kg: number;
  container_type?: string;
  refrigerated?: boolean;
  temp_range_c?: string;
}

// ---------- Cargo & Booking ----------

export interface CargoItem {
  id: string;
  awb: string;              // AWB编号 e.g. "999-12345678"
  customer: string;
  customer_code: string;
  weight_kg: number;        // 实际毛重
  volume_m3: number;        // 体积(m³)
  pieces: number;           // 件数
  length_cm?: number;        // 货物长
  width_cm?: number;        // 货物宽
  height_cm?: number;       // 货物高
  goods_description: string;
  is_dgr: boolean;
  dgr_class?: string;       // e.g. "9" | "3" | "2.1"
  un_number?: string;      // e.g. "UN3481"
  dgr_name?: string;
  rate_class: string;
  total_charge: number;
  booking_date: string;
  flight_id: string;
  status: BookingStatus;
  priority?: number;        // 1-5, 5=最高
  destination?: string;
  cargo_type?: 'general' | 'refrigerated' | 'valuable' | 'live_animal';
}

export type BookingStatus = 'pending' | 'confirmed' | 'loaded' | 'cancelled';

// ---------- ULD (Built-up Pallet/Container) ----------

export interface BuiltUld {
  id: string;               // 系统生成ULD ID
  uld_type: UldType;        // P1P | PAG | AKE | PMC | RKN | AVP
  cargo_items: CargoItem[]; // 装载的货物
  total_weight_kg: number;  // 总毛重
  total_volume_m3: number;  // 总体积
  billable_weight_kg: number; // 计费重
  status: 'building' | 'ready' | 'loaded' | 'flying';
  built_at?: string;
}

export type UldType = 'P1P' | 'PAG' | 'PMC' | 'AKE' | 'AVP' | 'RKN';

// ---------- Hold Layout ----------

export type HoldPhase = 'takeoff' | 'landing';

export interface UldPlacement {
  uld: BuiltUld;
  position_code: string;    // e.g. "A", "C", "L2"
  position: AircraftPosition;
}

export interface CGResult {
  cgPosition_m: number;     // 重心位置 (m)
  cgIndex_pct: number;     // 重心指数 (%)
  totalWeight_kg: number;
  totalMoment_kgm: number;  // 总力矩 (kg·m)
  totalVolume_m3: number;
  volumeUtil_pct: number;
  isInLimits: boolean;
  isWarning: boolean;       // 接近极限
  limitMin_pct: number;
  limitMax_pct: number;
  advice: string;          // 调整建议
  phase: HoldPhase;
}

// ---------- Validation ----------

export interface ValidationError {
  type: 'DGR' | 'DIMENSION' | 'WEIGHT' | 'HEIGHT' | 'VOLUME' | 'ULD_TYPE';
  cargo?: string;
  message: string;
}

export interface ValidationWarning {
  type: 'LOW_UTIL' | 'DGR_ADJACENT' | 'ESD' | 'OVERWEIGHT_POS';
  message: string;
}

export interface UldValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: {
    totalWeight_kg: number;
    totalVolume_m3: number;
    volumeUtil_pct: number;
    pieceCount: number;
    dgrClasses: string[];
  };
}

// ---------- Load Plan ----------

export interface LoadPlan {
  id: string;
  flight_id: string;
  aircraft_type: string;
  placements: UldPlacement[];
  cg_result: CGResult;
  totalBillableWeight_kg: number;
  weightUtil_pct: number;
  volumeUtil_pct: number;
  revenue_estimate: number;
  created_at: string;
  created_by: string;
  status: 'draft' | 'submitted' | 'approved' | 'locked';
}

// ---------- API Response ----------

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page?: number;
    pageSize?: number;
  };
  message?: string;
}

export interface Flight {
  id: string;
  flight_number: string;
  flight_date: string;
  departure_airport: string;
  arrival_airport: string;
  aircraft_type: AircraftType;
  capacity_weight: number;
  capacity_volume: number;
  booked_weight: number;
  booked_volume: number;
  total_revenue: number;
  status: FlightStatus;
  etd: string;
  eta: string;
}

export type AircraftType = 'B777-300ER' | 'B747-400F' | 'A330-300' | 'A330-200';
export type FlightStatus = 'scheduled' | 'boarding' | 'closed' | 'departed' | 'arrived' | 'cancelled';
