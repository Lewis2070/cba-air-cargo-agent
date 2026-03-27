// CBA v5.1 智能排舱系统（四修复完整版）
import React,{useState,useMemo}from'react';
import{Card,Table,Button,Select,Tag,Space,Divider,Modal,Alert,Badge,Tooltip,message,Row,Col,Typography,Progress}from'antd';
import{ThunderboltOutlined,ReloadOutlined,CheckCircleOutlined,ExclamationCircleOutlined,DeleteOutlined,DragOutlined}from'@ant-design/icons';
import{getMainDeckPositions,getNosePositions,getLowerFwdPositions,getLowerAftPositions,calculateCG}from'../data/hold_positions';
import{findULDType,rateFill}from'../data/uld_specs';
import{checkULDCompatibility}from'../data/dgr_rules';
const{Text}=Typography;
type Cat='normal'|'dgr'|'live_animal'|'perishable';
interface CI{id:string;awb:string;description:string;agent:string;pieces:number;weight_kg:number;length_cm:number;width_cm:number;height_cm:number;volume_m3:number;chargeableWeight_kg:number;category:Cat;dgr_class?:string;un_number?:string;temperature?:string;fee_per_kg:number}
interface UI{id:string;uld_code:string;uld_name:string;uld_full_name:string;cargoItems:CI[];deck:'main'|'lower';position?:string;dims:{l_cm:number;w_cm:number;h_cm:number};max_load_kg:number;volume_m3:number}
const MOCK:CI[]=[
{id:'C001',awb:'999-12345678',description:'电子元器件',agent:'深圳华信货运',pieces:2,weight_kg:450,length_cm:100,width_cm:80,height_cm:60,volume_m3:0.48,chargeableWeight_kg:450,category:'normal',fee_per_kg:8.5},
{id:'C002',awb:'999-12345679',description:'锂电池设备',agent:'广州中贸货运',pieces:1,weight_kg:320,length_cm:80,width_cm:60,height_cm:50,volume_m3:0.24,chargeableWeight_kg:320,category:'dgr',dgr_class:'9',un_number:'UN3481',fee_per_kg:12.0},
{id:'C003',awb:'999-12345680',description:'纺织品',agent:'上海德祥货运',pieces:5,weight_kg:680,length_cm:120,width_cm:100,height_cm:80,volume_m3:0.96,chargeableWeight_kg:680,category:'normal',fee_per_kg:6.5},
{id:'C004',awb:'999-12345681',description:'鲜活大闸蟹',agent:'顺丰冷链',pieces:3,weight_kg:120,length_cm:40,width_cm:40,height_cm:30,volume_m3:0.048,chargeableWeight_kg:120,category:'live_animal',temperature:'chill',fee_per_kg:22.0},
{id:'C005',awb:'999-12345682',description:'进口药品',agent:'北京华润医药',pieces:2,weight_kg:85,length_cm:40,width_cm:30,height_cm:25,volume_m3:0.03,chargeableWeight_kg:85,category:'perishable',temperature:'chill',fee_per_kg:28.0},
{id:'C006',awb:'999-12345683',description:'香水(易燃)',agent:'上海化工物流',pieces:4,weight_kg:95,length_cm:30,width_cm:30,height_cm:20,volume_m3:0.018,chargeableWeight_kg:95,category:'dgr',dgr_class:'3',un_number:'UN1266',fee_per_kg:15.0},
{id:'C007',awb:'999-12345684',description:'机械零件',agent:'振华重工物流',pieces:1,weight_kg:1200,length_cm:150,width_cm:120,height_cm:100,volume_m3:1.80,chargeableWeight_kg:1200,category:'normal',fee_per_kg:7.0},
{id:'C008',awb:'999-12345685',description:'生鲜水果',agent:'广州冷链',pieces:10,weight_kg:200,length_cm:50,width_cm:40,height_cm:30,volume_m3:0.06,chargeableWeight_kg:200,category:'perishable',temperature:'ambient',fee_per_kg:14.0},
{id:'C009',awb:'999-12345686',description:'有机过氧化物',agent:'江苏化工',pieces:2,weight_kg:60,length_cm:25,width_cm:25,height_cm:20,volume_m3:0.013,chargeableWeight_kg:60,category:'dgr',dgr_class:'5.2',un_number:'UN3101',fee_per_kg:25.0},
{id:'C010',awb:'999-12345687',description:'活体宠物犬',agent:'北京宠运',pieces:1,weight_kg:15,length_cm:60,width_cm:40,height_cm:35,volume_m3:0.084,chargeableWeight_kg:15,category:'live_animal',temperature:'ambient',fee_per_kg:38.0},
{id:'C011',awb:'999-12345688',description:'服装',agent:'广州白云货运',pieces:8,weight_kg:520,length_cm:100,width_cm:80,height_cm:60,volume_m3:0.48,chargeableWeight_kg:520,category:'normal',fee_per_kg:6.0},
{id:'C012',awb:'999-12345689',description:'锂电池',agent:'深圳锂电池货运',pieces:2,weight_kg:250,length_cm:60,width_cm:50,height_cm:40,volume_m3:0.12,chargeableWeight_kg:250,category:'dgr',dgr_class:'9',un_number:'UN3481',fee_per_kg:12.0},
];
const CC:Record<string,string>={normal:'#3B82F6',dgr:'#EF4444',live_animal:'#16A34A',perishable:'#F59E0B'};
const CT:Record<string,{t:string;c:string}>={normal:{t:'普通',c:'default'},dgr:{t:'危险品',c:'error'},live_animal:{t:'活体',c:'success'},perishable:{t:'生鲜',c:'warning'}};
function U3D({u,onRem}:{u:UI;onRem:(id:string)=>void}){
const ud=findULDType(u.uld_code);
const totV=u.cargoItems.reduce((s,c)=>s+c.volume_m3,0);
const fi=rateFill(totV,u.uld_code);const maxV=ud?.volume_m3||3.66;
const totW=u.cargoItems.reduce((s,c)=>s+c.weight_kg,0);const remV=Math.max(0,maxV-totV);
const CL=148,CW=36,CH=90,MD=200;
function sc(c:CI){return{l:Math.max(4,Math.min((c.length_cm/MD)*CL*0.87,CL*0.85)),h:Math.max(4,Math.min((c.height_cm/MD)*CH*0.85,CH*0.83))};}
return(<div style={{position:'relative'}}>
<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
<Space size={4}><Tag color={u.deck==='main'?'blue':'green'} style={{margin:0,fontSize:10}}>{u.uld_code}</Tag><Text style={{fontSize:10,color:'#64748B'}}>{u.uld_full_name}</Text>{u.position&&<Tag color="cyan" style={{fontSize:9}}>{u.position}</Tag>}</Space>
<Button size="small" type="text" icon={<DeleteOutlined/>} onClick={()=>onRem(u.id)} style={{color:'#EF4444',fontSize:10,padding:0,width:16,height:16}}/></div>
<div style={{perspective:500,display:'flex',justifyContent:'center',marginBottom:6}}>
<div style={{width:CL+CW+4,height:CH+14,position:'relative',transformStyle:'preserve-3d',transform:'rotateX(-18deg) rotateY(-28deg)'}}>
<div style={{position:'absolute',bottom:CW,left:0,width:CL,height:CH,background:'rgba(30,78,138,0.09)',border:'2px solid #1E4E8A',transform:`translateZ(${CW}px)`,borderRadius:3,overflow:'hidden',display:'flex',flexWrap:'wrap',gap:2,padding:3,alignContent:'flex-start',alignItems:'flex-start'}}>
<div style={{position:'absolute',inset:0,opacity:0.1,pointerEvents:'none',backgroundImage:'linear-gradient(#1E4E8A 1px,transparent 1px),linear-gradient(90deg,#1E4E8A 1px,transparent 1px)',backgroundSize:'14px 14px'}}/>
{u.cargoItems.map(c=>{const s=sc(c);return(
<Tooltip key={c.id} title={<div style={{fontSize:10,lineHeight:1.8}}><b style={{fontSize:11}}>{c.awb}</b><br/>{c.description}<br/><span style={{color:'#93C5FD'}}>{c.length_cm}x{c.width_cm}x{c.height_cm}cm</span><br/>{c.weight_kg}kg | {c.volume_m3}m3<br/>{c.dgr_class&&<span style={{color:'#FCA5A5'}}>!! {c.dgr_class}类 {c.un_number}</span>}{c.category==='live_animal'&&<span> 活体</span>}{c.category==='perishable'&&<span> 生鲜{c.temperature==='chill'?'冷藏':'常温'}</span></div>}>
<div style={{width:s.l,height:s.h,background:CC[c.category],borderRadius:2,border:c.category!=='normal'?'1.5px solid rgba(255,255,255,0.8)':'none',boxShadow:'0 1px 4px rgba(0,0,0,0.4)',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',zIndex:1,overflow:'hidden'}}>
{s.l>26&&s.h>12&&<Text style={{fontSize:5.5,color:'#fff',fontWeight:700,textAlign:'center',lineHeight:1.1,padding:'0 1px'}}>{c.awb.split('-')[1]?.slice(-4)}</Text>}
</div></Tooltip>);})}
{u.cargoItems.length===0&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:9,color:'#94A3B8'}}>拖入货物</Text></div>}
</div>
<div style={{position:'absolute',bottom:0,left:0,width:CW,height:CH,background:'rgba(30,78,138,0.22)',border:'2px solid #1E4E8A',transform:`rotateY(-90deg)`,borderRadius:'3px 0 0 3px'}}><div style={{display:'flex',flexDirection:'column',gap:2,padding:3,height:'100%',overflow:'hidden'}}>{u.cargoItems.slice(0,8).map(c=><div key={c.id} style={{height:5,background:CC[c.category],borderRadius:1,opacity:0.7,flexShrink:0}}/>)}</div></div>
<div style={{position:'absolute',bottom:CW+CH-2,left:0,width:CL,height:CW,background:'rgba(30,78,138,0.14)',border:'2px solid #1E4E8A',transform:`rotateX(90deg)`,borderRadius:'3px 3px 0 0'}}/>
</div></div>
<Progress percent={Math.min(100,(totV/maxV)*100)} size="small" strokeColor={fi.color} trailColor="#E2E8F0" format={()=><Text style={{fontSize:8,color:'#64748B'}}>{fi.label}</Text>} style={{margin:'0 0 4px'}}/>
<div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
<Tag color={fi.color} style={{fontSize:9,margin:0}}>{fi.label}</Tag>
<Text style={{fontSize:9,color:'#64748B'}}>{u.cargoItems.length}件</Text>
<Text style={{fontSize:9,color:'#64748B'}}>{totW}kg</Text>
<Text style={{fontSize:9,color:'#64748B'}}>{totV.toFixed(2)}/{maxV}m3</Text>
<Text style={{fontSize:9,color:remV>maxV*0.3?'#F59E0B':'#16A34A',fontWeight:600}}>余{remV.toFixed(2)}m3</Text>
</div>
{u.cargoItems.length>0&&<div style={{marginTop:4,borderTop:'1px solid #F1F5F9',paddingTop:4,maxHeight:60,overflowY:'auto'}}>{u.cargoItems.map(c=>(
<div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'1px 0',borderBottom:'1px solid #F8FAFC'}}>
<div style={{minWidth:0,flex:1}}><Text style={{fontSize:9.5,color:CC[c.category],overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block'}}>{c.awb} {c.description}</Text><Text style={{fontSize:8.5,color:'#94A3B8'}}>{c.length_cm}x{c.width_cm}x{c.height_cm}cm | {c.weight_kg}kg | {c.volume_m3}m3</Text></div>
<Button size="small" type="text" icon={<DeleteOutlined/>} onClick={()=>onRem(c.id)} style={{fontSize:8,color:'#CBD5E1',padding:0,width:14,height:14,flexShrink:0}}/></div>))}</div>}
</div>);}
function WnB({cg,tw}:{cg:number;tw:number}){
const W=280,H=192,PL=34,PR=8,PT=10,PB=28;const cW=W-PL-PR,cH=H-PT-PB;
const mk=200000,mm=45;const xv=(m:number)=>PL+(m/mm)*cW;const yv=(k:number)=>PT+cH-(k/mk)*cH;
const to=[{m:9,k:90000},{m:9,k:186880},{m:33,k:186880},{m:33,k:90000},{m:9,k:90000}];
const ld=[{m:9,k:80000},{m:9,k:170500},{m:38,k:170500},{m:38,k:80000},{m:9,k:80000}];
const mz=[{m:11,k:50000},{m:11,k:149478},{m:36,k:149478},{m:36,k:50000},{m:11,k:50000}];
const toP=to.map(p=>`${xv(p.m)},${yv(p.k)}`).join(' ');const ldP=ld.map(p=>`${xv(p.m)},${yv(p.k)}`).join(' ');const mzP=mz.map(p=>`${xv(p.m)},${yv(p.k)}`).join(' ');
const cX=xv(cg),cY=Math.min(Math.max(yv(tw+98600),PT),PT+cH);const ok=cg>=9&&cg<=33;
return(<div><svg width={W} height={H}>
{[0,50000,100000,150000,200000].map(kg=>(<g key={kg}><line x1={PL} y1={yv(kg)} x2={PL+cW} y2={yv(kg)} stroke="#E2E8F0" strokeWidth={0.5} strokeDasharray="3,3"/><text x={PL-3} y={yv(kg)+4} textAnchor="end" fontSize={8} fill="#94A3B8">{(kg/1000).toFixed(0)}t</text></g>))}
{[0,10,20,30,40].map(mac=>(<g key={mac}><line x1={xv(mac)} y1={PT} x2={xv(mac)} y2={PT+cH} stroke="#E2E8F0" strokeWidth={0.5} strokeDasharray="3,3"/><text x={xv(mac)} y={PT+cH+12} textAnchor="middle" fontSize={8} fill="#94A3B8">{mac}%</text></g>))}
<polygon points={toP} fill="#FEE2E2" stroke="#DC2626" strokeWidth={1.5}/><polygon points={ldP} fill="#DCFCE7" stroke="#16A34A" strokeWidth={1.5}/><polygon points={mzP} fill="#FFFBEB" stroke="#B45309" strokeWidth={1} strokeDasharray="4,2"/>
<polyline points={to.map(p=>`${xv(p.m)},${yv(p.k)}`).join(' ')} fill="none" stroke="#DC2626" strokeWidth={2} strokeDasharray="5,2"/><polyline points={ld.map(p=>`${xv(p.m)},${yv(p.k)}`).join(' ')} fill="none" stroke="#16A34A" strokeWidth={2}/>
<circle cx={xv(18.5)} cy={yv(98600)} r={3} fill="#374151"/><text x={xv(18.5)+4} y={yv(98600)-3} fontSize={7} fill="#6B7280">OEW</text>
{tw>0&&(<><line x1={cX} y1={PT} x2={cX} y2={PT+cH} stroke={ok?'#2563EB':'#DC2626'} strokeWidth={1.5} strokeDasharray="4,2"/><circle cx={cX} cy={cY} r={5} fill={ok?'#2563EB':'#DC2626'} stroke="#fff" strokeWidth={1.5}/></>)}
<text x={PL+cW/2} y={H-2} textAnchor="middle" fontSize={8} fill="#374151" fontWeight={600}>重心 %MAC</text></svg>
<div style={{textAlign:'center',marginTop:4}}><Text style={{fontSize:12,color:ok?'#16A34A':'#DC2626',fontWeight:700}}>{ok?'✓':'⚠'} CG:{cg.toFixed(1)}% MAC | {(tw+98600).toLocaleString()}kg</Text></div></div>);}
function CargoList({list,ulds,onDrag}:{list:CI[];ulds:UI[];onDrag:(e:React.DragEvent,id:string)=>void}){
const cols=[{title:'AWB票号',dataIndex:'awb',width:132,render:(t:string)=><Text style={{fontSize:11,fontFamily:'monospace',color:'#1F4E79',fontWeight:600}}>{t}</Text>,sorter:(a:CI,b:CI)=>a.awb.localeCompare(b.awb)},
{title:'物品名称',dataIndex:'description',width:88,render:(t:string)=><Text style={{fontSize:11}}>{t}</Text>},
{title:'代理名称',dataIndex:'agent',width:88,render:(t:string)=><Text style={{fontSize:10,color:'#64748B'}}>{t}</Text>},
{title:'特货信息',dataIndex:'category',width:140,render:(cat:Cat,r:CI)=><Space size={2} wrap>{<Tag color={CT[cat].c} style={{fontSize:9,margin:0,borderRadius:10}}>{CT[cat].t}</Tag>{cat==='dgr'&&r.dgr_class&&<Tag style={{fontSize:9,margin:0,color:'#EF4444',borderColor:'#EF4444'}}>{r.dgr_class}类</Tag>}{cat==='dgr'&&r.un_number&&<Tag style={{fontSize:8,margin:0,color:'#EF4444'}}>{r.un_number}</Tag>}{cat==='live_animal'&&<Tag style={{fontSize:9,margin:0}}>🐾</Tag>}{cat==='perishable'&&r.temperature&&<Tag style={{fontSize:9,margin:0}}>{r.temperature==='chill'?'❄冷藏':'常温'}</Tag>}</Space>,filters:[{text:'危险品',value:'dgr'},{text:'活体动物',value:'live_animal'},{text:'生鲜货物',value:'perishable'},{text:'普通货物',value:'normal'}],onFilter:(v:any,r:CI)=>r.category===v},
{title:'件数',dataIndex:'pieces',width:48,render:(v:number)=><Text style={{fontSize:11,fontWeight:600}}>{v}件</Text>,sorter:(a:CI,b:CI)=>a.pieces-b.pieces},
{title:'重量kg',dataIndex:'weight_kg',width:68,render:(v:number)=><Text style={{fontSize:11,fontWeight:700}}>{v}</Text>,sorter:(a:CI,b:CI)=>a.weight_kg-b.weight_kg},
{title:'体积m3',dataIndex:'volume_m3',width:66,render:(v:number)=><Text style={{fontSize:11,color:'#64748B'}}>{v.toFixed(3)}</Text>,sorter:(a:CI,b:CI)=>a.volume_m3-b.volume_m3},
{title:'尺寸L×W×H(cm)',render:(_:any,r:CI)=><Text style={{fontSize:10,fontFamily:'monospace',color:'#374151'}}>{r.length_cm}×{r.width_cm}×{r.height_cm}</Text>},
{title:'计费重kg',render:(_:any,r:CI)=><Text style={{fontSize:10,color:r.chargeableWeight_kg>r.weight_kg?'#EF4444':'#16A34A',fontWeight:700}}>{r.chargeableWeight_kg}{r.chargeableWeight_kg>r.weight_kg&&<span style={{fontSize:9}}> ⚠</span>}</Text>},
{title:'状态',width:86,render:(_:any,r:CI)=>{const u=ulds.find(u=>u.cargoItems.some(c=>c.id===r.id));return u?<Tag color="blue" style={{fontSize:9}}>{u.uld_code}·{u.position||'未分配'}</Tag>:<Tag style={{fontSize:9,color:'#94A3B8',borderColor:'#E2E8F0'}}>待装载</Tag>}},
{title:'拖→ULD',width:60,render:(_:any,r:CI)=>{const u=ulds.find(u=>u.cargoItems.some(c=>c.id===r.id));if(u)return<Text style={{fontSize:9,color:'#94A3B8'}}>—</Text>;return(<div draggable onDragStart={(e)=>onDrag(e as any,r.id)} style={{cursor:'grab',display:'flex',alignItems:'center',gap:3}}><DragOutlined style={{fontSize:11,color:'#2563EB'}}/><Text style={{fontSize:10,color:'#2563EB'}}>拖拽</Text></div>)}},
];
const tw=list.reduce((s,c)=>s+c.weight_kg,0),tv=list.reduce((s,c)=>s+c.volume_m3,0),dc=list.filter(c=>c.category==='dgr').length,lac=list.filter(c=>c.category==='live_animal').length;
return(<Card size="small" title={<Space size={8}><Text style={{fontSize:13,fontWeight:700,color:'#1F4E79'}}>📦 货物列表</Text><Badge count={list.length} style={{fontSize:10}}/></Space>} extra={<Space size={12} wrap><Text style={{fontSize:10,color:'#64748B'}}>总重:<b>{tw.toLocaleString()}kg</b></Text><Text style={{fontSize:10,color:'#64748B'}}>体积:<b>{tv.toFixed(2)}m3</b></Text>{dc>0&&<Tag color="error" style={{fontSize:9,margin:0}}>⚠危险品{dc}件</Tag>}{lac>0&&<Tag color="success" style={{fontSize:9,margin:0}}>活体{lac}件</Tag>}</Space>} styles={{body:{padding:'8px'}}}><Table size="small" pagination={{pageSize:8}} dataSource={list} rowKey="id" columns={cols} scroll={{x:980,y:380}}/></Card>);}
function ULDBuild({ulds,onRem,onDrop}:{ulds:UI[];onRem:(id:string)=>void;onDrop:(e:React.DragEvent,id:string)=>void}){
const h=(e:React.DragEvent)=>{e.preventDefault();e.dataTransfer.dropEffect='copy';};
return(<Card size="small" title={<Space size={8}><Text style={{fontSize:13,fontWeight:700,color:'#1F4E79'}}>📋 ULD组板工作台</Text><Badge count={ulds.length} style={{fontSize:10}}/></Space>} styles={{body:{padding:8}}}>
{ulds.length===0?<div style={{textAlign:'center',padding:'32px 0'}}><Text style={{color:'#94A3B8',display:'block'}}>暂无ULD，请从左侧拖拽货物或使用下方添加板型</Text></div>:
<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',gap:8}}>{ulds.map(u=>(
<div key={u.id} draggable onDragOver={h} onDrop={(e)=>onDrop(e,u.id)} style={{border:`2px solid ${u.position?'#16A34A':'#E2E8F0'}`,borderRadius:8,padding:8,background:u.position?'#F0FDF4':'#fff',transition:'all 0.15s',cursor:'default'}}><U3D u={u} onRem={onRem}/></div>))}</div>}
</Card>);}
function AircraftHold({ulds,onAssign}:{ulds:UI[];onAssign:(posCode:string)=>void}){
const[deck,setDeck]=useState<'main'|'lower'>('main');
const cgR=useMemo(()=>{const p=ulds.filter(u=>u.position).map(u=>({weight_kg:u.cargoItems.reduce((s,c)=>s+c.weight_kg,0),position_code:u.position!}));return calculateCG(p);},[ulds]);
const gps=deck==='main'?[
{k:'main',l:'主舱MAIN',ps:getMainDeckPositions(),cols:8,col:'#1E4E8A',bg:'#EFF6FF',fb:'#1E4E8A',bd:'#BFDBFE'},
{k:'nose',l:'鼻舱NOSE',ps:getNosePositions(),cols:3,col:'#C2410C',bg:'#FFF7ED',fb:'#C2410C',bd:'#FED7AA'},
]:[
{k:'lf',l:'下舱前L1-L6',ps:getLowerFwdPositions(),cols:4,col:'#065F46',bg:'#ECFDF5',fb:'#065F46',bd:'#A7F3D0'},
{k:'la',l:'下舱后L7-L12',ps:getLowerAftPositions(),cols:4,col:'#059669',bg:'#ECFDF5',fb:'#059669',bd:'#A7F3D0'},
];
return(<Card size="small" title={<Space size={8}><Text style={{fontSize:13,fontWeight:700,color:'#1F4E79'}}>✈️ B767-300BCF 货舱布局</Text><Button size="small" type={deck==='main'?'primary':'default'} onClick={()=>setDeck('main')}>主舱</Button><Button size="small" type={deck==='lower'?'primary':'default'} onClick={()=>setDeck('lower')}>下舱</Button></Space>} styles={{body:{padding:8}}}>
{gps.map(g=>(
<div key={g.k} style={{marginBottom:10}}>
<div style={{fontSize:11,fontWeight:700,color:g.col,marginBottom:4,display:'flex',alignItems:'center',gap:4}}><div style={{width:10,height:10,background:g.col,borderRadius:2}}/>{g.l} ({g.ps.length}位)</div>
<div style={{display:'grid',gridTemplateColumns:`repeat(${g.cols}, 1fr)`,gap:3}}>{g.ps.map(pos=>{
const u=ulds.find(x=>x.position===pos.code);
return(<div key={pos.code} onClick={()=>!u&&onAssign(pos.code)} style={{padding:'3px 2px',minHeight:44,borderRadius:4,border:`1.5px solid ${u?g.fb:g.bd}`,background:u?g.fb:g.bg,cursor:u?'default':'pointer',transition:'all 0.15s',textAlign:'center',position:'relative'}}>
<div style={{fontSize:9,fontWeight:700,color:u?'#fff':g.col}}>{pos.code}</div>
{u?(<><div style={{fontSize:8,color:'rgba(255,255,255,0.85)'}}>{u.uld_code}</div><div style={{fontSize:7.5,color:'rgba(255,255,255,0.7)'}}>{u.cargoItems.reduce((s,c)=>s+c.weight_kg,0)}kg</div></>):(<div style={{fontSize:7.5,color:'#94A3B8'}}>{pos.arm_mac_pct}%</div>)}
</div>);})}</div>
</div>))}
<Divider style={{margin:'8px 0'}}/>
<div style={{marginBottom:4,fontSize:11,fontWeight:600,color:'#1F4E79'}}>📊 载重平衡包线</div>
<WnB cg={cgR.cg_mac_pct} tw={cgR.total_weight_kg}/>
<div style={{marginTop:6,display:'flex',gap:12,flexWrap:'wrap'}}>
<Text style={{fontSize:11}}>已装 <b style={{color:'#059669'}}>{ulds.flatMap(u=>u.cargoItems).length}</b> 件</Text>
<Text style={{fontSize:11}}>ULD <b>{ulds.filter(u=>u.position).length}</b> 个</Text>
<Text style={{fontSize:11}}>总重 <b>{cgR.total_weight_kg.toLocaleString()}kg</b></Text>
<Text style={{fontSize:11}}>CG <b style={{color:cgR.status==='ok'?'#16A34A':'#DC2626'}}>{cgR.cg_mac_pct}%</b></Text>
</div>
</Card>);}
export default function LoadPlanningPage(){
const[ulds,setUlds]=useState<UI[]>([]);
const[planVis,setPlanVis]=useState(false);
const[plan,setPlan]=useState<UI[]|null>(null);
const cargoList=MOCK;
const handleDrag=(e:React.DragEvent,id:string)=>{e.dataTransfer.setData("cargoId",id);};
const handleUldDrop=(e:React.DragEvent,uldId:string)=\>{e.preventDefault();const cid=e.dataTransfer.getData("cargoId");if(!cid)return;const cargo=cargoList.find(c=>c.id===cid);if(!cargo)return;setUlds(prev=>prev.map(u=>u.id!==uldId?u:{...u,cargoItems:[...u.cargoItems,cargo]}));};
const addUld=(code:string)=\>{const ud=findULDType(code);setUlds(prev=>[...prev,{id:`U-${Date.now()}`,uld_code:code,uld_name:ud?.common_names[0]||code,uld_full_name:ud?.full_name||code,cargoItems:[],deck:ud?.compatible_deck[0]==="main"?"main":"lower",dims:{l_cm:ud?.length_cm||0,w_cm:ud?.width_cm||0,h_cm:ud?.height_cm||0},max_load_kg:ud?.max_load_kg||0,volume_m3:ud?.volume_m3||0}]));};
const remUld=(id:string)=\>setUlds(prev=>prev.filter(u=>u.id!==id));
const remCargo=(uid:string,cid:string)=\>setUlds(prev=>prev.map(u=>u.id!==uid?u:{...u,cargoItems:u.cargoItems.filter(c=>c.id!==cid)}));
const assignPos=(posCode:string)=\>setUlds(prev=>prev.map(u=>u.position===posCode?u:{...u,position:posCode}));
const assignedCargo=useMemo(()=>new Set(ulds.flatMap(u=>u.cargoItems.map(c=>c.id))),[ulds]);
const unassignedCargo=useMemo(()=>cargoList.filter(c=>!assignedCargo.has(c.id)),[assignedCargo]);
const cgR=useMemo(()=>{const p=ulds.filter(u=>u.position).map(u=>({weight_kg:u.cargoItems.reduce((s,c)=>s+c.weight_kg,0),position_code:u.position!}));return calculateCG(p);},[ulds]);
const assignedW=ulds.reduce((s,u)=>s+u.cargoItems.reduce((a,c)=>a+c.weight_kg,0),0);
const assignedV=ulds.reduce((s,u)=>s+u.cargoItems.reduce((a,c)=>a+c.volume_m3,0),0);
const revenue=ulds.reduce((s,u)=>s+u.cargoItems.reduce((a,c)=>a+c.weight_kg*c.fee_per_kg,0),0);
const uldTypes=[{v:"AKE",l:"AKE (LD3)"},{v:"PMC",l:"PMC (LD6)"},{v:"PAG",l:"PAG (LD11)"},{v:"PLA",l:"PLA (Pallet)"},{v:"RKN",l:"RKN (Cool ULD)"}];
const autoPlan=()=>{
const newUlds:UI[]=[];
let rem=[...cargoList].sort((a,b)=>b.weight_kg-a.weight_kg);
const addU=(code:string,pos?:string)=\>{const ud=findULDType(code);const u:UI={id:`U-${Date.now()}-${Math.random()}`,uld_code:code,uld_name:ud?.common_names[0]||code,uld_full_name:ud?.full_name||code,cargoItems:[],deck:ud?.compatible_deck[0]==="main"?"main":"lower",dims:{l_cm:ud?.length_cm||0,w_cm:ud?.width_cm||0,h_cm:ud?.height_cm||0},max_load_kg:ud?.max_load_kg||0,volume_m3:ud?.volume_m3||0,position:pos};newUlds.push(u);};
const mPos=getMainDeckPositions().map(p=>p.code);
const nPos=getNosePositions().map(p=>p.code);
const lfPos=getLowerFwdPositions().map(p=>p.code);
const laPos=getLowerAftPositions().map(p=>p.code);
const dgrs=rem.filter(c=>c.category==="dgr"||c.category==="live_animal"||c.category==="perishable");
const normal=rem.filter(c=>c.category==="normal");
dgrs.forEach(c=>{const ud=findULDType("RKN");const u:UI={id:`U-${Date.now()}-${Math.random()}`,uld_code:"RKN",uld_name:"RKN (Cool ULD)",uld_full_name:"Refrigerated Cool ULD",cargoItems:[c],deck:"main",dims:{l_cm:ud?.length_cm||0,w_cm:ud?.width_cm||0,h_cm:ud?.height_cm||0},max_load_kg:ud?.max_load_kg||0,volume_m3:ud?.volume_m3||0};newUlds.push(u);rem=rem.filter(x=>x.id!==c.id);});
normal.forEach(c=>{const code=c.weight_kg>600?"PMC":"AKE";const ud=findULDType(code);const u:UI={id:`U-${Date.now()}-${Math.random()}`,uld_code:code,uld_name:ud?.common_names[0]||code,uld_full_name:ud?.full_name||code,cargoItems:[c],deck:ud?.compatible_deck[0]==="main"?"main":"lower",dims:{l_cm:ud?.length_cm||0,w_cm:ud?.width_cm||0,h_cm:ud?.height_cm||0},max_load_kg:ud?.max_load_kg||0,volume_m3:ud?.volume_m3||0};newUlds.push(u);rem=rem.filter(x=>x.id!==c.id);});
newUlds.slice(0,6).forEach((u,i)=>{u.position=mPos[i];});
newUlds.slice(6,8).forEach((u,i)=>{u.position=nPos[i];});
newUlds.slice(8,14).forEach((u,i)=>{u.position=lfPos[i]||laPos[i-Math.max(0,i-6)];});
setPlan(newUlds);
setPlanVis(true);
};
return(
<div style={{padding:16,minHeight:"100vh",background:"#F8FAFC"}}>
<Row gutter={16} style={{marginBottom:12}}>
<Col span={24}>
<Card size="small" styles={{body:{padding:"8px 12px"}}} style={{background:"linear-gradient(135deg,#1F4E79 0%,#2E74B5 100%)",borderRadius:8}}>
<Space size={16} wrap>
<div style={{display:"flex",alignItems:"center",gap:6}}><Text style={{fontSize:20}}>✈️</Text><Text style={{fontSize:16,fontWeight:800,color:"#fff"}}>CBA v5.1 智能排舱系统</Text><Tag color="gold" style={{margin:0,fontSize:10}}>B767-300BCF</Tag></div>
<Divider type="vertical" style={{background:"rgba(255,255,255,0.3)",height:24}}/>
<Text style={{fontSize:12,color:"rgba(255,255,255,0.85)"}}>📅 航班: <b>2024-03-27</b></Text>
<Text style={{fontSize:12,color:"rgba(255,255,255,0.85)"}}>🏢 <b>CAN</b> → <b>LAX</b></Text>
<Text style={{fontSize:12,color:"rgba(255,255,255,0.85)"}}>📊 已装: <b>{ulds.flatMap(u=>u.cargoItems).length}</b>/<b>{cargoList.length}</b>件</Text>
<Text style={{fontSize:12,color:"rgba(255,255,255,0.85)"}}>💰 预估: <b style={{color:"#FCD34D"}}>¥{revenue.toLocaleString()}</b></Text>
<Text style={{fontSize:12,color:cgR.status==="ok"?"#86EFAC":"#FCA5A5"}}>⚖️ CG: <b>{cgR.cg_mac_pct}%</b></Text>
</Space>
</Card>
</Col>
</Row>
<Row gutter={16} style={{marginBottom:12}}>
<Col span={24}>
<Space size={8} wrap>
<Button type="primary" icon={<ThunderboltOutlined/>} onClick={autoPlan} style={{background:"#1F4E79",borderColor:"#1F4E79"}}>🚀 一键智能排舱</Button>
<Button icon={<ReloadOutlined/>} onClick={()=>{setUlds([]);setPlan(null);}}>重置</Button>
<Select placeholder="添加ULD板型" style={{width:160}} onChange={v=>addUld(v)}>
{uldTypes.map(t=><Select.Option key={t.v} value={t.v}>{t.l}</Select.Option>)}
</Select>
<Button icon={<CheckCircleOutlined/>} type="primary" style={{background:"#16A34A",borderColor:"#16A34A"}}>提交装机指令</Button>
<Button icon={<ExclamationCircleOutlined/>} type="default">载重平衡预警</Button>
</Space>
</Col>
</Row>
{ulds.length>0&&(<Alert type="info" showIcon style={{marginBottom:12}} message={<Space><Text style={{fontSize:12}}>待分配: <b>{unassignedCargo.length}</b>件 | ULD<b>{ulds.length}</b>个 | 已定位<b>{ulds.filter(u=>u.position).length}</b>个 | 总重<b>{assignedW.toLocaleString()}kg</b> | 体积<b>{assignedV.toFixed(2)}m3</b></Text></Space>}/>)}
<Row gutter={16}>
<Col span={7}>
<CargoList list={unassignedCargo.length>0?unassignedCargo:cargoList} ulds={ulds} onDrag={handleDrag}/>
<div style={{marginTop:8}}><ULDBuild ulds={ulds} onRem={uid=>remCargo(uid,"")} onDrop={handleUldDrop}/></div>
<div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap"}}>
{uldTypes.map(t=><Button key={t.v} size="small" onClick={()=>addUld(t.v)}>+ {t.l}</Button>)}
</div>
</Col>
<Col span={10}>
<AircraftHold ulds={ulds} onAssign={assignPos}/>
</Col>
<Col span={7}>
<Card size="small" title={<Text style={{fontSize:13,fontWeight:700,color:"#1F4E79"}}>📊 排舱统计</Text>} styles={{body:{padding:12}}}>
<Row gutter={[8,8]}>
{[{l:"货物总件数",v:`${cargoList.length}件`},{l:"已装载",v:`${ulds.flatMap(u=>u.cargoItems).length}件`},{l:"ULD总数",v:`${ulds.length}个`},{l:"已分配位置",v:`${ulds.filter(u=>u.position).length}个`},{l:"总载重",v:`${assignedW.toLocaleString()}kg`},{l:"总体积",v:`${assignedV.toFixed(2)}m3`},{l:"预估收入",v:`¥${revenue.toLocaleString()}`},{l:"CG %MAC",v:`${cgR.cg_mac_pct}%`}].map(i=>(<Col key={i.l} span={12}><div style={{background:"#F8FAFC",borderRadius:6,padding:"6px 8px",textAlign:"center"}}><div style={{fontSize:9.5,color:"#64748B",marginBottom:2}}>{i.l}</div><div style={{fontSize:13,fontWeight:700,color:"#1F4E79"}}>{i.v}</div></div></Col>))}
</Row>
<Divider style={{margin:"10px 0"}}/>
<div style={{fontSize:11,fontWeight:600,color:"#1F4E79",marginBottom:6}}>ULD分布</div>
{[...new Set(ulds.map(u=>u.uld_code))].map(code=>{const cnt=ulds.filter(u=>u.uld_code===code).length;const totW=ulds.filter(u=>u.uld_code===code).reduce((s,u)=>s+u.cargoItems.reduce((a,c)=>a+c.weight_kg,0),0);return(<div key={code} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:"1px solid #F1F5F9"}}><Text style={{fontSize:10}}>{code}</Text><Space size={4}><Tag style={{fontSize:9,margin:0}}>{cnt}个</Tag><Text style={{fontSize:10,color:"#64748B"}}>{totW}kg</Text></Space></div>);})}
</Card>
<Card size="small" title={<Text style={{fontSize:13,fontWeight:700,color:"#1F4E79"}}>🔒 特货约束检查</Text>} styles={{body:{padding:12},marginTop:8}}>
{[...cargoList].map(c=>{const issues=[];if(c.category==="dgr")issues.push(`⚠️ ${c.awb} 危险品[${c.un_number}]`);if(c.category==="live_animal")issues.push(`🐾 ${c.awb} 活体动物`);if(c.category==="perishable")issues.push(`🥶 ${c.awb} 生鲜(${c.temperature==="chill"?"冷藏":"常温"})`);return issues.length>0?<Alert key={c.id} type="warning" showIcon={false} message={<Text style={{fontSize:10}}>{issues.join(" | ")}</Text>} style={{marginBottom:4,padding:"4px 8px"}}/>:null;})}
{ulds.filter(u=>u.cargoItems.some(c=>c.category==="dgr")).length===0&&<Text style={{fontSize:10,color:"#94A3B8"}}>暂无危险品装载</Text>}
</Card>
</Col>
</Row>
<Modal open={planVis} title={<Text style={{fontWeight:700}}>📋 智能排舱方案预览</Text>} onCancel={()=>setPlanVis(false)} footer={[<Button key="cancel" onClick={()=>setPlanVis(false)}>取消</Button>,<Button key="apply" type="primary" onClick={()=>{if(plan)setUlds(plan);setPlanVis(false);}} style={{background:"#1F4E79"}}>应用此方案</Button>]} width={1200}>
{plan&&(<div><Text style={{fontSize:12,color:"#64748B"}}>方案包含 <b>{plan.length}</b> 个ULD，<b>{plan.flatMap(u=>u.cargoItems).length}</b> 件货物</Text>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))",gap:8,marginTop:12}}>{plan.map(u=>(<div key={u.id} style={{border:"1.5px solid #E2E8F0",borderRadius:8,padding:8}}><div style={{fontSize:10,fontWeight:700,color:"#1F4E79"}}>{u.uld_code}{u.position&&<Tag color="cyan" style={{fontSize:8,marginLeft:4}}>{u.position}</Tag>}</div><div style={{fontSize:9,color:"#64748B"}}>{u.cargoItems.length}件 | {u.cargoItems.reduce((s,c)=>s+c.weight_kg,0)}kg</div></div>))}</div></div>)}
</Modal>
</div>
);
}
