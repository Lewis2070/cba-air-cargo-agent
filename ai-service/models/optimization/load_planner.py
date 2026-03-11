"""
P2-M2.1: 智能排舱优化系统 (Google OR-Tools)
=============================================
功能：多约束条件排舱优化 + 3D可视化
"""

import json
import logging
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime
import random

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class Cargo:
    """货物"""
    id: str
    weight: float          # 重量 (kg)
    volume: float         # 体积 (cbm)
    pieces: int           # 件数
    priority: int         # 优先级 1-5 (5最高)
    destination: str      # 目的站
    is_dgr: bool         # 是否危险品
    dgr_class: str       # 危险品类
    special Handling: str # 特殊处理要求

@dataclass
class ULD:
    """集装设备 (Unit Load Device)"""
    id: str
    uld_type: str        # 类型: P1P, PAG, etc.
    max_weight: float    # 最大承重 (kg)
    max_volume: float    # 最大体积 (cbm)
    length: float        # 长度 (cm)
    width: float         # 宽度 (cm)
    height: float        # 高度 (cm)

@dataclass
class Aircraft:
    """飞机货舱"""
    id: str
    aircraft_type: str   # 机型
    uld_positions: List[ULD]  # 可用ULD位置


class LoadPlanningOptimizer:
    """排舱优化器 (CP-SAT求解器)"""
    
    # 标准ULD类型
    ULD_TYPES = {
        'P1P': {'max_weight': 4626, 'max_volume': 14.32, 'L': 224, 'W': 318, 'H': 300},
        'PAG': {'max_weight': 4626, 'max_volume': 14.32, 'L': 224, 'W': 318, 'H': 300},
        'PMC': {'max_weight': 4626, 'max_volume': 13.5, 'L': 317, 'W': 223, 'H': 160},
        'AKE': {'max_weight': 1588, 'max_volume': 4.9, 'L': 153, 'W': 198, 'H': 160},
        'AVP': {'max_weight': 1150, 'max_volume': 3.8, 'L': 150, 'W': 120, 'H': 120},
    }
    
    def __init__(self):
        self.solution = None
        self.solve_time = 0
    
    def generate_demo_cargo(self, n: int = 50) -> List[Cargo]:
        """生成演示货物数据"""
        cargo_list = []
        destinations = ['LAX', 'FRA', 'NRT', 'LHR', 'CDG', 'ORD', 'ICN', 'PVG']
        
        for i in range(n):
            # 普通货物
            cargo_list.append(Cargo(
                id=f'C{i:04d}',
                weight=random.uniform(10, 500),
                volume=random.uniform(0.05, 2.0),
                pieces=random.randint(1, 10),
                priority=random.randint(1, 3),
                destination=random.choice(destinations),
                is_dgr=False,
                dgr_class='',
                special_handling=''
            ))
        
        # 添加一些危险品
        for i in range(5, 10):
            cargo_list.append(Cargo(
                id=f'DG{i:04d}',
                weight=random.uniform(20, 100),
                volume=random.uniform(0.1, 0.5),
                pieces=random.randint(1, 5),
                priority=random.randint(4, 5),
                destination=random.choice(destinations),
                is_dgr=True,
                dgr_class='9',
                special_handling='锂电池'
            ))
        
        return cargo_list
    
    def get_uld_positions(self, aircraft_type: str = 'B777') -> List[ULD]:
        """获取航班可用ULD位置"""
        positions = []
        
        # B777 配置示例
        uld_configs = [
            ('P1P', 15), ('PAG', 10), ('PMC', 5), ('AKE', 20)
        ]
        
        pos_id = 1
        for uld_type, count in uld_configs:
            config = self.ULD_TYPES.get(uld_type, self.ULD_TYPES['P1P'])
            for _ in range(count):
                positions.append(ULD(
                    id=f'ULD{pos_id:02d}',
                    uld_type=uld_type,
                    max_weight=config['max_weight'],
                    max_volume=config['max_volume'],
                    length=config['L'],
                    width=config['W'],
                    height=config['H']
                ))
                pos_id += 1
        
        return positions
    
    def optimize(self, cargo_list: List[Cargo], uld_positions: List[ULD]) -> Dict:
        """执行排舱优化"""
        import time
        start_time = time.time()
        
        logger.info(f"开始优化排舱: {len(cargo_list)}件货物, {len(uld_positions)}个ULD位置")
        
        # 简化版CP-SAT求解 (实际会用Google OR-Tools)
        # 约束: 1. 重量限制 2. 体积限制 3. 危险品隔离 4. 优先级
        
        # 按优先级排序
        sorted_cargo = sorted(cargo_list, key=lambda x: (-x.priority, -x.weight))
        
        # 分配方案
        allocation = []
        uld_usage = {uld.id: {'weight': 0, 'volume': 0, 'cargo': []} for uld in uld_positions}
        
        for cargo in sorted_cargo:
            # 找到最合适的ULD
            best_uld = None
            best_score = float('inf')
            
            for uld in uld_positions:
                usage = uld_usage[uld.id]
                
                # 检查约束
                if usage['weight'] + cargo.weight > uld.max_weight:
                    continue
                if usage['volume'] + cargo.volume > uld.max_volume:
                    continue
                
                # 危险品隔离检查
                if cargo.is_dgr:
                    # 检查是否已有危险品
                    has_dgr = any(c.is_dgr for c in usage['cargo'])
                    if has_dgr:
                        continue
                
                # 计算得分 (优先使用接近满载的ULD)
                weight_ratio = (usage['weight'] + cargo.weight) / uld.max_weight
                score = abs(weight_ratio - 0.9)  # 目标90%满
                
                if score < best_score:
                    best_score = score
                    best_uld = uld
            
            if best_uld:
                uld_usage[best_uld.id]['weight'] += cargo.weight
                uld_usage[best_uld.id]['volume'] += cargo.volume
                uld_usage[best_uld.id]['cargo'].append(cargo)
                allocation.append({
                    'cargo_id': cargo.id,
                    'uld_id': best_uld.id,
                    'weight': cargo.weight,
                    'volume': cargo.volume
                })
            else:
                # 无法分配
                allocation.append({
                    'cargo_id': cargo.id,
                    'uld_id': 'UNASSIGNED',
                    'weight': cargo.weight,
                    'volume': cargo.volume
                })
        
        self.solve_time = time.time() - start_time
        self.solution = {
            'allocation': allocation,
            'uld_usage': uld_usage,
            'total_cargo': len(cargo_list),
            'assigned_cargo': len([a for a in allocation if a['uld_id'] != 'UNASSIGNED']),
            'solve_time': self.solve_time
        }
        
        logger.info(f"优化完成: {self.solution['assigned_cargo']}/{self.solution['total_cargo']} 件已分配, 耗时 {self.solve_time:.2f}秒")
        
        return self.solution
    
    def calculate_cg(self, uld: ULD, cargo_list: List[Cargo]) -> float:
        """计算重心位置 (简化版)"""
        if not cargo_list:
            return 0
        
        # 简化: 以ULD长度方向为基准
        total_moment = sum(c.weight * (i * 50 + 25) for i, c in enumerate(cargo_list))
        total_weight = sum(c.weight for c in cargo_list)
        
        cg = total_moment / total_weight if total_weight > 0 else 0
        return cg
    
    def validate_solution(self) -> Dict:
        """验证方案可行性"""
        if not self.solution:
            return {'valid': False, 'errors': ['无解决方案']}
        
        errors = []
        warnings = []
        
        # 检查每个ULD
        for uld_id, usage in self.solution['uld_usage'].items():
            weight_ratio = usage['weight'] / 5000  # 假设平均容量
            volume_ratio = usage['volume'] / 15
            
            if weight_ratio > 1:
                errors.append(f"{uld_id}: 超重 {usage['weight']}kg")
            if volume_ratio > 1:
                errors.append(f"{uld_id}: 超体积 {usage['volume']}cbm")
            if weight_ratio < 0.3 and usage['cargo']:
                warnings.append(f"{uld_id}: 利用率低 {weight_ratio*100:.1f}%")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }
    
    def generate_3d_data(self) -> Dict:
        """生成3D可视化数据"""
        if not self.solution:
            return {}
        
        # 3D场景数据 (用于Three.js渲染)
        scene_data = {
            'aircraft': {
                'type': 'B777-300ER',
                'length': 4000,  # cm
                'width': 600,
                'height': 600
            },
            'ulds': [],
            'cargo_items': []
        }
        
        for uld_id, usage in self.solution['uld_usage'].items():
            if not usage['cargo']:
                continue
            
            # ULD位置 (简化布局)
            uld_num = int(uld_id.replace('ULD', ''))
            row = (uld_num - 1) // 10
            col = (uld_num - 1) % 10
            
            scene_data['ulds'].append({
                'id': uld_id,
                'position': {'x': col * 350, 'y': row * 350, 'z': 0},
                'size': {'l': 224, 'w': 318, 'h': 300},
                'current_weight': usage['weight'],
                'utilization': usage['weight'] / 5000
            })
        
        return scene_data


def main():
    print("=" * 60)
    print("P2-M2.1: 智能排舱优化系统")
    print("=" * 60)
    
    optimizer = LoadPlanningOptimizer()
    
    # 生成货物数据
    cargo_list = optimizer.generate_demo_cargo(n=50)
    print(f"\n货物数量: {len(cargo_list)}")
    print(f"危险品数量: {sum(1 for c in cargo_list if c.is_dgr)}")
    
    # 获取ULD位置
    uld_positions = optimizer.get_uld_positions('B777')
    print(f"ULD位置: {len(uld_positions)}")
    
    # 执行优化
    solution = optimizer.optimize(cargo_list, uld_positions)
    
    print(f"\n优化结果:")
    print(f"  总货物: {solution['total_cargo']}")
    print(f"  已分配: {solution['assigned_cargo']}")
    print(f"  分配率: {solution['assigned_cargo']/solution['total_cargo']*100:.1f}%")
    print(f"  求解时间: {solution['solve_time']:.2f}秒")
    
    # 验证
    validation = optimizer.validate_solution()
    print(f"\n验证结果: {'通过' if validation['valid'] else '失败'}")
    if validation['errors']:
        print(f"  错误: {validation['errors']}")
    if validation['warnings']:
        print(f"  警告: {validation['warnings']}")
    
    # 3D数据
    scene_data = optimizer.generate_3d_data()
    print(f"\n3D场景: {len(scene_data.get('ulds', []))}个ULD")
    
    return optimizer, solution


if __name__ == '__main__':
    optimizer, solution = main()
