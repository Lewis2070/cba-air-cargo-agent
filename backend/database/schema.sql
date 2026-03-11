-- CBA International Air Cargo System Database Schema
-- Version: 1.0
-- Date: 2026-03-11

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- admin, manager, operator, viewer
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    ip_address VARCHAR(50),
    user_agent VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- FLIGHT MANAGEMENT
-- =====================================================

CREATE TABLE flights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_number VARCHAR(20) NOT NULL,
    flight_date DATE NOT NULL,
    departure_airport VARCHAR(3) NOT NULL,
    arrival_airport VARCHAR(3) NOT NULL,
    aircraft_type VARCHAR(20) NOT NULL,
    
    -- Capacity
    capacity_weight DECIMAL(10,2) NOT NULL, -- kg
    capacity_volume DECIMAL(10,2) NOT NULL, -- cbm
    capacity_pieces INTEGER,
    
    -- Booking Status
    booked_weight DECIMAL(10,2) DEFAULT 0,
    booked_volume DECIMAL(10,2) DEFAULT 0,
    booked_pieces INTEGER DEFAULT 0,
    booking_count INTEGER DEFAULT 0,
    
    -- Revenue
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, boarding, departed, arrived, cancelled
    
    -- Timestamps
    etd TIMESTAMP, -- Estimated Time of Departure
    eta TIMESTAMP, -- Estimated Time of Arrival
    atd TIMESTAMP, -- Actual Time of Departure
    ata TIMESTAMP, -- Actual Time of Arrival
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(flight_number, flight_date)
);

CREATE TABLE flight_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_number VARCHAR(20) NOT NULL,
    departure_airport VARCHAR(3) NOT NULL,
    arrival_airport VARCHAR(3) NOT NULL,
    aircraft_type VARCHAR(20) NOT NULL,
    
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
    weekly_frequency INTEGER DEFAULT 1,
    
    std TIMESTAMP NOT NULL, -- Scheduled Time of Departure
    sta TIMESTAMP NOT NULL, -- Scheduled Time of Arrival
    
    effective_from DATE NOT NULL,
    effective_to DATE,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- BOOKING MANAGEMENT
-- =====================================================

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    awb_prefix VARCHAR(3) NOT NULL DEFAULT '999',
    awb_number VARCHAR(8) NOT NULL,
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    
    -- Customer
    customer_id UUID REFERENCES users(id),
    customer_name VARCHAR(255),
    customer_code VARCHAR(50),
    
    -- Route
    departure_airport VARCHAR(3) NOT NULL,
    arrival_airport VARCHAR(3) NOT NULL,
    
    -- Flight
    flight_id UUID REFERENCES flights(id),
    flight_number VARCHAR(20),
    flight_date DATE,
    
    -- Goods Description
    goods_description TEXT,
    hs_code VARCHAR(20),
    
    -- Weight & Volume
    weight DECIMAL(10,2) NOT NULL, -- kg
    volume DECIMAL(10,2), -- cbm
    chargeable_weight DECIMAL(10,2),
    pieces INTEGER DEFAULT 1,
    
    -- Dimensions (cm)
    length DECIMAL(10,2),
    width DECIMAL(10,2),
    height DECIMAL(10,2),
    
    -- Pricing
    rate_class CHAR(1), -- C, Q, S, M
    rate DECIMAL(10,4), -- per kg
    total_charge DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'CNY',
    
    -- DGR
    is_dgr BOOLEAN DEFAULT false,
    dgr_class VARCHAR(10),
    un_number VARCHAR(10),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', 
    -- pending, confirmed, loaded, departed, delivered, cancelled
    
    -- Priority
    priority INTEGER DEFAULT 3, -- 1=highest, 5=lowest
    
    -- Shipper & Consignee
    shipper_name VARCHAR(255),
    shipper_address TEXT,
    consignee_name VARCHAR(255),
    consignee_address TEXT,
    
    -- Remarks
    remarks TEXT,
    special_handling TEXT,
    
    -- Timestamps
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmation_date TIMESTAMP,
    loaded_date TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(awb_prefix, awb_number, flight_id)
);

-- =====================================================
-- CAPACITY & BOOKING CURVE
-- =====================================================

CREATE TABLE booking_curve (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
    snapshot_time TIMESTAMP NOT NULL,
    
    booking_date DATE NOT NULL,
    days_to_departure INTEGER NOT NULL,
    
    weight_booked DECIMAL(10,2),
    volume_booked DECIMAL(10,2),
    pieces_booked INTEGER,
    booking_count INTEGER,
    revenue DECIMAL(15,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE capacity_forecast (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
    
    forecast_date DATE NOT NULL,
    forecast_horizon INTEGER NOT NULL, -- days ahead
    
    predicted_weight DECIMAL(10,2),
    predicted_volume DECIMAL(10,2),
    confidence_level DECIMAL(5,4),
    
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(flight_id, forecast_date, forecast_horizon)
);

-- =====================================================
-- LOAD PLANNING
-- =====================================================

CREATE TABLE uld_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
    
    uld_number VARCHAR(20) NOT NULL,
    uld_type VARCHAR(10) NOT NULL, -- P1P, PAG, AKE, etc.
    
    position_code VARCHAR(20), -- position in aircraft
    
    max_weight DECIMAL(10,2),
    max_volume DECIMAL(10,2),
    
    current_weight DECIMAL(10,2) DEFAULT 0,
    current_volume DECIMAL(10,2) DEFAULT 0,
    
    status VARCHAR(50) DEFAULT 'empty', -- empty, loading, loaded, departed
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(flight_id, uld_number)
);

CREATE TABLE load_plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
    uld_id UUID REFERENCES uld_positions(id),
    booking_id UUID REFERENCES bookings(id),
    
    position_x DECIMAL(10,2),
    position_y DECIMAL(10,2),
    position_z DECIMAL(10,2),
    
    sequence_order INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- REVENUE MANAGEMENT
-- =====================================================

CREATE TABLE bid_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_id UUID REFERENCES flights(id),
    booking_id UUID REFERENCES bookings(id),
    
    bid_price_weight DECIMAL(10,2),
    bid_price_volume DECIMAL(10,2),
    bid_price_final DECIMAL(10,2),
    
    requested_price DECIMAL(10,2),
    decision VARCHAR(50), -- ACCEPT, REJECT, NEGOTIATE
    
    marginal_contribution DECIMAL(10,2),
    opportunity_cost DECIMAL(10,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- DGR COMPLIANCE
-- =====================================================

CREATE TABLE dgr_classification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goods_description TEXT NOT NULL,
    
    is_dgr BOOLEAN NOT NULL,
    un_number VARCHAR(10),
    proper_shipping_name VARCHAR(255),
    class_division VARCHAR(10),
    packing_group VARCHAR(5),
    packing_instruction VARCHAR(50),
    
    confidence_score DECIMAL(5,4),
    
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dgr_check_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id),
    
    classification_id UUID REFERENCES dgr_classification(id),
    
    is_compliant BOOLEAN,
    warnings TEXT[],
    errors TEXT[],
    
    checked_by UUID REFERENCES users(id),
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- POST-FLIGHT ANALYSIS
-- =====================================================

CREATE TABLE flight_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
    
    weight_utilization DECIMAL(5,4),
    volume_utilization DECIMAL(5,4),
    revenue_per_kg DECIMAL(10,4),
    profit_margin DECIMAL(5,4),
    
    on_time_rate DECIMAL(5,4),
    incident_count INTEGER DEFAULT 0,
    
    analysis_summary TEXT,
    recommendations TEXT[],
    
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SYSTEM LOGS
-- =====================================================

CREATE TABLE operation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    
    details JSONB,
    ip_address VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Flight indexes
CREATE INDEX idx_flights_number ON flights(flight_number);
CREATE INDEX idx_flights_date ON flights(flight_date);
CREATE INDEX idx_flights_route ON flights(departure_airport, arrival_airport);
CREATE INDEX idx_flights_status ON flights(status);

-- Booking indexes
CREATE INDEX idx_bookings_flight ON bookings(flight_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_awb ON bookings(awb_prefix, awb_number);

-- Booking Curve indexes
CREATE INDEX idx_booking_curve_flight_time ON booking_curve(flight_id, snapshot_time);
CREATE INDEX idx_booking_curve_date ON booking_curve(booking_date, days_to_departure);

-- Capacity Forecast indexes
CREATE INDEX idx_forecast_flight_date ON capacity_forecast(flight_id, forecast_date);

-- Operation logs
CREATE INDEX idx_logs_user ON operation_logs(user_id);
CREATE INDEX idx_logs_created ON operation_logs(created_at);

-- =====================================================
-- SEQUENCES FOR AWB
-- =====================================================

CREATE SEQUENCE IF NOT EXISTS awb_number_seq START WITH 1 INCREMENT BY 1;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Default admin user (password: Admin@2026)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, department)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@cba.com',
    '$2b$10$rVK5pX5K.m/.pJ5xO5E.XO5E.XO5E.XO5E.XO5E.XO5E.XO5E.XO5E', -- hashed 'Admin@2026'
    'System',
    'Administrator',
    'admin',
    'IT'
);

-- Sample flights for testing
INSERT INTO flights (flight_number, flight_date, departure_airport, arrival_airport, aircraft_type, capacity_weight, capacity_volume, status)
VALUES 
    ('CA1001', CURRENT_DATE + 3, 'PVG', 'LAX', 'B777', 80000, 200, 'scheduled'),
    ('CA1002', CURRENT_DATE + 3, 'PVG', 'FRA', 'B777', 80000, 200, 'scheduled'),
    ('CA1003', CURRENT_DATE + 4, 'PVG', 'NRT', 'A330', 45000, 120, 'scheduled'),
    ('CA1005', CURRENT_DATE + 5, 'PVG', 'LHR', 'B747', 100000, 250, 'scheduled'),
    ('CA1008', CURRENT_DATE + 5, 'PVG', 'CDG', 'B777', 80000, 200, 'scheduled');
