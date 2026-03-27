// WnBChart.tsx - 载重平衡包线图
import React from 'react';
import { Text } from 'antd';

interface WnBProps { cg: number; totalWeight: number; }

export default function WnBChart({ cg, totalWeight }: WnBProps) {
  const W = 280, H = 195, PL = 34, PR = 8, PT = 10, PB = 28;
  const cW = W - PL - PR, cH = H - PT - PB;
  const maxKG = 200000, maxMAC = 45;
  const xv = (mac: number) => PL + (mac / maxMAC) * cW;
  const yv = (kg: number) => PT + cH - (kg / maxKG) * cH;

  const take_off = [{mac:9,kg:90000},{mac:9,kg:186880},{mac:33,kg:186880},{mac:33,kg:90000},{mac:9,kg:90000}];
  const landing = [{mac:9,kg:80000},{mac:9,kg:170500},{mac:38,kg:170500},{mac:38,kg:80000},{mac:9,kg:80000}];
  const mzfw = [{mac:11,kg:50000},{mac:11,kg:149478},{mac:36,kg:149478},{mac:36,kg:50000},{mac:11,kg:50000}];

  const toPts = take_off.map(p => `${xv(p.mac)},${yv(p.kg)}`).join(' ');
  const ldPts = landing.map(p => `${xv(p.mac)},${yv(p.kg)}`).join(' ');
  const mzPts = mzfw.map(p => `${xv(p.mac)},${yv(p.kg)}`).join(' ');
  const curX = xv(cg);
  const curY = Math.min(Math.max(yv(totalWeight + 98600), PT), PT + cH);
  const ok = cg >= 9 && cg <= 33;

  return (
    <div>
      <svg width={W} height={H}>
        {[0,50000,100000,150000,200000].map(kg => (
          <g key={kg}>
            <line x1={PL} y1={yv(kg)} x2={PL+cW} y2={yv(kg)} stroke="#E2E8F0" strokeWidth={0.5} strokeDasharray="3,3"/>
            <text x={PL-3} y={yv(kg)+4} textAnchor="end" fontSize={8} fill="#94A3B8">{(kg/1000).toFixed(0)}t</text>
          </g>
        ))}
        {[0,10,20,30,40].map(mac => (
          <g key={mac}>
            <line x1={xv(mac)} y1={PT} x2={xv(mac)} y2={PT+cH} stroke="#E2E8F0" strokeWidth={0.5} strokeDasharray="3,3"/>
            <text x={xv(mac)} y={PT+cH+12} textAnchor="middle" fontSize={8} fill="#94A3B8">{mac}%</text>
          </g>
        ))}
        <polygon points={toPts} fill="#FEE2E2" stroke="#DC2626" strokeWidth={1.5}/>
        <polygon points={ldPts} fill="#DCFCE7" stroke="#16A34A" strokeWidth={1.5}/>
        <polygon points={mzPts} fill="#FFFBEB" stroke="#B45309" strokeWidth={1} strokeDasharray="4,2"/>
        <polyline points={take_off.map(p=>`${xv(p.mac)},${yv(p.kg)}`).join(' ')} fill="none" stroke="#DC2626" strokeWidth={2} strokeDasharray="5,2"/>
        <polyline points={landing.map(p=>`${xv(p.mac)},${yv(p.kg)}`).join(' ')} fill="none" stroke="#16A34A" strokeWidth={2}/>
        <circle cx={xv(18.5)} cy={yv(98600)} r={3} fill="#374151"/>
        <text x={xv(18.5)+4} y={yv(98600)-3} fontSize={7} fill="#6B7280">OEW</text>
        {totalWeight > 0 && (
          <>
            <line x1={curX} y1={PT} x2={curX} y2={PT+cH} stroke={ok?'#2563EB':'#DC2626'} strokeWidth={1.5} strokeDasharray="4,2"/>
            <circle cx={curX} cy={curY} r={5} fill={ok?'#2563EB':'#DC2626'} stroke="#fff" strokeWidth={1.5}/>
          </>
        )}
        <text x={PL+cW/2} y={H-2} textAnchor="middle" fontSize={8} fill="#374151" fontWeight={600}>重心 %MAC</text>
      </svg>
      <div style={{textAlign:'center',marginTop:4}}>
        <Text style={{fontSize:12,color:ok?'#16A34A':'#DC2626',fontWeight:700}}>
          {ok?'✓':'⚠'} CG: {cg.toFixed(1)}% MAC | {(totalWeight+98600).toLocaleString()}kg
        </Text>
      </div>
    </div>
  );
}
