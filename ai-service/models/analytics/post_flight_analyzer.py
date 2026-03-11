"""
P3-M3.2: 智能复盘分析系统 (LLM)
==============================
功能：航班复盘报告自动生成 + 归因分析 + 知识图谱
"""

import json
import logging
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import random

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class FlightData:
    """航班数据"""
    flight_number: str
    flight_date: datetime
    departure: str
    arrival: str
    
    # 收益数据
    revenue: float
    cost: float
    profit: float
    
    # 装载数据
    capacity_weight: float
    booked_weight: float
    capacity_volume: float
    booked_volume: float
    
    # 运营数据
    on_time_rate: float
    incidents: List[str]
    
    # 市场数据
    avg_rate: float
    competitor_rate: float
    demand_level: str


class PostFlightAnalyzer:
    """航班复盘分析器"""
    
    def __init__(self):
        self.llm_available = False
        self.knowledge_graph = self._init_knowledge_graph()
    
    def _init_knowledge_graph(self) -> Dict:
        """初始化知识图谱"""
        return {
            'patterns': [
                {
                    'id': 'PAT001',
                    'name': '周一高装载率',
                    'description': '周一航班装载率通常高于其他日期',
                    'factor': '周一商务货物集中'
                },
                {
                    'id': 'PAT002', 
                    'name': '月末效应',
                    'description': '月末出货量增加',
                    'factor': '客户账期影响'
                },
                {
                    'id': 'PAT003',
                    'name': '季节性波动',
                    'description': 'Q4电商货运旺季',
                    'factor': '节日促销带动'
                }
            ],
            'insights': [],
            'recommendations': []
        }
    
    def analyze(self, flight_data: FlightData) -> Dict:
        """分析航班表现"""
        
        # 1. 基本指标计算
        metrics = self._calculate_metrics(flight_data)
        
        # 2. 归因分析
        attribution = self._analyze_attribution(flight_data, metrics)
        
        # 3. 生成建议
        recommendations = self._generate_recommendations(flight_data, metrics, attribution)
        
        # 4. 与知识图谱关联
        pattern_matches = self._match_patterns(flight_data)
        
        return {
            'flight': {
                'number': flight_data.flight_number,
                'date': flight_data.flight_date.strftime('%Y-%m-%d'),
                'route': f"{flight_data.departure}-{flight_data.arrival}"
            },
            'metrics': metrics,
            'attribution': attribution,
            'recommendations': recommendations,
            'pattern_matches': pattern_matches,
            'analysis_time': datetime.now().isoformat()
        }
    
    def _calculate_metrics(self, flight: FlightData) -> Dict:
        """计算关键指标"""
        
        weight_util = flight.booked_weight / flight.capacity_weight * 100
        volume_util = flight.booked_volume / flight.capacity_volume * 100
        
        return {
            'weight_utilization': round(weight_util, 1),
            'volume_utilization': round(volume_util, 1),
            'profit': round(flight.profit, 2),
            'profit_margin': round(flight.profit / flight.revenue * 100, 1) if flight.revenue > 0 else 0,
            'cost_per_kg': round(flight.cost / flight.booked_weight, 2) if flight.booked_weight > 0 else 0,
            'on_time_rate': round(flight.on_time_rate * 100, 1),
            'revenue_per_kg': round(flight.revenue / flight.booked_weight, 2) if flight.booked_weight > 0 else 0,
            'market_gap': round((flight.avg_rate - flight.competitor_rate) / flight.competitor_rate * 100, 1) if flight.competitor_rate > 0 else 0
        }
    
    def _analyze_attribution(self, flight: FlightData, metrics: Dict) -> Dict:
        """归因分析"""
        
        factors = []
        
        # 装载率归因
        if metrics['weight_utilization'] < 70:
            factors.append({
                'factor': '装载率偏低',
                'impact': 'HIGH',
                'description': '装载率低于70%，未充分利用舱位',
                'suggestion': '建议加强揽货或调整运价'
            })
        elif metrics['weight_utilization'] >= 90:
            factors.append({
                'factor': '装载率优秀',
                'impact': 'POSITIVE',
                'description': '装载率超过90%，舱位利用充分',
                'suggestion': '可适当提价'
            })
        
        # 收益归因
        if metrics['profit_margin'] < 10:
            factors.append({
                'factor': '利润率偏低',
                'impact': 'HIGH',
                'description': '利润率低于10%，收益质量待提升',
                'suggestion': '需优化定价策略'
            })
        
        # 准点率归因
        if metrics['on_time_rate'] < 95:
            factors.append({
                'factor': '准点率下降',
                'impact': 'MEDIUM',
                'description': '准点率低于95%，影响服务质量',
                'suggestion': '需排查延误原因'
            })
        
        # 市场归因
        if metrics['market_gap'] < -5:
            factors.append({
                'factor': '运价竞争力不足',
                'impact': 'MEDIUM',
                'description': '运价低于市场价5%以上',
                'suggestion': '需评估市场竞争策略'
            })
        
        return {
            'factors': factors,
            'summary': f"发现 {len([f for f in factors if f['impact'] == 'HIGH'])} 个高优先级问题"
        }
    
    def _generate_recommendations(self, flight: FlightData, 
                                  metrics: Dict, 
                                  attribution: Dict) -> List[Dict]:
        """生成改进建议"""
        
        recommendations = []
        
        # 基于归因分析生成建议
        for factor in attribution['factors']:
            if factor['impact'] == 'HIGH':
                recommendations.append({
                    'priority': 'HIGH',
                    'area': factor['factor'],
                    'action': factor['suggestion'],
                    'expected_impact': self._estimate_impact(factor['factor'])
                })
            elif factor['impact'] == 'MEDIUM':
                recommendations.append({
                    'priority': 'MEDIUM', 
                    'area': factor['factor'],
                    'action': factor['suggestion'],
                    'expected_impact': self._estimate_impact(factor['factor'])
                })
        
        # 通用建议
        if metrics['weight_utilization'] < 80:
            recommendations.append({
                'priority': 'MEDIUM',
                'area': '收益优化',
                'action': '考虑增加超订比例以提升装载率',
                'expected_impact': '+2-3% 装载率'
            })
        
        return sorted(recommendations, 
                    key=lambda r: {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}[r['priority']])
    
    def _estimate_impact(self, factor: str) -> str:
        """估算影响"""
        impact_map = {
            '装载率偏低': '+5-10% 收益',
            '装载率优秀': '+3-5% 收益', 
            '利润率偏低': '+2-4% 利润率',
            '准点率下降': '+5% 准点率',
            '运价竞争力不足': '+2-3% 市场份额'
        }
        return impact_map.get(factor, '待评估')
    
    def _match_patterns(self, flight: FlightData) -> List[Dict]:
        """匹配知识图谱中的模式"""
        
        matches = []
        
        # 检查周一效应
        if flight.flight_date.weekday() == 0:  # 周一
            matches.append({
                'pattern_id': 'PAT001',
                'name': '周一高装载率',
                'relevance': 'HIGH',
                'note': '今日为周一，历史数据显示装载率较高'
            })
        
        # 检查月末效应
        if flight.flight_date.day >= 25:
            matches.append({
                'pattern_id': 'PAT002',
                'name': '月末效应',
                'relevance': 'MEDIUM', 
                'note': '近期为月末，出货量预计增加'
            })
        
        return matches
    
    def generate_report(self, analysis: Dict) -> str:
        """生成复盘报告"""
        
        report = []
        report.append("=" * 60)
        report.append("航班复盘分析报告")
        report.append("=" * 60)
        
        # 航班信息
        f = analysis['flight']
        report.append(f"\n航班: {f['number']} ({f['route']})")
        report.append(f"日期: {f['date']}")
        
        # 关键指标
        m = analysis['metrics']
        report.append(f"\n【关键指标】")
        report.append(f"  装载率: {m['weight_utilization']}% (重量) / {m['volume_utilization']}% (体积)")
        report.append(f"  利润率: {m['profit_margin']}%")
        report.append(f"  准点率: {m['on_time_rate']}%")
        report.append(f"  单价: ¥{m['revenue_per_kg']}/kg")
        
        # 归因分析
        report.append(f"\n【归因分析】")
        for factor in analysis['attribution']['factors']:
            icon = {'HIGH': '⚠️', 'MEDIUM': '📊', 'POSITIVE': '✅'}.get(factor['impact'], '❓')
            report.append(f"  {icon} {factor['factor']}: {factor['description']}")
        
        # 改进建议
        report.append(f"\n【改进建议】")
        for rec in analysis['recommendations'][:3]:
            report.append(f"  [{rec['priority']}] {rec['area']}: {rec['action']}")
            report.append(f"      预期效果: {rec['expected_impact']}")
        
        # 模式匹配
        if analysis['pattern_matches']:
            report.append(f"\n【历史模式匹配】")
            for pm in analysis['pattern_matches']:
                report.append(f"  • {pm['name']} ({pm['relevance']})")
        
        report.append("\n" + "=" * 60)
        report.append(f"分析时间: {analysis['analysis_time']}")
        
        return "\n".join(report)


class LLMReportGenerator:
    """LLM报告生成器 (模拟)"""
    
    def __init__(self):
        self.model = "gpt-4-turbo"  # 实际会用LLM
    
    def generate_summary(self, flight_data: FlightData, analysis: Dict) -> str:
        """生成LLM摘要"""
        
        # 模拟LLM生成的自然语言摘要
        summary = f"""
## {flight_data.flight_number} 航班复盘摘要

本次航班({flight_data.departure}-{flight_data.arrival})整体表现{'良好' if analysis['metrics']['weight_utilization'] > 75 else '有待提升'}。

**收益方面**：本期实现收入 ¥{flight_data.revenue:,.0f}，利润率 {analysis['metrics']['profit_margin']:.1f}%。受市场竞争影响，单位运价为 ¥{analysis['metrics']['revenue_per_kg']}/kg，{'略低于' if analysis['metrics']['market_gap'] < 0 else '略高于'}市场价。

**运营方面**：装载率 {analysis['metrics']['weight_utilization']:.1f}%，准点率 {analysis['metrics']['on_time_rate']:.1f}%。{'近期无异常事件记录' if not flight_data.incidents else f'存在 {len(flight_data.incidents)} 起异常事件需关注。'}

**改进建议**：{analysis['recommendations'][0]['action'] if analysis['recommendations'] else '暂无改进建议'}。建议重点关注{'装载率提升' if analysis['metrics']['weight_utilization'] < 80 else '收益质量优化'}。
"""
        return summary.strip()


def main():
    print("=" * 60)
    print("P3-M3.2: 智能复盘分析系统")
    print("=" * 60)
    
    analyzer = PostFlightAnalyzer()
    llm_gen = LLMReportGenerator()
    
    # 模拟航班数据
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
    
    # 分析
    analysis = analyzer.analyze(flight)
    
    # 报告
    report = analyzer.generate_report(analysis)
    print(report)
    
    # LLM摘要
    print("\n" + "=" * 60)
    print("LLM生成摘要:")
    print("=" * 60)
    summary = llm_gen.generate_summary(flight, analysis)
    print(summary)
    
    return analyzer, analysis


if __name__ == '__main__':
    analyzer, analysis = main()
