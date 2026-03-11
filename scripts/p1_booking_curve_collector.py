"""
P1-M1.2: Booking Curve 数据采集系统
========================
功能：每日定时采集航班订舱数据，构建时序数据库
"""

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime, timedelta
import json
import logging
from typing import List, Dict, Any
import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'cba_air_cargo',
    'user': 'cba_user',
    'password': 'cba_pass'
}

class BookingCurveCollector:
    """Booking Curve 数据采集器"""
    
    def __init__(self):
        self.conn = None
        self.connect()
    
    def connect(self):
        """连接数据库"""
        try:
            self.conn = psycopg2.connect(**DB_CONFIG)
            logger.info("数据库连接成功")
        except Exception as e:
            logger.error(f"数据库连接失败: {e}")
            # 创建演示数据用于开发
            self.conn = None
    
    def create_tables(self):
        """创建数据表"""
        if not self.conn:
            logger.warning("无数据库连接，跳过建表")
            return
        
        cursor = self.conn.cursor()
        
        # 1. 航班基础信息表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS flights (
                id SERIAL PRIMARY KEY,
                flight_number VARCHAR(20) NOT NULL,
                flight_date DATE NOT NULL,
                departure VARCHAR(3) NOT NULL,
                arrival VARCHAR(3) NOT NULL,
                aircraft_type VARCHAR(10),
                capacity_weight DECIMAL(10,2),
                capacity_volume DECIMAL(10,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(flight_number, flight_date)
            )
        """)
        
        # 2. Booking Curve 时序数据表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS booking_curve (
                id SERIAL PRIMARY KEY,
                flight_id INTEGER REFERENCES flights(id),
                snapshot_time TIMESTAMP NOT NULL,
                booking_date DATE NOT NULL,
                days_to_departure INTEGER NOT NULL,
                weight_booked DECIMAL(10,2),
                volume_booked DECIMAL(10,2),
                pieces_booked INTEGER,
                booking_count INTEGER,
                revenue DECIMAL(15,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 3. 创建索引
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_booking_curve_flight 
            ON booking_curve(flight_id, snapshot_time)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_booking_curve_date 
            ON booking_curve(booking_date, days_to_departure)
        """)
        
        self.conn.commit()
        logger.info("数据表创建完成")
        cursor.close()
    
    def generate_demo_data(self, days: int = 30) -> pd.DataFrame:
        """生成演示数据"""
        import numpy as np
        
        # 生成航班数据
        flights = []
        flight_numbers = ['CA1001', 'CA1002', 'CA1003', 'CA1005', 'CA1008']
        airports = ['PVG', 'LAX', 'FRA', 'NRT', 'LHR', 'CDG', 'ORD', 'ICN']
        
        base_date = datetime.now().date()
        
        for day_offset in range(days):
            flight_date = base_date + timedelta(days=day_offset)
            
            for flight_num in flight_numbers:
                dep = np.random.choice(airports)
                arr = np.random.choice([a for a in airports if a != dep])
                
                flights.append({
                    'flight_number': flight_num,
                    'flight_date': flight_date,
                    'departure': dep,
                    'arrival': arr,
                    'aircraft_type': np.random.choice(['B777', 'B747', 'A330', 'B787']),
                    'capacity_weight': np.random.uniform(40000, 100000),
                    'capacity_volume': np.random.uniform(100, 200)
                })
        
        return pd.DataFrame(flights)
    
    def generate_booking_curve(self, flights_df: pd.DataFrame) -> pd.DataFrame:
        """生成Booking Curve时序数据"""
        import numpy as np
        
        records = []
        
        for _, flight in flights_df.iterrows():
            flight_date = flight['flight_date']
            capacity = flight['capacity_weight']
            
            # 模拟不同提前天数的订舱曲线
            for days_before in range(30, -1, -1):
                booking_date = flight_date - timedelta(days=days_before)
                
                if booking_date > datetime.now().date():
                    continue
                
                # S型曲线模拟订舱增长
                progress = (30 - days_before) / 30
                base_weight = capacity * (1 / (1 + np.exp(-10 * (progress - 0.5))))
                noise = np.random.normal(0, capacity * 0.05)
                weight = max(0, base_weight + noise)
                
                # 随机因素调整
                if np.random.random() < 0.1:
                    weight *= np.random.uniform(0.7, 0.9)  # 大货取消
                
                records.append({
                    'flight_number': flight['flight_number'],
                    'flight_date': flight_date,
                    'snapshot_time': datetime.now(),
                    'booking_date': booking_date,
                    'days_to_departure': days_before,
                    'weight_booked': round(weight, 2),
                    'volume_booked': round(weight * np.random.uniform(0.002, 0.003), 2),
                    'pieces_booked': int(weight / np.random.uniform(10, 50)),
                    'booking_count': int(weight / np.random.uniform(500, 2000)),
                    'revenue': round(weight * np.random.uniform(5, 15), 2)
                })
        
        return pd.DataFrame(records)
    
    def save_to_database(self, flights_df: pd.DataFrame, booking_df: pd.DataFrame):
        """保存到数据库"""
        if not self.conn:
            logger.warning("无数据库连接，跳过保存")
            # 保存为CSV
            flights_df.to_csv('/workspace/CBA_System/data/flights_demo.csv', index=False)
            booking_df.to_csv('/workspace/CBA_System/data/booking_curve_demo.csv', index=False)
            logger.info("演示数据已保存为CSV")
            return
        
        cursor = self.conn.cursor()
        
        # 插入航班数据
        flight_values = [
            (f['flight_number'], f['flight_date'], f['departure'], f['arrival'],
             f['aircraft_type'], f['capacity_weight'], f['capacity_volume'])
            for _, f in flights_df.iterrows()
        ]
        
        execute_values(
            cursor,
            """INSERT INTO flights (flight_number, flight_date, departure, arrival, 
               aircraft_type, capacity_weight, capacity_volume)
               VALUES %s ON CONFLICT (flight_number, flight_date) DO NOTHING""",
            flight_values
        )
        
        self.conn.commit()
        
        # 获取flight_id映射
        cursor.execute("SELECT id, flight_number, flight_date FROM flights")
        flight_map = {(f[1], f[2]): f[0] for f in cursor.fetchall()}
        
        # 插入Booking Curve数据
        booking_values = []
        for _, b in booking_df.iterrows():
            flight_id = flight_map.get((b['flight_number'], b['flight_date']))
            if flight_id:
                booking_values.append((
                    flight_id, b['snapshot_time'], b['booking_date'],
                    b['days_to_departure'], b['weight_booked'], b['volume_booked'],
                    b['pieces_booked'], b['booking_count'], b['revenue']
                ))
        
        if booking_values:
            execute_values(
                cursor,
                """INSERT INTO booking_curve 
                   (flight_id, snapshot_time, booking_date, days_to_departure,
                    weight_booked, volume_booked, pieces_booked, booking_count, revenue)
                   VALUES %s""",
                booking_values
            )
        
        self.conn.commit()
        cursor.close()
        logger.info(f"已保存 {len(flights_df)} 条航班, {len(booking_df)} 条订舱记录")
    
    def run_daily_collection(self):
        """执行每日采集"""
        logger.info("=== 开始每日Booking Curve数据采集 ===")
        
        # 生成30天航班数据
        flights_df = self.generate_demo_data(days=30)
        
        # 生成订舱曲线
        booking_df = self.generate_booking_curve(flights_df)
        
        # 保存
        self.save_to_database(flights_df, booking_df)
        
        logger.info(f"=== 数据采集完成: {len(flights_df)} 航班, {len(booking_df)} 记录 ===")
        
        return flights_df, booking_df


def main():
    collector = BookingCurveCollector()
    collector.create_tables()
    flights, bookings = collector.run_daily_collection()
    
    print(f"\n航班数据预览:\n{flights.head()}")
    print(f"\n订舱曲线数据预览:\n{bookings.head()}")
    print(f"\n总记录数: {len(bookings)}")


if __name__ == '__main__':
    main()
