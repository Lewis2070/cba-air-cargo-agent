import { useState } from 'react'

// Types
interface Flight {
  id: string
  flightNo: string
  route: string
  routeCode: string
  departureTime: string
  arrivalTime: string
  aircraft: string
  loadRate: number
  revenue: number
  weight: number
  capacity: number
  status: 'planned' | 'loading' | 'closed' | 'departed' | 'warning'
  warning: number
}

interface Cargo {
  id: string
  shipper: string
  consignee: string
  weight: number
  volume: number
  priority: 'high' | 'medium' | 'low'
  revenue: number
  type: string
  isDgr: boolean
  isTemperature: boolean
  isOversize: boolean
}

// Mock Data
const flights: Flight[] = [
  { id: '1', flightNo: 'MU5735', route: 'PVG→LAX', routeCode: 'PVG-LAX', departureTime: '23:55', arrivalTime: '16:30+1', aircraft: 'B777F', loadRate: 84.9, revenue: 93, weight: 85.2, capacity: 100, status: 'planned', warning: 2 },
  { id: '2', flightNo: 'MU5737', route: 'PVG→LAX', routeCode: 'PVG-LAX', departureTime: '23:55', arrivalTime: '16:30+1', aircraft: 'B777F', loadRate: 95.3, revenue: 110, weight: 95.3, capacity: 100, status: 'warning', warning: 5 },
  { id: '3', flightNo: 'CA881', route: 'PVG→FRA', routeCode: 'PVG-FRA', departureTime: '14:30', arrivalTime: '06:20+1', aircraft: 'B747F', loadRate: 67.3, revenue: 93, weight: 67.3, capacity: 100, status: 'loading', warning: 0 },
  { id: '4', flightNo: 'MU9028', route: 'PVG→SYD', routeCode: 'PVG-SYD', departureTime: '16:20', arrivalTime: '08:35+1', aircraft: 'B777F', loadRate: 88.3, revenue: 102, weight: 88.3, capacity: 100, status: 'planned', warning: 1 },
  { id: '5', flightNo: 'CZ3085', route: 'CAN→AMS', routeCode: 'CAN-AMS', departureTime: '01:15', arrivalTime: '07:30+1', aircraft: 'B747F', loadRate: 92.9, revenue: 105, weight: 92.9, capacity: 100, status: 'closed', warning: 0 },
]

const cargos: Cargo[] = [
  { id: 'C001', shipper: '阿里巴巴', consignee: 'Amazon', weight: 1200, volume: 45, priority: 'high', revenue: 25000, type: '普货', isDgr: false, isTemperature: false, isOversize: false },
  { id: 'C002', shipper: '京东物流', consignee: 'eBay', weight: 800, volume: 32, priority: 'high', revenue: 18000, type: '普货', isDgr: false, isTemperature: false, isOversize: false },
  { id: 'C003', shipper: '顺丰速运', consignee: 'Walmart', weight: 450, volume: 18, priority: 'medium', revenue: 12000, type: '锂电池', isDgr: true, isTemperature: false, isOversize: false },
  { id: 'C004', shipper: '拼多多', consignee: 'Target', weight: 2000, volume: 85, priority: 'medium', revenue: 35000, type: '普货', isDgr: false, isTemperature: false, isOversize: true },
  { id: 'C005', shipper: '宁德时代', consignee: 'Tesla', weight: 3200, volume: 120, priority: 'high', revenue: 85000, type: '电池', isDgr: true, isTemperature: false, isOversize: true },
  { id: 'C006', shipper: '辉瑞制药', consignee: 'CVS', weight: 200, volume: 5, priority: 'high', revenue: 45000, type: '温控货', isDgr: false, isTemperature: true, isOversize: false },
]

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  planned: { label: '计划中', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  loading: { label: '装载中', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  closed: { label: '已关舱', color: 'text-gray-400', bg: 'bg-gray-400/10' },
  departed: { label: '已离港', color: 'text-green-400', bg: 'bg-green-400/10' },
  warning: { label: '预警', color: 'text-red-400', bg: 'bg-red-400/10' },
}

// Icons
const PlaneIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
)

const WarningIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
  </svg>
)

// Header Component
function Header() {
  return (
    <header className="h-16 bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] border-b border-[#2a2a4a] flex items-center justify-between px-6">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-[#6366f1]/30">
            <PlaneIcon />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-wide">CBA 智控</h1>
            <p className="text-[#8b8b9e] text-xs">货运智能排舱系统</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {[
            { id: 'flight', label: '航班工作台', icon: '✈️', active: true },
            { id: 'ai-load', label: 'AI排舱工作台', icon: '🤖' },
            { id: 'predict', label: '舱位预测', icon: '📊' },
            { id: 'compliance', label: '合规检查', icon: '✅' },
          ].map((item) => (
            <button
              key={item.id}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                item.active
                  ? 'bg-[#6366f1]/20 text-[#a5b4fc] border border-[#6366f1]/30'
                  : 'text-[#8b8b9e] hover:text-white hover:bg-[#2a2a4a]'
              }`}
            >
              <span className="mr-1.5">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-2 text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            系统正常
          </span>
          <span className="text-[#8b8b9e]">GDS实时</span>
        </div>
        
        <div className="h-6 w-px bg-[#2a2a4a]"></div>
        
        <div className="flex items-center gap-4 text-sm text-[#8b8b9e]">
          <span className="font-mono">17:45:12</span>
          <span>2026/03/10</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366f1] to-[#ec4899] flex items-center justify-center text-white font-semibold">
            张
          </div>
          <div className="text-left">
            <p className="text-white text-sm font-medium">张伟</p>
            <p className="text-[#8b8b9e] text-xs">吨控主管</p>
          </div>
        </div>
      </div>
    </header>
  )
}

// Stats Cards
function StatsCards() {
  return (
    <div className="grid grid-cols-4 gap-4 px-6 py-4">
      {[
        { label: '今日航班', value: '12', unit: '班', sub: '已离港1  关舱1', color: '#6366f1', icon: '✈️' },
        { label: '预警航班', value: '8', unit: '班', sub: '需处理2班', color: '#ef4444', icon: '⚠️' },
        { label: '平均装载率', value: '81.0', unit: '%', sub: '较昨日+2.3%', color: '#10b981', icon: '📊' },
        { label: '收益达成', value: '95.2', unit: '%', sub: '¥142万/¥149万', color: '#f59e0b', icon: '💰' },
      ].map((stat, idx) => (
        <div
          key={idx}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-[#2a2a4a] p-5 group hover:border-[#6366f1]/50 transition-all duration-300"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#6366f1]/10 to-transparent rounded-bl-full"></div>
          <div className="flex items-start justify-between mb-3">
            <span className="text-[#8b8b9e] text-sm">{stat.label}</span>
            <span className="text-2xl">{stat.icon}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white">{stat.value}</span>
            <span className="text-[#8b8b9e] text-sm">{stat.unit}</span>
          </div>
          <p className="text-xs mt-1" style={{ color: stat.color }}>{stat.sub}</p>
          <div 
            className="absolute bottom-0 left-0 h-1 transition-all duration-300 group-hover:w-full"
            style={{ backgroundColor: stat.color }}
          ></div>
        </div>
      ))}
    </div>
  )
}

// Quick Actions
function QuickActions() {
  return (
    <div className="flex items-center gap-3 px-6 pb-4">
      <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-[#6366f1]/30 transition-all">
        <span>⚡</span> AI批量排舱
      </button>
      <button className="flex items-center gap-2 px-4 py-2.5 bg-[#2a2a4a] text-[#a5b4fc] rounded-xl text-sm font-medium hover:bg-[#3a3a5a] transition-all">
        <span>⚠️</span> 合规预警 <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">19</span>
      </button>
      <button className="flex items-center gap-2 px-4 py-2.5 bg-[#2a2a4a] text-green-400 rounded-xl text-sm font-medium hover:bg-[#3a3a5a] transition-all">
        <span>📈</span> 舱位预测
      </button>
    </div>
  )
}

// Flight Table
function FlightTable({ onLoadClick }: { onLoadClick: (flight: Flight) => void }) {
  return (
    <div className="flex-1 overflow-auto px-6 pb-4">
      <div className="bg-[#1a1a2e] rounded-2xl border border-[#2a2a4a] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a4a]">
          <div className="flex items-center gap-4">
            <h2 className="text-white font-semibold text-lg">今日航班列表</h2>
            <span className="px-2 py-1 bg-[#6366f1]/20 text-[#a5b4fc] text-xs rounded-full">10 班</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#8b8b9e] text-sm">2026-03-10</span>
            <button className="p-1.5 hover:bg-[#2a2a4a] rounded-lg transition-colors">
              <RefreshIcon />
            </button>
          </div>
        </div>
        
        <table className="w-full">
          <thead className="bg-[#16213e]">
            <tr className="text-left text-xs text-[#8b8b9e] font-medium">
              <th className="px-6 py-3">航班号</th>
              <th className="px-6 py-3">航线信息</th>
              <th className="px-6 py-3">时间</th>
              <th className="px-6 py-3">机型</th>
              <th className="px-6 py-3">装载率</th>
              <th className="px-6 py-3">载量</th>
              <th className="px-6 py-3">收益</th>
              <th className="px-6 py-3">状态</th>
              <th className="px-6 py-3">预警</th>
              <th className="px-6 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {flights.map((flight) => (
              <tr key={flight.id} className="border-t border-[#2a2a4a] hover:bg-[#2a2a4a]/50 transition-all">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/20 flex items-center justify-center">
                      <span className="text-[#a5b4fc] font-bold">{flight.flightNo.slice(0,2)}</span>
                    </div>
                    <span className="text-white font-semibold">{flight.flightNo}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-white">{flight.route}</p>
                    <p className="text-[#8b8b9e] text-xs">{flight.routeCode}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-white font-mono">{flight.departureTime}</p>
                    <p className="text-[#8b8b9e] text-xs">→{flight.arrivalTime}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-[#2a2a4a] text-[#8b8b9e] rounded text-xs">{flight.aircraft}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-[#2a2a4a] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          flight.loadRate >= 90 ? 'bg-green-400' : 
                          flight.loadRate >= 70 ? 'bg-[#6366f1]' : 'bg-red-400'
                        }`}
                        style={{ width: `${flight.loadRate}%` }}
                      ></div>
                    </div>
                    <span className="text-white text-sm font-mono w-12">{flight.loadRate}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-white font-mono">{flight.weight}/{flight.capacity}吨</span>
                </td>
                <td className="px-6 py-4">
                  <span className={flight.revenue >= 100 ? 'text-green-400' : flight.revenue >= 90 ? 'text-[#6366f1]' : 'text-[#8b8b9e]'}>
                    {flight.revenue}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusMap[flight.status].bg} ${statusMap[flight.status].color}`}>
                    {statusMap[flight.status].label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {flight.warning > 0 ? (
                    <span className="flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs">
                      <WarningIcon /> {flight.warning}
                    </span>
                  ) : (
                    <span className="text-[#8b8b9e]">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => onLoadClick(flight)}
                    className="px-4 py-2 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-[#6366f1]/30 transition-all"
                  >
                    排舱
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Sidebar Stats
function SidebarStats() {
  return (
    <div className="px-6 pb-4">
      <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-4">
        <p className="text-[#8b8b9e] text-xs mb-3">状态分布</p>
        <div className="flex gap-4 flex-wrap">
          {[
            { label: '计划中', value: 5, color: 'bg-blue-400' },
            { label: '装载中', value: 3, color: 'bg-amber-400' },
            { label: '已关舱', value: 1, color: 'bg-gray-400' },
            { label: '已离港', value: 1, color: 'bg-green-400' },
            { label: '预警', value: 2, color: 'bg-red-400' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded ${item.color}`}></span>
              <span className="text-[#8b8b9e] text-xs">{item.label}</span>
              <span className="text-white font-semibold text-sm">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Cargo List (Left Panel)
function CargoList() {
  return (
    <div className="w-80 bg-[#1a1a2e] border-r border-[#2a2a4a] flex flex-col">
      <div className="p-4 border-b border-[#2a2a4a]">
        <h3 className="text-white font-semibold mb-3">待排货物</h3>
        <div className="flex gap-2">
          <button className="flex-1 px-3 py-2 bg-[#6366f1] text-white rounded-lg text-xs font-medium">按收益</button>
          <button className="flex-1 px-3 py-2 bg-[#2a2a4a] text-[#8b8b9e] rounded-lg text-xs font-medium hover:bg-[#3a3a5a]">按优先级</button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-2">
        {cargos.map((cargo) => (
          <div key={cargo.id} className="mb-2 p-3 bg-[#16213e] rounded-xl border border-[#2a2a4a] hover:border-[#6366f1]/50 cursor-pointer transition-all group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium text-sm">{cargo.id}</span>
              <div className="flex gap-1">
                {cargo.isDgr && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">DGR</span>}
                {cargo.isTemperature && <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">温控</span>}
                {cargo.isOversize && <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">超大</span>}
                {cargo.priority === 'high' && <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">急</span>}
              </div>
            </div>
            <div className="text-xs text-[#8b8b9e] space-y-1">
              <div className="flex justify-between">
                <span>发货人:</span>
                <span className="text-white">{cargo.shipper}</span>
              </div>
              <div className="flex justify-between">
                <span>重量/体积:</span>
                <span className="text-white">{cargo.weight}kg / {cargo.volume}m³</span>
              </div>
              <div className="flex justify-between">
                <span>收益:</span>
                <span className="text-green-400">¥{cargo.revenue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Aircraft 3D View (Center)
function Aircraft3D({ flight }: { flight: Flight | null }) {
  const compartments = [
    { name: '前货舱', utilization: 92, capacity: 'PAG', weight: 18.5, max: 20 },
    { name: '中货舱', utilization: 98, capacity: 'PAG', weight: 19.6, max: 20 },
    { name: '后货舱', utilization: 85, capacity: 'AKE', weight: 17.0, max: 20 },
  ]

  return (
    <div className="flex-1 bg-[#16213e] flex flex-col">
      <div className="p-4 border-b border-[#2a2a4a] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-white font-bold text-xl">
            {flight ? `${flight.flightNo} ${flight.route}` : '选择航班开始排舱'}
          </h3>
          {flight && (
            <>
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">预警</span>
              <span className="text-[#8b8b9e]">{flight.aircraft} | {flight.departureTime}起飞</span>
            </>
          )}
        </div>
        {flight && (
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[#8b8b9e] text-xs">装载率</p>
              <p className="text-amber-400 font-bold">{flight.loadRate}%</p>
            </div>
            <div>
              <p className="text-[#8b8b9e] text-xs">收益达成</p>
              <p className="text-green-400 font-bold">{flight.revenue}%</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(#2a2a4a 1px, transparent 1px), linear-gradient(90deg, #2a2a4a 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
        
        <div className="relative z-10 w-[700px]">
          <div className="relative h-40 flex items-center justify-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-32">
              <div className="absolute left-0 top-0 w-28 h-24 bg-gradient-to-r from-[#1e3a5f] to-[#2a4a6f] rounded-lg -rotate-12 -translate-y-4 border border-[#3a5a7f]"></div>
              <div className="absolute right-0 top-0 w-28 h-24 bg-gradient-to-r from-[#2a4a6f] to-[#1e3a5f] rounded-lg rotate-12 -translate-y-4 border border-[#3a5a7f]"></div>
            </div>
            
            <div className="w-[400px] h-16 bg-gradient-to-r from-[#1e3a5f] via-[#2a5a7f] to-[#1e3a5f] rounded-full relative border border-[#3a5a7f]">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-10 bg-[#1e3a5f] rounded-l-full border-r border-[#3a5a7f]"></div>
              <div className="absolute top-1/2 -translate-y-1/2 left-16 flex gap-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-cyan-400/30"></div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-8 mt-8">
            {compartments.map((comp) => (
              <div 
                key={comp.name}
                className="w-36 h-28 bg-[#1a1a2e] rounded-xl border-2 border-[#2a2a4a] p-3 hover:border-[#6366f1] cursor-pointer transition-all"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#8b8b9e] text-xs">{comp.name}</span>
                  <span className={`text-xs font-bold ${comp.utilization >= 90 ? 'text-red-400' : 'text-cyan-400'}`}>
                    {comp.utilization}%
                  </span>
                </div>
                <div className="h-3 bg-[#2a2a4a] rounded-full overflow-hidden mb-2">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      comp.utilization >= 90 ? 'bg-red-400' : 'bg-cyan-400'
                    }`}
                    style={{ width: `${comp.utilization}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8b8b9e]">{comp.capacity}</span>
                  <span className="text-white">{comp.weight}/{comp.max}吨</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Right Panel
function CargoDetail() {
  return (
    <div className="w-72 bg-[#1a1a2e] border-l border-[#2a2a4a] flex flex-col">
      <div className="p-4 border-b border-[#2a2a4a]">
        <h3 className="text-white font-semibold">货物详情</h3>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="h-full flex flex-col items-center justify-center text-center py-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/20 flex items-center justify-center mb-4">
            <span className="text-4xl">📦</span>
          </div>
          <p className="text-[#8b8b9e]">点击货物查看详情</p>
        </div>
      </div>
      
      <div className="p-4 border-t border-[#2a2a4a]">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-[#16213e] rounded-xl">
            <p className="text-[#8b8b9e] text-xs">已选货物</p>
            <p className="text-white font-semibold text-xl">8票</p>
          </div>
          <div className="p-3 bg-[#16213e] rounded-xl">
            <p className="text-[#8b8b9e] text-xs">已排重量</p>
            <p className="text-white font-semibold text-xl">6.8吨</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <button className="w-full py-2.5 bg-[#6366f1] hover:bg-[#7c7ff5] text-white rounded-xl text-sm font-medium transition-all">
            保存方案
          </button>
          <button className="w-full py-2.5 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-[#6366f1]/30 transition-all">
            批量排舱
          </button>
          <button className="w-full py-2.5 bg-[#2a2a4a] hover:bg-[#3a3a5a] text-[#8b8b9e] rounded-xl text-sm font-medium transition-all">
            重置
          </button>
        </div>
      </div>
    </div>
  )
}

// Main App
function App() {
  const [currentPage, setCurrentPage] = useState<'flight' | 'load'>('flight')
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)

  const handleLoadClick = (flight: Flight) => {
    setSelectedFlight(flight)
    setCurrentPage('load')
  }

  return (
    <div className="h-screen flex flex-col bg-[#0d0d1a] text-white overflow-hidden">
      <Header />
      
      {currentPage === 'flight' ? (
        <>
          <StatsCards />
          <QuickActions />
          <FlightTable onLoadClick={handleLoadClick} />
          <SidebarStats />
        </>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <CargoList />
          <Aircraft3D flight={selectedFlight} />
          <CargoDetail />
        </div>
      )}
    </div>
  )
}

export default App
