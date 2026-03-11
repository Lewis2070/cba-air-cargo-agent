"""
CBA Air Cargo AI Service
FastAPI Application
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sys
import os

# Add models path
sys.path.append(os.path.join(os.path.dirname(__file__), 'models'))

app = FastAPI(
    title="CBA AI Service",
    description="CBA International Air Cargo AI Capabilities",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================
# DGR Classification
# =====================

class DGRClassifyRequest(BaseModel):
    description: str
    flight_id: Optional[str] = None

class DGRCheckRequest(BaseModel):
    goods_description: str
    flight_id: Optional[str] = None

@app.post("/api/ai/dgr/classify")
async def classify_dgr(request: DGRClassifyRequest):
    """Classify goods for DGR (Dangerous Goods Regulation)"""
    try:
        from nlp.dgr_classifier import DGRClassifier
        classifier = DGRClassifier()
        classifier.load_model()
        result = classifier.classify(request.description)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/dgr/check")
async def check_dgr(request: DGRCheckRequest):
    """Full DGR compliance check"""
    try:
        from nlp.dgr_classifier import DGRClassifier
        classifier = DGRClassifier()
        classifier.load_model()
        
        # Classify
        result = classifier.classify(request.goods_description)
        
        # Check compliance
        flight_info = {'has_dgr': False, 'dgr_list': []}
        compliance = classifier.check_compliance(result, flight_info)
        
        # Generate report
        report = classifier.generate_report(result, compliance)
        
        return {
            'classification': result,
            'compliance': compliance,
            'report': report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =====================
# Capacity Forecast
# =====================

class ForecastRequest(BaseModel):
    flight_number: str
    forecast_days: int = 14

@app.post("/api/ai/capacity/forecast")
async def forecast_capacity(request: ForecastRequest):
    """Forecast capacity demand"""
    try:
        from forecasting.capacity_forecast import CapacityForecastModel
        model = CapacityForecastModel()
        model.train()
        forecasts = model.forecast(request.flight_number, request.forecast_days)
        alerts = model.generate_alerts(forecasts)
        return {
            'forecasts': forecasts,
            'alerts': alerts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =====================
# Load Planning
# =====================

class CargoItem(BaseModel):
    id: str
    weight: float
    volume: float
    priority: int = 3
    is_dgr: bool = False

class LoadPlanRequest(BaseModel):
    flight_id: str
    cargo_list: List[CargoItem]

@app.post("/api/ai/optimize/load")
async def optimize_load(request: LoadPlanRequest):
    """Optimize load planning"""
    try:
        from optimization.load_planner import LoadPlanningOptimizer
        optimizer = LoadPlanningOptimizer()
        
        # Convert to cargo objects
        from dataclasses import asdict
        cargo_list = [asdict(c) for c in request.cargo_list]
        
        # Get ULD positions
        uld_positions = optimizer.get_uld_positions('B777')
        
        # Run optimization
        solution = optimizer.optimize(cargo_list, uld_positions)
        
        # Validate
        validation = optimizer.validate_solution()
        
        # Get 3D data
        scene_data = optimizer.generate_3d_data()
        
        return {
            'solution': solution,
            'validation': validation,
            'scene_3d': scene_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =====================
# Bid Price
# =====================

class BookingRequest(BaseModel):
    customer_id: str
    weight: float
    volume: float
    requested_price: float

class BidPriceRequest(BaseModel):
    flight_id: str
    booking: BookingRequest

@app.post("/api/ai/revenue/bid-price")
async def calculate_bid_price(request: BidPriceRequest):
    """Calculate bid price for booking"""
    try:
        from revenue.bid_price_engine import BidPriceEngine, FlightInfo
        from datetime import datetime, timedelta
        
        engine = BidPriceEngine()
        
        # Mock flight data
        flight = FlightInfo(
            flight_number='CA1001',
            flight_date=datetime.now() + timedelta(days=3),
            departure='PVG',
            arrival='LAX',
            aircraft_type='B777',
            capacity_weight=80000,
            capacity_volume=200,
            booked_weight=65000,
            booked_volume=160,
            booked_revenue=900000,
            remaining_weight=15000,
            remaining_volume=40,
            remaining_seats=0
        )
        
        result = engine.calculate_bid_price(flight, request.booking)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =====================
# Post-Flight Analysis
# =====================

@app.get("/api/ai/analysis/{flight_id}")
async def analyze_flight(flight_id: str):
    """Generate post-flight analysis"""
    try:
        from analytics.post_flight_analyzer import PostFlightAnalyzer, FlightData
        from datetime import datetime, timedelta
        
        analyzer = PostFlightAnalyzer()
        
        # Mock flight data
        flight = FlightData(
            flight_number='CA1001',
            flight_date=datetime.now(),
            departure='PVG',
            arrival='LAX',
            revenue=850000,
            cost=680000,
            profit=170000,
            capacity_weight=80000,
            booked_weight=68000,
            capacity_volume=200,
            booked_volume=165,
            on_time_rate=0.94,
            incidents=[],
            avg_rate=12.5,
            competitor_rate=13.2,
            demand_level='HIGH'
        )
        
        analysis = analyzer.analyze(flight)
        report = analyzer.generate_report(analysis)
        
        return {
            'analysis': analysis,
            'report': report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =====================
# Health Check
# =====================

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "cba-ai-service"}

@app.get("/")
async def root():
    return {
        "service": "CBA AI Service",
        "version": "1.0.0",
        "endpoints": [
            "/api/ai/dgr/classify",
            "/api/ai/dgr/check",
            "/api/ai/capacity/forecast",
            "/api/ai/optimize/load",
            "/api/ai/revenue/bid-price",
            "/api/ai/analysis/{flight_id}"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
