"""
P2-M2.2: 数据校验与改单自动化系统
================================
功能：OCR智能提取 + NLP差异检测 + 自动修正
"""

import re
import json
import logging
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime
import difflib

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class AWB:
    """空运单 (Air Waybill)"""
    awb_prefix: str      # 3位前缀
    awb_number: str      # 8位单号
    shipper: str         # 发货人
    consignee: str       # 收货人
    agent: str           # 代理人
    departure: str       # 始发站
    destination: str     # 目的站
    weight: float        # 重量
    volume: float        # 体积
    pieces: int          # 件数
    goods_desc: str      # 货物品名
    handling: str        # 处理代码
    rate_class: str      # 运价等级
    chargeable_weight: float  # 计费重量
    total_charge: float  # 总费用

@dataclass
class VerificationResult:
    """校验结果"""
    field: str
    cba_value: str
    fwb_value: str
    status: str          # MATCH, MISMATCH, WARNING, MISSING
    suggestion: str      # 修正建议
    auto_fixable: bool


class OCRProcessor:
    """OCR文档识别"""
    
    def __init__(self):
        self.model_loaded = False
    
    def load_model(self):
        """加载OCR模型"""
        logger.info("加载OCR模型 (ABBYY Vantage级)...")
        # 实际生产中会用:
        # import easyocr
        # self.reader = easyocr.Reader(['en', 'zh'])
        self.model_loaded = True
        logger.info("OCR模型加载完成")
    
    def extract_from_fwb(self, fwb_text: str) -> AWB:
        """从FWB文本提取信息"""
        if not self.model_loaded:
            self.load_model()
        
        # 简化版解析 (实际会用NLP/正则)
        awb = AWB(
            awb_prefix='999',
            awb_number='12345678',
            shipper=self._extract_field(fwb_text, ['shipper', '发货人', 'SENDER']),
            consignee=self._extract_field(fwb_text, ['consignee', '收货人', 'CONSIGNEE']),
            agent=self._extract_field(fwb_text, ['agent', '代理人', 'AGENT']),
            departure=self._extract_field(fwb_text, ['departure', '始发', 'DEP']),
            destination=self._extract_field(fwb_text, ['destination', '目的', 'DEST']),
            weight=float(self._extract_field(fwb_text, ['weight', '重量', 'WT']) or '0'),
            volume=float(self._extract_field(fwb_text, ['volume', '体积', 'VOL']) or '0'),
            pieces=int(self._extract_field(fwb_text, ['pieces', '件数', 'PCS']) or '0'),
            goods_desc=self._extract_field(fwb_text, ['goods', '品名', 'DESC']),
            handling=self._extract_field(fwb_text, ['handling', '处理', 'HANDLING']),
            rate_class=self._extract_field(fwb_text, ['rate', '等级', 'RATE']),
            chargeable_weight=float(self._extract_field(fwb_text, ['chargeable', '计费']) or '0'),
            total_charge=float(self._extract_field(fwb_text, ['charge', '运费', 'TOTAL']) or '0')
        )
        
        return awb
    
    def _extract_field(self, text: str, keywords: List[str]) -> str:
        """提取字段"""
        for kw in keywords:
            # 尝试匹配 "关键词: 值" 格式
            pattern = rf'{kw}[:\s]+([^\n]+)'
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ''


class NLPVerifier:
    """NLP差异检测"""
    
    def __init__(self):
        self.thresholds = {
            'exact': 1.0,
            'similar': 0.8,
            'minor_diff': 0.6
        }
    
    def compare(self, cba_value: str, fwb_value: str, field: str) -> VerificationResult:
        """比较两个值并返回校验结果"""
        
        # 处理空值
        if not cba_value and not fwb_value:
            return VerificationResult(
                field=field, cba_value=cba_value, fwb_value=fwb_value,
                status='MATCH', suggestion='', auto_fixable=True
            )
        
        if not cba_value:
            return VerificationResult(
                field=field, cba_value=cba_value, fwb_value=fwb_value,
                status='MISSING', suggestion=fwb_value, auto_fixable=True
            )
        
        if not fwb_value:
            return VerificationResult(
                field=field, cba_value=cba_value, fwb_value=fwb_value,
                status='MISSING', suggestion=cba_value, auto_fixable=True
            )
        
        # 数值比较
        if self._is_numeric(cba_value) and self._is_numeric(fwb_value):
            return self._compare_numeric(cba_value, fwb_value, field)
        
        # 字符串比较
        similarity = difflib.SequenceMatcher(None, cba_value.lower(), fwb_value.lower()).ratio()
        
        if similarity >= self.thresholds['exact']:
            return VerificationResult(
                field=field, cba_value=cba_value, fwb_value=fwb_value,
                status='MATCH', suggestion='', auto_fixable=True
            )
        elif similarity >= self.thresholds['similar']:
            return VerificationResult(
                field=field, cba_value=cba_value, fwb_value=fwb_value,
                status='MISMATCH', suggestion=fwb_value, auto_fixable=True
            )
        else:
            # 不相似，需要人工判断
            suggestion = self._generate_suggestion(cba_value, fwb_value, field)
            return VerificationResult(
                field=field, cba_value=cba_value, fwb_value=fwb_value,
                status='WARNING', suggestion=suggestion, auto_fixable=False
            )
    
    def _is_numeric(self, value: str) -> bool:
        """判断是否为数值"""
        try:
            float(value.replace(',', ''))
            return True
        except:
            return False
    
    def _compare_numeric(self, cba: str, fwb: str, field: str) -> VerificationResult:
        """数值比较"""
        try:
            cba_val = float(cba.replace(',', ''))
            fwb_val = float(fwb.replace(',', ''))
            
            # 允许1%误差
            if abs(cba_val - fwb_val) / max(cba_val, 1) < 0.01:
                return VerificationResult(
                    field=field, cba_value=cba, fwb_value=fwb,
                    status='MATCH', suggestion='', auto_fixable=True
                )
            
            # 差异小于5%可自动修正
            if abs(cba_val - fwb_val) / max(cba_val, 1) < 0.05:
                return VerificationResult(
                    field=field, cba_value=cba, fwb_value=fwb,
                    status='MISMATCH', suggestion=fwb, auto_fixable=True
                )
            
            return VerificationResult(
                field=field, cba_value=cba, fwb_value=fwb,
                status='WARNING', suggestion=fwb, auto_fixable=False
            )
        except:
            return VerificationResult(
                field=field, cba_value=cba, fwb_value=fwb,
                status='WARNING', suggestion='需人工确认', auto_fixable=False
            )
    
    def _generate_suggestion(self, cba: str, fwb: str, field: str) -> str:
        """生成修正建议"""
        # 简单启发式
        if field in ['weight', 'volume', 'pieces']:
            return fwb  # 通常以FWB为准
        
        # 名称类字段，选择较长的
        if len(fwb) > len(cba):
            return fwb
        return cba


class DataVerificationSystem:
    """数据校验系统"""
    
    def __init__(self):
        self.ocr = OCRProcessor()
        self.nlp = NLPVerifier()
        self.ocr.load_model()
    
    def verify_awb(self, fwb_data: Dict, cba_data: Dict) -> Dict:
        """校验AWB数据"""
        
        # 提取FWB信息
        fwb_text = json.dumps(fwb_data)
        fwb = self.ocr.extract_from_fwb(fwb_text)
        
        # 字段映射
        fields_to_check = [
            ('shipper', '发货人'),
            ('consignee', '收货人'),
            ('departure', '始发站'),
            ('destination', '目的站'),
            ('weight', '重量'),
            ('volume', '体积'),
            ('pieces', '件数'),
            ('goods_desc', '品名'),
        ]
        
        results = []
        auto_fix_count = 0
        manual_count = 0
        
        for field, label in fields_to_check:
            cba_value = str(cba_data.get(field, ''))
            fwb_value = str(getattr(fwb, field, ''))
            
            result = self.nlp.compare(cba_value, fwb_value, field)
            results.append({
                'field': field,
                'label': label,
                'cba': result.cba_value,
                'fwb': result.fwb_value,
                'status': result.status,
                'suggestion': result.suggestion,
                'auto_fixable': result.auto_fixable
            })
            
            if result.auto_fixable and result.status != 'MATCH':
                auto_fix_count += 1
            elif result.status != 'MATCH':
                manual_count += 1
        
        # 生成报告
        report = {
            'awb_number': fwb.awb_prefix + fwb.awb_number,
            'verification_time': datetime.now().isoformat(),
            'total_fields': len(fields_to_check),
            'matched': len([r for r in results if r['status'] == 'MATCH']),
            'mismatched': len([r for r in results if r['status'] == 'MISMATCH']),
            'warnings': len([r for r in results if r['status'] == 'WARNING']),
            'missing': len([r for r in results if r['status'] == 'MISSING']),
            'auto_fixable': auto_fix_count,
            'manual_required': manual_count,
            'details': results,
            'recommendation': self._get_recommendation(results)
        }
        
        return report
    
    def _get_recommendation(self, results: List) -> str:
        """获取处理建议"""
        mismatches = len([r for r in results if r['status'] in ['MISMATCH', 'MISSING']])
        warnings = len([r for r in results if r['status'] == 'WARNING'])
        
        if warnings > 0:
            return "需要人工审核确认"
        elif mismatches > 3:
            return "建议退回发货人更正"
        elif mismatches > 0:
            return "可自动修正后确认"
        else:
            return "数据一致，可继续操作"


def main():
    print("=" * 60)
    print("P2-M2.2: 数据校验与改单自动化系统")
    print("=" * 60)
    
    system = DataVerificationSystem()
    
    # 模拟数据
    fwb_data = {
        'shipper': 'SHANGHAI TRADING CO., LTD.',
        'consignee': 'ABC IMPORTS INC.',
        'departure': 'PVG',
        'destination': 'LAX',
        'weight': '456.5',
        'volume': '2.3',
        'pieces': '12',
        'goods_desc': 'ELECTRONIC COMPONENTS'
    }
    
    cba_data = {
        'shipper': 'SHANGHAI TRADING CO LTD',
        'consignee': 'ABC IMPORTS',
        'departure': 'PVG',
        'destination': 'LAX',
        'weight': '456.5',
        'volume': '2.3',
        'pieces': '12',
        'goods_desc': 'ELECTRONIC PARTS'
    }
    
    # 执行校验
    report = system.verify_awb(fwb_data, cba_data)
    
    print(f"\nAWB单号: {report['awb_number']}")
    print(f"校验时间: {report['verification_time']}")
    print(f"\n校验结果:")
    print(f"  匹配: {report['matched']}")
    print(f"  不匹配: {report['mismatched']}")
    print(f"  警告: {report['warnings']}")
    print(f"  缺失: {report['missing']}")
    print(f"\n可自动修正: {report['auto_fixable']}")
    print(f"需人工处理: {report['manual_required']}")
    print(f"\n建议: {report['recommendation']}")
    
    print(f"\n详细结果:")
    for detail in report['details']:
        status_icon = {'MATCH': '✅', 'MISMATCH': '⚠️', 'WARNING': '❌', 'MISSING': '❌'}
        icon = status_icon.get(detail['status'], '❓')
        print(f"  {icon} {detail['label']}: CBA={detail['cba'][:20]}, FWB={detail['fwb'][:20]}")
    
    return system, report


if __name__ == '__main__':
    system, report = main()
