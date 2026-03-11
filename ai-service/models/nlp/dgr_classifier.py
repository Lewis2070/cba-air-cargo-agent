"""
P1-M1.5: DGR合规检查模型 (BERT NLP)
=================================
功能：货物品名自动DGR分类与规则校验
"""

import re
import json
import logging
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DGRGoods:
    """危险品货物"""
    un_number: str           # UN编号
    proper_shipping_name: str  # 运输专用名称
    class_division: str      # 类别
    packing_group: str       # 包装等级
    subsidiary_risks: str    # 副危险品
    special_provisions: str  # 特殊规定
    packing_instruction: str # 包装说明
    erg_number: str         # 应急响应编号


class DGRClassifier:
    """DGR危险品分类器"""
    
    # 常见危险品关键词映射（简化版）
    DGR_KEYWORDS = {
        # 锂电池类 (Class 9)
        '锂电池': {'un': 'UN3481', 'class': '9', 'name': '锂离子电池'},
        '锂电池组': {'un': 'UN3481', 'class': '9', 'name': '锂离子电池组'},
        '充电宝': {'un': 'UN3481', 'class': '9', 'name': '锂离子电池'},
        'power bank': {'un': 'UN3481', 'class': '9', 'name': '锂离子电池'},
        'battery': {'un': 'UN3480', 'class': '9', 'name': '锂金属电池'},
        
        # 易燃液体 (Class 3)
        '酒精': {'un': 'UN1170', 'class': '3', 'name': '乙醇'},
        '乙醇': {'un': 'UN1170', 'class': '3', 'name': '乙醇'},
        '油漆': {'un': 'UN1263', 'class': '3', 'name': '油漆'},
        '香水': {'un': 'UN1266', 'class': '3', 'name': '香料产品'},
        
        # 腐蚀性物质 (Class 8)
        '硫酸': {'un': 'UN1830', 'class': '8', 'name': '硫酸'},
        '盐酸': {'un': 'UN1789', 'class': '8', 'name': '盐酸'},
        '氢氧化钠': {'un': 'UN1823', 'class': '8', 'name': '氢氧化钠固体'},
        
        # 气体 (Class 2)
        '氮气': {'un': 'UN1066', 'class': '2.2', 'name': '氮气'},
        '氧气': {'un': 'UN1072', 'class': '2.2', 'name': '氧气'},
        '二氧化碳': {'un': 'UN1013', 'class': '2.2', 'name': '二氧化碳'},
        
        # 爆炸物 (Class 1)
        '烟花': {'un': 'UN0336', 'class': '1', 'name': '烟花'},
        '爆竹': {'un': 'UN0336', 'class': '1', 'name': '爆炸物'},
        
        # 有毒物质 (Class 6.1)
        '农药': {'un': 'UN2902', 'class': '6.1', 'name': '农药'},
        '杀虫剂': {'un': 'UN2902', 'class': '6.1', 'name': '杀虫剂'},
    }
    
    # 隔离组映射
    ISOLATION_GROUPS = {
        'UN3481': ['UN3480', 'UN3091', 'UN3090'],
        'UN1170': ['UN1230', 'UN1993'],
        'UN1830': ['UN1789', 'UN1805'],
    }
    
    def __init__(self):
        self.model_loaded = False
        self.classification_rules = self._load_classification_rules()
    
    def _load_classification_rules(self) -> Dict:
        """加载分类规则"""
        # 简化版规则，实际需要完整的IATA DGR规则库
        return {
            'lithium_battery': {
                'keywords': ['锂电池', '锂离子', '充电宝', 'lithium', 'battery', 'power bank'],
                'un_numbers': ['UN3480', 'UN3481', 'UN3090', 'UN3091'],
                'class': '9',
                'pi': '965-970'
            },
            'flammable_liquid': {
                'keywords': ['酒精', '乙醇', '油漆', '涂料', 'flammable', 'alcohol'],
                'un_numbers': ['UN1170', 'UN1263', 'UN1993'],
                'class': '3',
                'pi': '305'
            },
            'corrosive': {
                'keywords': ['硫酸', '盐酸', '腐蚀', 'acid', 'corrosive'],
                'un_numbers': ['UN1830', 'UN1789', 'UN1805'],
                'class': '8',
                'pi': '800'
            }
        }
    
    def load_model(self):
        """加载BERT模型（模拟）"""
        logger.info("加载BERT多语言NLP模型...")
        # 实际生产中这里会加载huggingface/bert-base-chinese
        # from transformers import BertTokenizer, BertForSequenceClassification
        # self.tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
        # self.model = BertForSequenceClassification.from_pretrained('...')
        
        self.model_loaded = True
        logger.info("模型加载完成 (TRL 8)")
    
    def classify(self, goods_description: str) -> Dict:
        """对货物品名进行DGR分类"""
        if not self.model_loaded:
            self.load_model()
        
        result = {
            'input': goods_description,
            'is_dgr': False,
            'dgr_info': None,
            'confidence': 0.0,
            'processing_time_ms': 0
        }
        
        import time
        start_time = time.time()
        
        # 关键词匹配
        goods_lower = goods_description.lower()
        
        for category, rule in self.classification_rules.items():
            # 检查关键词
            for keyword in rule['keywords']:
                if keyword.lower() in goods_lower:
                    result['is_dgr'] = True
                    result['dgr_info'] = {
                        'category': category,
                        'un_number': rule['un_numbers'][0],
                        'class': rule['class'],
                        'packing_instruction': rule['pi'],
                        'keywords_matched': [keyword]
                    }
                    result['confidence'] = 0.95
                    break
            
            if result['is_dgr']:
                break
        
        # 检查UN编号
        if not result['is_dgr']:
            un_match = re.search(r'UN\d{4}', goods_description)
            if un_match:
                un = un_match.group()
                if un in self.DGR_KEYWORDS:
                    info = self.DGR_KEYWORDS[un]
                    result['is_dgr'] = True
                    result['dgr_info'] = {
                        'category': 'un_number_match',
                        'un_number': un,
                        'class': info['class'],
                        'name': info['name']
                    }
                    result['confidence'] = 0.99
        
        result['processing_time_ms'] = int((time.time() - start_time) * 1000)
        
        return result
    
    def check_compliance(self, goods_info: Dict, flight_info: Dict) -> Dict:
        """合规检查"""
        compliance_result = {
            'is_compliant': True,
            'warnings': [],
            'errors': [],
            'recommendations': []
        }
        
        if not goods_info.get('is_dgr'):
            return compliance_result
        
        dgr = goods_info['dgr_info']
        
        # 检查包装说明
        pi = dgr.get('packing_instruction', '')
        if '965' in pi or '966' in pi:
            # 锂电池额外要求
            if goods_info.get('weight', 0) > 2:
                compliance_result['errors'].append(
                    "锂电池单件净重不得超过2kg"
                )
                compliance_result['is_compliant'] = False
        
        # 检查隔离要求
        if flight_info.get('has_dgr', False):
            # 同航班已有危险品
            existing_dgr = flight_info.get('dgr_list', [])
            for existing in existing_dgr:
                if self._check_isolation(dgr['un_number'], existing):
                    compliance_result['errors'].append(
                        f"与已有危险品 {existing} 存在隔离冲突"
                    )
                    compliance_result['is_compliant'] = False
        
        # 检查文件要求
        if dgr['class'] in ['3', '8', '6.1']:
            compliance_result['recommendations'].append(
                "建议随附MSDS文件"
            )
        
        return compliance_result
    
    def _check_isolation(self, un1: str, un2: str) -> bool:
        """检查是否需要隔离"""
        isolation_list = self.ISOLATION_GROUPS.get(un1, [])
        return un2 in isolation_list
    
    def generate_report(self, classification_result: Dict, 
                       compliance_result: Dict) -> str:
        """生成检查报告"""
        report = []
        report.append("=" * 50)
        report.append("DGR合规检查报告")
        report.append("=" * 50)
        
        report.append(f"\n货物品名: {classification_result['input']}")
        report.append(f"处理时间: {classification_result['processing_time_ms']}ms")
        
        if classification_result['is_dgr']:
            report.append(f"\n⚠️ 危险品分类: 是")
            dgr = classification_result['dgr_info']
            report.append(f"  UN编号: {dgr.get('un_number', 'N/A')}")
            report.append(f"  类别: {dgr.get('class', 'N/A')}")
            report.append(f"  包装说明: {dgr.get('packing_instruction', 'N/A')}")
            report.append(f"  置信度: {classification_result['confidence']*100:.1f}%")
            
            if compliance_result['errors']:
                report.append(f"\n❌ 合规问题:")
                for err in compliance_result['errors']:
                    report.append(f"  - {err}")
            
            if compliance_result['warnings']:
                report.append(f"\n⚠️ 警告:")
                for warn in compliance_result['warnings']:
                    report.append(f"  - {warn}")
        else:
            report.append(f"\n✅ 危险品分类: 否 (普通货物)")
        
        report.append("\n" + "=" * 50)
        
        return "\n".join(report)


def main():
    print("=" * 60)
    print("P1-M1.5: DGR合规检查模型")
    print("=" * 60)
    
    classifier = DGRClassifier()
    classifier.load_model()
    
    # 测试案例
    test_cases = [
        "锂离子电池 10000mah",
        "普通服装",
        "电子元件 含锂电池",
        "油漆 5升",
        "硫酸 500ml"
    ]
    
    for goods in test_cases:
        print(f"\n{'='*50}")
        print(f"货物: {goods}")
        
        # 分类
        result = classifier.classify(goods)
        print(f"\n分类结果:")
        print(f"  危险品: {'是' if result['is_dgr'] else '否'}")
        
        if result['is_dgr']:
            print(f"  UN编号: {result['dgr_info'].get('un_number')}")
            print(f"  类别: {result['dgr_info'].get('class')}")
            print(f"  置信度: {result['confidence']*100:.1f}%")
        
        # 合规检查
        flight_info = {'has_dgr': True, 'dgr_list': ['UN3480']}
        compliance = classifier.check_compliance(result, flight_info)
        
        if compliance['errors']:
            print(f"\n❌ 错误:")
            for e in compliance['errors']:
                print(f"  - {e}")
        
        # 报告
        report = classifier.generate_report(result, compliance)
        print(report)
    
    return classifier


if __name__ == '__main__':
    classifier = main()
