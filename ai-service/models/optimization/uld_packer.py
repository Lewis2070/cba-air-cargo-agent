"""
P3-M3.1: ULD 3D装载优化系统
===========================
功能：3D Bin Packing算法 + 装载质量检测
"""

import json
import logging
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime
import random
import math

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class Package:
    """货物包裹"""
    id: str
    length: float      # cm
    width: float       # cm
    height: float      # cm
    weight: float      # kg
    priority: int      # 优先级
    fragile: bool      # 易碎
    stackable: bool    # 可叠放

@dataclass
class ULDPosition:
    """ULD内位置"""
    x: float
    y: float
    z: float

class BinPacking3D:
    """3D装箱算法"""
    
    def __init__(self):
        self.solution = None
    
    def generate_demo_packages(self, n: int = 30) -> List[Package]:
        """生成演示货物"""
        packages = []
        sizes = [
            (60, 40, 30),  # 标准箱
            (80, 60, 40),  # 大箱
            (40, 30, 25),  # 小箱
            (100, 80, 60), # 托盘
        ]
        
        for i in range(n):
            size = random.choice(sizes)
            packages.append(Package(
                id=f'PKG{i:03d}',
                length=size[0],
                width=size[1],
                height=size[2],
                weight=random.uniform(5, 50),
                priority=random.randint(1, 5),
                fragile=random.random() < 0.1,
                stackable=random.random() > 0.2
            ))
        
        return packages
    
    def calculate_volume(self, packages: List[Package]) -> float:
        """计算总体积"""
        return sum(p.length * p.width * p.height for p in packages)
    
    def calculate_weight(self, packages: List[Package]) -> float:
        """计算总重量"""
        return sum(p.weight for p in packages)
    
    def pack_3d_greedy(self, packages: List[Package], 
                       uld_length: float, uld_width: float, 
                       uld_height: float) -> Dict:
        """贪心算法3D装箱"""
        
        # 按体积/重量比排序（大体积轻货物优先）
        sorted_packages = sorted(packages, 
                                key=lambda p: (p.length*p.width*p.height)/max(p.weight,1), 
                                reverse=True)
        
        placements = []  # 放置位置
        space = [(0, 0, 0, uld_length, uld_width, uld_height)]  # 可用空间
        
        for pkg in sorted_packages:
            placed = False
            
            for i, (x, y, z, l, w, h) in enumerate(space):
                # 检查是否能放入
                if (pkg.length <= l and pkg.width <= w and pkg.height <= h):
                    # 放置货物
                    placements.append({
                        'package_id': pkg.id,
                        'x': x,
                        'y': y,
                        'z': z,
                        'rotation': '0',
                        'length': pkg.length,
                        'width': pkg.width,
                        'height': pkg.height
                    })
                    
                    # 更新可用空间 (3D切分)
                    new_spaces = []
                    
                    # 右侧空间
                    if l - pkg.length > 0:
                        new_spaces.append((
                            x + pkg.length, y, z,
                            l - pkg.length, w, h
                        ))
                    
                    # 前侧空间
                    if w - pkg.width > 0:
                        new_spaces.append((
                            x, y + pkg.width, z,
                            pkg.length, w - pkg.width, h
                        ))
                    
                    # 顶部空间
                    if h - pkg.height > 0:
                        new_spaces.append((
                            x, y, z + pkg.height,
                            pkg.length, pkg.width, h - pkg.height
                        ))
                    
                    # 合并空间
                    space = self._merge_spaces(space[:i] + new_spaces + space[i+1:])
                    placed = True
                    break
            
            if not placed:
                logger.warning(f"无法放置货物: {pkg.id}")
        
        # 计算利用率
        used_volume = sum(p.length * p.width * p.height for p in placements)
        total_volume = uld_length * uld_width * uld_height
        
        return {
            'placements': placements,
            'unpacked': len(packages) - len(placements),
            'volume_utilization': round(used_volume / total_volume * 100, 1),
            'package_count': len(placements)
        }
    
    def _merge_spaces(self, spaces: List) -> List:
        """合并可用的空间"""
        # 简化版: 排序后去重
        spaces = list(set(spaces))
        return sorted(spaces, key=lambda s: s[0]*10000 + s[1]*100 + s[2])
    
    def pack_3d_genetic(self, packages: List[Package],
                        uld_length: float, uld_width: float,
                        uld_height: float,
                        population: int = 50,
                        generations: int = 100) -> Dict:
        """遗传算法3D装箱"""
        
        def fitness(solution: List) -> float:
            """适应度函数"""
            if not solution:
                return 0
            volume = sum(p.length * p.width * p.height for p in solution)
            return volume / (uld_length * uld_width * uld_height)
        
        # 初始化种群
        best_solution = None
        best_fitness = 0
        
        for gen in range(generations):
            # 随机排序货物
            random.shuffle(packages)
            
            # 贪心放置
            result = self.pack_3d_greedy(
                packages[:len(packages)//2],  # 用一半货物测试
                uld_length, uld_width, uld_height
            )
            
            curr_fitness = result['volume_utilization'] / 100
            
            if curr_fitness > best_fitness:
                best_fitness = curr_fitness
                best_solution = result
        
        return best_solution if best_solution else {
            'placements': [],
            'volume_utilization': 0
        }
    
    def validate_placements(self, placements: List[Dict], 
                          packages: List[Package],
                          uld_length: float, uld_width: float,
                          uld_height: float) -> Dict:
        """验证放置方案"""
        
        errors = []
        warnings = []
        
        for place in placements:
            # 超界检查
            if (place['x'] + place['length'] > uld_length or
                place['y'] + place['width'] > uld_width or
                place['z'] + place['height'] > uld_height):
                errors.append(f"{place['package_id']}: 超出ULD边界")
            
            # 重量检查
            pkg = next((p for p in packages if p.id == place['package_id']), None)
            if pkg and pkg.weight > 500:  # 单件限重
                warnings.append(f"{place['package_id']}: 超过单件限重500kg")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }
    
    def generate_3d_scene(self, placements: List[Dict],
                         uld_length: float, uld_width: float,
                         uld_height: float) -> Dict:
        """生成3D场景数据 (用于Three.js)"""
        
        scene = {
            'uld': {
                'length': uld_length,
                'width': uld_width,
                'height': uld_height
            },
            'packages': []
        }
        
        for place in placements:
            scene['packages'].append({
                'id': place['package_id'],
                'position': {
                    'x': place['x'],
                    'y': place['y'], 
                    'z': place['z']
                },
                'size': {
                    'l': place['length'],
                    'w': place['width'],
                    'h': place['height']
                },
                'color': self._get_package_color(place['package_id'])
            })
        
        return scene
    
    def _get_package_color(self, package_id: str) -> str:
        """根据货物ID生成颜色"""
        colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6']
        idx = int(package_id.replace('PKG', '')) % len(colors)
        return colors[idx]


class LoadQualityDetector:
    """装载质量检测"""
    
    def __init__(self):
        self.model_loaded = False
    
    def detect(self, image_data: bytes) -> Dict:
        """检测装载质量"""
        # 简化版: 模拟计算机视觉检测
        # 实际生产中会用OpenCV/YOLO
        
        issues = []
        
        # 模拟检测结果
        if random.random() < 0.3:
            issues.append({
                'type': 'LOOSE_STRAP',
                'severity': 'MEDIUM',
                'description': '发现捆绑带松动',
                'location': {'x': 100, 'y': 200}
            })
        
        if random.random() < 0.2:
            issues.append({
                'type': 'OFF_CENTER',
                'severity': 'LOW',
                'description': '货物偏离中心',
                'location': {'x': 150, 'y': 180}
            })
        
        if random.random() < 0.1:
            issues.append({
                'type': 'OVERHANG',
                'severity': 'HIGH',
                'description': '货物突出ULD边界',
                'location': {'x': 50, 'y': 100}
            })
        
        return {
            'timestamp': datetime.now().isoformat(),
            'issues_found': len(issues),
            'issues': issues,
            'overall_status': 'PASS' if not any(i['severity'] == 'HIGH' for i in issues) else 'FAIL',
            'confidence': round(random.uniform(0.85, 0.98), 2)
        }


def main():
    print("=" * 60)
    print("P3-M3.1: ULD 3D装载优化系统")
    print("=" * 60)
    
    packer = BinPacking3D()
    
    # 生成货物
    packages = packer.generate_demo_packages(n=30)
    print(f"\n货物数量: {len(packages)}")
    print(f"总体积: {packer.calculate_volume(packages):.1f} cbm")
    print(f"总重量: {packer.calculate_weight(packages):.1f} kg")
    
    # ULD尺寸 (B777货舱)
    uld_l, uld_w, uld_h = 600, 240, 230  # cm
    
    # 3D装箱
    print(f"\n执行3D装箱 (ULD: {uld_l}x{uld_w}x{uld_h} cm)...")
    result = packer.pack_3d_greedy(packages, uld_l, uld_w, uld_h)
    
    print(f"\n装箱结果:")
    print(f"  放置数量: {result['package_count']}")
    print(f"  未放置: {result['unpacked']}")
    print(f"  体积利用率: {result['volume_utilization']}%")
    
    # 验证
    validation = packer.validate_placements(
        result['placements'], packages,
        uld_l, uld_w, uld_h
    )
    print(f"\n验证结果: {'通过' if validation['valid'] else '失败'}")
    if validation['errors']:
        print(f"  错误: {validation['errors']}")
    if validation['warnings']:
        print(f"  警告: {validation['warnings']}")
    
    # 3D场景
    scene = packer.generate_3d_scene(
        result['placements'],
        uld_l, uld_w, uld_h
    )
    print(f"\n3D场景: {len(scene['packages'])}个货物对象")
    
    # 质量检测
    detector = LoadQualityDetector()
    quality = detector.detect(b'')
    print(f"\n装载质量检测:")
    print(f"  状态: {quality['overall_status']}")
    print(f"  问题数: {quality['issues_found']}")
    print(f"  置信度: {quality['confidence']*100:.1f}%")
    
    return packer, result


if __name__ == '__main__':
    packer, result = main()
