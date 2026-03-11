"""
P2-M2.3: 收益管理系统 - Bid Price引擎
====================================
功能：双维度Bid Price计算 + 动态定价 + 超订策略
"""

import json
import logging
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import random
import math

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class BookingRequest:
    """订舱请求"""
    customer_id: str
    origin: str
    destination: str
    weight: float
    volume: float
    pieces: int
    goods_value: float
    requested_price: float
    booking_class: str     # C, Q, S, M 等

@dataclass
class FlightInfo:
    """航班信息"""
    flight_number: str
    flight_date: datetime
    departure: str
    arrival: str
    aircraft_type: str
    capacity_weight: float
    capacity_volume: float
    booked_weight: float
    booked_volume: float
    booked_revenue: float
    remaining_weight: float
    remaining_volume: float
    remaining_seats: int


class BidPriceEngine:
    """Bid Price计算引擎"""
    
    # 运价等级参考
    RATE_CLASS_CONFIG = {
        'C': {'name': 'Commodity', 'min_discount': 0.9, 'priority': 1},
        'Q': {'name': 'Quantity', 'min_discount': 0.7, 'priority': 2},
        'S': {'name': 'Special', 'min_discount': 0.5, 'priority': 3},
        'M': {'name': 'Minimum', 'min_discount': 0.4, 'priority': 4},
    }
    
    def __init__(self):
        self.discount_rate = 0.6  # 默认折扣率
    
    def calculate_bid_price(self, flight: FlightInfo, request: BookingRequest) -> Dict:
        """计算双维度Bid Price"""
        
        # 1. 基础价格计算
        base_rate = self._get_base_rate(flight.departure, flight.arrival)
        
        # 2. 重量维度Bid Price
        weight_bid = self._calculate_weight_bid(
            flight, request, base_rate
        )
        
        # 3. 体积维度Bid Price  
        volume_bid = self._calculate_volume_bid(
            flight, request, base_rate
        )
        
        # 4. 取较高者作为Bid Price
        final_bid_price = max(weight_bid, volume_bid)
        
        # 5. 计算边际贡献
        marginal_contribution = self._calculate_marginal_contribution(
            flight, request, final_bid_price
        )
        
        # 6. 决策建议
        decision = self._make_decision(
            flight, request, final_bid_price, marginal_contribution
        )
        
        return {
            'flight_number': flight.flight_number,
            'flight_date': flight.flight_date.isoformat(),
            'request_id': request.customer_id,
            
            # Bid Price
            'bid_price_weight': round(weight_bid, 2),
            'bid_price_volume': round(volume_bid, 2),
            'bid_price_final': round(final_bid_price, 2),
            
            # 定价
            'requested_price': request.requested_price,
            'margin': round((request.requested_price - final_bid_price) / request.requested_price * 100, 1),
            
            # 容量状态
            'remaining_weight': flight.remaining_weight,
            'remaining_volume': flight.remaining_volume,
            'weight_utilization': round((flight.booked_weight / flight.capacity_weight) * 100, 1),
            'volume_utilization': round((flight.booked_volume / flight.capacity_volume) * 100, 1),
            
            # 决策
            'decision': decision['action'],
            'confidence': decision['confidence'],
            'reason': decision['reason'],
            
            # 边际贡献
            'marginal_contribution': round(marginal_contribution, 2),
            'opportunity_cost': round(self._calculate_opportunity_cost(flight, request), 2)
        }
    
    def _get_base_rate(self, origin: str, destination: str) -> float:
        """获取基础运价 (元/kg)"""
        # 简化版: 根据航距计算
        route_rates = {
            ('PVG', 'LAX'): 18.5,
            ('PVG', 'FRA'): 15.0,
            ('PVG', 'NRT'): 12.0,
            ('PVG', 'LHR'): 16.5,
            ('PVG', 'CDG'): 15.5,
            ('PVG', 'ORD'): 17.0,
            ('PVG', 'ICN'): 8.5,
        }
        return route_rates.get((origin, destination), 12.0)
    
    def _calculate_weight_bid(self, flight: FlightInfo, request: BookingRequest, 
                              base_rate: float) -> float:
        """计算重量维度Bid Price"""
        
        # 基础成本
        cost_per_kg = base_rate * 0.4  # 变动成本40%
        
        # 机会成本 (基于当前装载率)
        load_factor = flight.booked_weight / flight.capacity_weight
        
        if load_factor >= 0.95:
            opportunity_cost = base_rate * 1.5  # 高价值航班机会成本高
        elif load_factor >= 0.85:
            opportunity_cost = base_rate * 0.8
        elif load_factor >= 0.70:
            opportunity_cost = base_rate * 0.3
        else:
            opportunity_cost = 0
        
        # 重量边际成本
        weight_cost = request.weight * cost_per_kg
        
        # 总Bid Price (重量维度)
        weight_bid = weight_cost + (opportunity_cost * request.weight)
        
        return max(weight_bid, request.weight * base_rate * 0.3)  # 最低价
    
    def _calculate_volume_bid(self, flight: FlightInfo, request: BookingRequest,
                               base_rate: float) -> float:
        """计算体积维度Bid Price"""
        
        # 体积成本 (转换为重量等价)
        volume_to_weight_ratio = 1/0.006  # 1 cbm = 167kg (航空标准)
        volume_equivalent = request.volume * volume_to_weight_ratio
        
        cost_per_kg = base_rate * 0.4
        cost_per_vol_kg = cost_per_kg * 0.8  # 体积货成本略低
        
        # 机会成本
        load_factor = flight.booked_volume / flight.capacity_volume
        
        if load_factor >= 0.95:
            opportunity_cost = base_rate * 1.2
        elif load_factor >= 0.85:
            opportunity_cost = base_rate * 0.6
        elif load_factor >= 0.70:
            opportunity_cost = base_rate * 0.2
        else:
            opportunity_cost = 0
        
        volume_bid = (volume_equivalent * cost_per_vol_kg) + (volume_equivalent * opportunity_cost)
        
        return max(volume_bid, request.volume * base_rate * 0.3 * 167)
    
    def _calculate_marginal_contribution(self, flight: FlightInfo, 
                                         request: BookingRequest, 
                                         bid_price: float) -> float:
        """计算边际贡献"""
        # 收入 - 变动成本
        revenue = request.requested_price
        variable_cost = request.weight * 2.0  # 简化: 每kg变动成本2元
        
        contribution = revenue - variable_cost
        
        # 考虑机会成本
        if flight.remaining_weight < request.weight:
            # 需要超订或拒绝
            contribution -= (request.weight - flight.remaining_weight) * 5
        
        return contribution
    
    def _calculate_opportunity_cost(self, flight: FlightInfo, 
                                    request: BookingRequest) -> float:
        """计算机会成本"""
        
        # 估算未来更高价订单的可能性
        load_factor = flight.booked_weight / flight.capacity_weight
        
        if load_factor >= 0.95:
            # 高装载率, 机会成本高
            expected_future_rate = self._get_base_rate(flight.departure, flight.arrival) * 1.3
            future_weight = flight.remaining_weight
        elif load_factor >= 0.85:
            expected_future_rate = self._get_base_rate(flight.departure, flight.arrival) * 1.1
            future_weight = flight.remaining_weight * 0.7
        else:
            expected_future_rate = self._get_base_rate(flight.departure, flight.arrival)
            future_weight = flight.remaining_weight * 0.3
        
        opportunity_cost = future_weight * (expected_future_rate - request.requested_price/request.weight)
        
        return max(0, opportunity_cost)
    
    def _make_decision(self, flight: FlightInfo, request: BookingRequest,
                       bid_price: float, marginal_contribution: float) -> Dict:
        """做出接单决策"""
        
        price_ratio = request.requested_price / bid_price
        
        # 检查容量
        can_accommodate = (flight.remaining_weight >= request.weight and 
                         flight.remaining_volume >= request.volume)
        
        if not can_accommodate:
            return {
                'action': 'REJECT',
                'confidence': 0.99,
                'reason': '容量不足，建议超订策略'
            }
        
        # 决策逻辑
        if price_ratio >= 1.2:
            action = 'ACCEPT'
            confidence = 0.95
            reason = '高价优质订单'
        elif price_ratio >= 1.0:
            action = 'ACCEPT'
            confidence = 0.85
            reason = '符合Bid Price，接受'
        elif price_ratio >= 0.85:
            action = 'NEGOTIATE'
            confidence = 0.70
            reason = f'建议提价至 {bid_price * 1.1:.0f}'
        else:
            action = 'REJECT'
            confidence = 0.90
            reason = '低于成本价'
        
        return {'action': action, 'confidence': confidence, 'reason': reason}


class RevenueOptimizer:
    """收益优化器"""
    
    def __init__(self):
        self.bid_engine = BidPriceEngine()
    
    def optimize_overbooking(self, flight: FlightInfo) -> Dict:
        """超订优化"""
        
        # 基于历史Show Rate计算超订比例
        show_rate = 0.92  # 简化: 92%到场率
        
        # 计算最优超订水平
        # 使用Eldorado公式简化版
        optimal_overage = (1 - show_rate) * flight.remaining_weight * 1.1
        
        # 超订风险评估
        risk_level = 'LOW'
        if optimal_overage > flight.remaining_weight * 0.15:
            risk_level = 'HIGH'
        elif optimal_overage > flight.remaining_weight * 0.10:
            risk_level = 'MEDIUM'
        
        return {
            'flight_number': flight.flight_number,
            'current_booked': flight.booked_weight,
            'capacity': flight.capacity_weight,
            'remaining': flight.remaining_weight,
            'show_rate': show_rate,
            'recommended_overage': round(optimal_overage, 2),
            'risk_level': risk_level,
            'max_oversell_weight': round(flight.remaining_weight * 1.15, 2),
            'expected_denied': round(optimal_overage * (1 - show_rate), 2)
        }
    
    def generate_revenue_report(self, flight: FlightInfo, 
                                decisions: List[Dict]) -> Dict:
        """生成收益报告"""
        
        accepted = [d for d in decisions if d['decision'] == 'ACCEPT']
        rejected = [d for d in decisions if d['decision'] == 'REJECT']
        negotiate = [d for d in decisions if d['decision'] == 'NEGOTIATE']
        
        total_revenue = sum(d.get('requested_price', 0) for d in accepted)
        expected_revenue = sum(d.get('bid_price_final', 0) for d in accepted)
        
        return {
            'flight': flight.flight_number,
            'date': flight.flight_date.isoformat(),
            'summary': {
                'total_requests': len(decisions),
                'accepted': len(accepted),
                'rejected': len(rejected),
                'negotiate': len(negotiate),
                'accept_rate': round(len(accepted) / len(decisions) * 100, 1)
            },
            'revenue': {
                'actual': round(total_revenue, 2),
                'expected': round(expected_revenue, 2),
                'gap': round(total_revenue - expected_revenue, 2)
            },
            'capacity': {
                'weight_used': round(flight.booked_weight, 2),
                'weight_remaining': round(flight.remaining_weight, 2),
                'utilization': round(flight.booked_weight / flight.capacity_weight * 100, 1)
            }
        }


def main():
    print("=" * 60)
    print("P2-M2.3: Bid Price收益管理引擎")
    print("=" * 60)
    
    engine = BidPriceEngine()
    optimizer = RevenueOptimizer()
    
    # 创建航班信息
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
    
    print(f"\n航班: {flight.flight_number} {flight.flight_date.strftime('%Y-%m-%d')}")
    print(f"装载率: 重量 {flight.booked_weight/flight.capacity_weight*100:.1f}% | 体积 {flight.booked_volume/flight.capacity_volume*100:.1f}%")
    
    # 模拟订舱请求
    requests = [
        BookingRequest('C001', 'PVG', 'LAX', 500, 2.5, 5, 15000, 9000, 'Q'),
        BookingRequest('C002', 'PVG', 'LAX', 200, 0.8, 2, 5000, 2500, 'M'),
        BookingRequest('C003', 'PVG', 'LAX', 1000, 5.0, 10, 30000, 18000, 'C'),
        BookingRequest('C004', 'PVG', 'LAX', 300, 1.2, 3, 8000, 3500, 'S'),
    ]
    
    print(f"\n收到 {len(requests)} 个订舱请求:")
    
    decisions = []
    for req in requests:
        result = engine.calculate_bid_price(flight, req)
        decisions.append(result)
        
        icon = {'ACCEPT': '✅', 'REJECT': '❌', 'NEGOTIATE': '⚠️'}
        print(f"\n{icon.get(result['decision'], '❓')} 请求 {req.customer_id}:")
        print(f"   重量: {req.weight}kg | 报价: ¥{req.requested_price}")
        print(f"   Bid Price: ¥{result['bid_price_final']} | 利润空间: {result['margin']}%")
        print(f"   决策: {result['decision']} ({result['reason']})")
    
    # 超订优化
    print(f"\n{'='*40}")
    print("超订优化建议:")
    overbook = optimizer.optimize_overbooking(flight)
    print(f"  建议超订量: {overbook['recommended_overage']}kg")
    print(f"  风险等级: {overbook['risk_level']}")
    print(f"  最大超售: {overbook['max_oversell_weight']}kg")
    
    # 收益报告
    report = optimizer.generate_revenue_report(flight, decisions)
    print(f"\n{'='*40}")
    print("收益报告:")
    print(f"  接受率: {report['summary']['accept_rate']}%")
    print(f"  预计收入: ¥{report['revenue']['expected']:,.0f}")
    print(f"  装载率: {report['capacity']['utilization']}%")
    
    return engine, decisions


if __name__ == '__main__':
    engine, decisions = main()
