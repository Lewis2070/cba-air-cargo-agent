import { useState } from 'react'

// Types
interface Flight {
  id: string
  flightNo: string
  route: string
  routeCode: string
  departureTime: string
  aircraft: string
  loadRate: number
  revenue: number
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
}

// Mock Data
const flights: Flight[] = [
  { id: '1', flightNo: 'MU5735', route: 'PVG→LAX', routeCode: 'PVG-LAX', departureTime: '23:55', aircraft: 'B777F', loadRate: 84.9, revenue: 93, status: 'planned', warning: 2 },
  { id: '2', flightNo: 'MU5737', route: 'PVG→LAX', routeCode: 'PVG-LAX', departureTime: '23:55', aircraft: 'B777F', loadRate: 95.3, revenue: 110, status: 'warning', warning: 5 },
  { id: '3', flightNo: 'CA881', route: 'PVG→FRA', routeCode: 'PVG-FRA', departureTime: '14:30', aircraft: 'B747F', loadRate: 67.3, revenue: 93, status: 'loading', warning: 0 },
  { id: '4', flightNo: 'MU9028', route: 'PVG→SYD', routeCode: 'PVG-SYD', departureTime: '16:20', aircraft: 'B777F', loadRate: 88.3, revenue: 102, status: 'planned', warning: 1 },
  { id: '5', flightNo: 'CZ3085', route: 'CAN→AMS', routeCode: 'CAN-AMS', departureTime: '01:15', aircraft: 'B747F', loadRate: 92.9, revenue: 105, status: 'closed', warning: 0 },
  { id: '6', flightNo: 'MU501', route: 'PVG→NRT', routeCode: 'PVG-NRT', departureTime: '09:40', aircraft: 'A330F', loadRate: 82.9, revenue: 92, status: 'departed', warning: 0 },
  { id: '7', flightNo: 'CX1234', route: 'HKG→ORD', routeCode: 'HKG-ORD', departureTime: '22:10', aircraft: 'B747F', loadRate: 63.7, revenue: 86, status: 'planned', warning: 3 },
  { id: '8', flightNo: 'MU2032', route: 'PVG→DXB', routeCode: 'PVG-DXB', departureTime: '18:45', aircraft: 'A330F', loadRate: 93.6, revenue: 106, status: 'planned', warning: 1 },
  { id: '9', flightNo: 'CA855', route: 'PEK→LHR', routeCode: 'PEK-LHR', departureTime: '13:50', aircraft: 'B777F', loadRate: 85.4, revenue: 99, status: 'loading', warning: 2 },
  { id: '10', flightNo: 'MU5139', route: 'PVG→CDG', routeCode: 'PVG-CDG', departureTime: '20:20', aircraft: 'B777F', loadRate: 59.2, revenue: 64, status: 'warning', warning: 4 },
]

const cargos: Cargo[] = [
  { id: 'C001', shipper: '阿里巴巴', consignee: 'Amazon', weight: 1200, volume: 45, priority: 'high', revenue: 25000, type: '普货', isDgr: false, isTemperature: false },
  { id: 'C002', shipper: '京东物流', consignee: 'eBay', weight: 800, volume: 32, priority: 'high', revenue: 18000, type: '普货', isDgr: false, isTemperature: false },
  { id: 'C003', shipper: '顺丰速运', consignee: 'Walmart', weight: 450, volume: 18, priority: 'medium', revenue: 12000, type: '锂电池', isDgr: true, isTemperature: false },
  { id: 'C004', shipper: '拼多多', consignee: 'Target', weight: 2000, volume: 85, priority: 'medium', revenue: 35000, type: '普货', isDgr: false, isTemperature: false },
  { id: 'C005', shipper: '宁德时代', consignee: 'Tesla', weight: 3200, volume: 120, priority: 'high', revenue: 85000, type: '电池', isDgr: true, isTemperature: false },
  { id: 'C006', shipper: '辉瑞制药', consignee: 'CVS', weight: 200, volume: 5, priority: 'high', revenue: 45000, type: '温控货', isDgr: false, isTemperature: true },
  { id: 'C007', shipper: '小米科技', consignee: 'BestBuy', weight: 650, volume: 28, priority: 'low', revenue: 15000, type: '普货', isDgr: false, isTemperature: false },
  { id: 'C008', shipper: '大疆创新', consignee: 'B&H', weight: 180, volume: 12, priority: 'medium', revenue: 28000, type: '电子产品', isDgr: false, isTemperature: false },
]

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  planned: { label: '计划中', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  loading: { label: '装载中', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  closed: { label: '已关舱', color: 'text-gray-400', bg: 'bg-gray-400/10' },
  departed: { label: '已离港', color: 'text-green-400', bg: 'bg-green-400/10' },
  warning: { label: '预警', color: 'text-red-400', bg: 'bg-red-400/10' },
}

const navItems = [
  { id: 'flight', label: '航班工作台', icon: '✈️' },
  { id: 'ai-load', label: 'AI排舱工作台', icon: '🤖' },
  { id: 'predict', label: '核心舱位预测', icon: '📊' },
  { id: 'compliance', label: '合规检查', icon: '✅' },
  { id: 'orders', label: '订单管理', icon: '📋' },
  { id: 'special', label: '特种货管理', icon: '⚠️' },
  { id: 'review', label: '航班复盘', icon: '📝' },
]

// Components
function Header() {
  return (
    <header className="h-14 bg-[#0d1117] border-b border-[#21262d] flex items-center justify-between px-5">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#58a6ff] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-[#58a6ff]/20">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm leading-tight">CBA 智控</h1>
            <p className="text-[#484f58] text-xs">货运智能排舱系统</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              className="px-3 py-1.5 rounded-md text-sm text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-all duration-200"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-2 text-[#3fb950]">
            <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse"></span>
            系统正常
          </span>
          <span className="text-[#484f58]">GDS实时连接</span>
          <span className="text-[#484f58]">IATA规范 DGR59</span>
        </div>
        
        <div className="h-6 w-px bg-[#21262d]"></div>
        
        <div className="flex items-center gap-3 text-xs text-[#8b949e]">
          <span>17:21:32</span>
          <span>2026/03/10 周二</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#58a6ff] flex items-center justify-center text-white font-semibold text-sm">
            张
          </div>
          <div className="text-left">
            <p className="text-white text-sm">张伟</p>
            <p className="text-[#484f58] text-xs">吨控主管</p>
          </div>
        </div>
      </div>
    </header>
  )
}

function Sidebar({ activeNav }: { activeNav: string }) {
  const quickActions = [
    { id: 'ai-batch', label: 'AI批量排舱', icon: '⚡', color: 'text-[#58a6ff]' },
    { id: 'compliance-warn', label: '合规预警', icon: '⚠️', color: 'text-amber-400' },
    { id: 'predict', label: '舱位预测', icon: '📈', color: 'text-[#3fb950]' },
    { id: 'review', label: '今日复盘', icon: '📊', color: 'text-[#f778ba]' },
  ]
  
  return (
    <aside className="w-56 bg-[#0d1117] border-r border-[#21262d] flex flex-col">
      <div className="p-4">
        <p className="text-[#484f58] text-xs font-medium mb-3">快捷功能</p>
        <div className="space-y-1">
          {quickActions.map((action) => (
            <button
              key={action.id}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#8b949e] hover:text-white hover:bg-[#161b22] transition-all duration-200"
            >
              <span className={action.color}>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-auto p-4 border-t border-[#21262d]">
        <div className="flex items-center gap-2 text-xs text-[#484f58] mb-2">
          <span className="w-2 h-2 rounded-full bg-[#58a6ff] animate-pulse"></span>
          AI引擎在线
        </div>
        <div className="text-[#484f58] text-xs">
          v3.2.1 | 延迟 42ms
        </div>
      </div>
    </aside>
  )
}

function FlightTable() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">今日航班列表 <span className="text-[#484f58] font-normal">10 班</span></h2>
          <span className="text-[#484f58] text-sm">2026-03-10 | 实时更新</span>
        </div>
        
        <div className="bg-[#161b22] rounded-xl border border-[#21262d] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0d1117]">
              <tr className="text-left text-xs text-[#484f58] font-medium">
                <th className="px-4 py-3">航班号</th>
                <th className="px-4 py-3">航线</th>
                <th className="px-4 py-3">起飞时间</th>
                <th className="px-4 py-3">机型</th>
                <th className="px-4 py-3">装载率</th>
                <th className="px-4 py-3">收益达成</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">预警</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {flights.map((flight) => (
                <tr key={flight.id} className="border-t border-[#21262d] hover:bg-[#1f2937]/50 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <span className="text-white font-semibold">{flight.flightNo}</span>
                  </td>
                  <td className="px-4 py-3 text-[#8b949e]">{flight.route}</td>
                  <td className="px-4 py-3 text-[#8b949e]">{flight.departureTime}</td>
                  <td className="px-4 py-3 text-[#8b949e]">{flight.aircraft}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${flight.loadRate >= 90 ? 'bg-[#3fb950]' : flight.loadRate >= 70 ? 'bg-[#58a6ff]' : 'bg-[#f85149]'}`}
                          style={{ width: `${flight.loadRate}%` }}
                        ></div>
                      </div>
                      <span className="text-[#8b949e] text-xs">{flight.loadRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={flight.revenue >= 100 ? 'text-[#3fb950]' : flight.revenue >= 90 ? 'text-[#58a6ff]' : 'text-[#8b949e]'}>
                      {flight.revenue}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${statusMap[flight.status].bg} ${statusMap[flight.status].color}`}>
                      {statusMap[flight.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {flight.warning > 0 ? (
                      <span className="px-2 py-1 rounded text-xs bg-[#f85149]/10 text-[#f85149]">
                        {flight.warning}
                      </span>
                    ) : (
                      <span className="text-[#484f58]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button className="px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded text-xs font-medium transition-colors">
                      排舱
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatsBar() {
  return (
    <div className="h-10 bg-[#161b22] border-b border-[#21262d] flex items-center px-5 gap-8">
      <div className="flex items-center gap-6 text-xs">
        <div>
          <span className="text-[#484f58]">总订单量 </span>
          <span className="text-white font-semibold">315 票</span>
        </div>
        <div>
          <span className="text-[#484f58]">总货量 </span>
          <span className="text-white font-semibold">973.2 吨</span>
        </div>
        <div>
          <span className="text-[#484f58]">DGR货物 </span>
          <span className="text-amber-400 font-semibold">5 票 / 8.4吨</span>
        </div>
        <div>
          <span className="text-[#484f58]">待处理预警 </span>
          <span className="text-[#f85149] font-semibold">19 项</span>
        </div>
        <div>
          <span className="text-[#484f58]">今日总收益 </span>
          <span className="text-[#f59e0b] font-semibold">¥142万</span>
        </div>
      </div>
      
      <div className="ml-auto flex items-center gap-4">
        <span className="text-[#484f58] text-xs">状态分布:</span>
        {[
          { label: '计划中', value: 5, color: 'bg-blue-400' },
          { label: '装载中', value: 3, color: 'bg-amber-400' },
          { label: '已关舱', value: 1, color: 'bg-gray-400' },
          { label: '已离港', value: 1, color: 'bg-[#3fb950]' },
          { label: '预警', value: 2, color: 'bg-[#f85149]' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded ${item.color}`}></span>
            <span className="text-[#8b949e] text-xs">{item.label}</span>
            <span className="text-white text-xs font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Load Planning Page Components
function CargoList() {
  return (
    <div className="w-80 bg-[#0d1117] border-r border-[#21262d] flex flex-col">
      <div className="p-4 border-b border-[#21262d]">
        <h3 className="text-white font-semibold mb-3">待排货物</h3>
        <div className="flex gap-2">
          <button className="flex-1 px-3 py-1.5 bg-[#238636] text-white rounded text-xs font-medium">按收益</button>
          <button className="flex-1 px-3 py-1.5 bg-[#161b22] text-[#8b949e] rounded text-xs font-medium hover:bg-[#21262d]">按优先级</button>
          <button className="flex-1 px-3 py-1.5 bg-[#161b22] text-[#8b949e] rounded text-xs font-medium hover:bg-[#21262d]">按重量</button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-2">
        {cargos.map((cargo) => (
          <div key={cargo.id} className="mb-2 p-3 bg-[#161b22] rounded-lg border border-[#21262d] hover:border-[#58a6ff]/50 cursor-pointer transition-all group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium text-sm">{cargo.id}</span>
              <div className="flex gap-1">
                {cargo.isDgr && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">DGR</span>}
                {cargo.isTemperature && <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">温控</span>}
                {cargo.priority === 'high' && <span className="px-1.5 py-0.5 bg-[#f85149]/20 text-[#f85149] text-xs rounded">急</span>}
              </div>
            </div>
            <div className="text-xs text-[#8b949e] space-y-1">
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
                <span className="text-[#3fb950]">¥{cargo.revenue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Aircraft3D() {
  return (
    <div className="flex-1 bg-[#0d1117] flex flex-col">
      <div className="p-4 border-b border-[#21262d] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-white font-semibold">MU5735 PVG→LAX</h3>
          <span className="px-2 py-1 bg-[#f85149]/10 text-[#f85149] text-xs rounded">预警</span>
          <span className="text-[#8b949e] text-sm">B777F | 23:55起飞</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[#8b949e]">装载率:</span>
            <span className="text-[#f59e0b] font-semibold">95.3%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#8b949e]">收益:</span>
            <span className="text-[#3fb950] font-semibold">110%</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-[600px] h-[300px]">
          {/* Aircraft fuselage */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[500px] h-16 bg-gradient-to-r from-[#21262d] via-[#30363d] to-[#21262d] rounded-full relative">
              {/* Cockpit */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-10 bg-[#21262d] rounded-l-full"></div>
              
              {/* Windows */}
              <div className="absolute top-1/2 -translate-y-1/2 left-20 flex gap-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-[#58a6ff]/30"></div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Cargo compartments */}
          {[
            { name: '前货舱', utilization: 92, capacity: 'PAG' },
            { name: '中货舱', utilization: 98, capacity: 'PAG' },
            { name: '后货舱', utilization: 85, capacity: 'AKE' },
          ].map((compartment, idx) => (
            <div 
              key={compartment.name}
              className="absolute bottom-0 w-32 h-20 bg-[#161b22] rounded-lg border border-[#21262d] p-2 cursor-pointer hover:border-[#58a6ff] transition-colors"
              style={{ left: `${80 + idx * 140}px` }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#8b949e] text-xs">{compartment.name}</span>
                <span className={`text-xs font-medium ${compartment.utilization >= 90 ? 'text-[#f85149]' : 'text-[#58a6ff]'}`}>
                  {compartment.utilization}%
                </span>
              </div>
              <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${compartment.utilization >= 90 ? 'bg-[#f85149]' : 'bg-[#58a6ff]'}`}
                  style={{ width: `${compartment.utilization}%` }}
                ></div>
              </div>
              <div className="text-[#484f58] text-xs mt-1">{compartment.capacity}</div>
            </div>
          ))}
          
          {/* Wings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-24">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 w-40 h-20 bg-[#161b22] rounded-lg border border-[#21262d] -rotate-12 -translate-y-4"></div>
            <div className="absolute left-1/2 top-0 -translate-x-1/2 w-40 h-20 bg-[#161b22] rounded-lg border border-[#21262d] rotate-12 -translate-y-4"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CargoDetail() {
  return (
    <div className="w-72 bg-[#0d1117] border-l border-[#21262d] flex flex-col">
      <div className="p-4 border-b border-[#21262d]">
        <h3 className="text-white font-semibold">货物详情</h3>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="text-center py-8 text-[#484f58]">
          <p className="text-4xl mb-2">📦</p>
          <p className="text-sm">点击货物查看详情</p>
        </div>
      </div>
      
      <div className="p-4 border-t border-[#21262d]">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-[#161b22] rounded-lg">
            <p className="text-[#484f58] text-xs mb-1">已选货物</p>
            <p className="text-white font-semibold text-xl">8票</p>
          </div>
          <div className="p-3 bg-[#161b22] rounded-lg">
            <p className="text-[#484f58] text-xs mb-1">已排重量</p>
            <p className="text-white font-semibold text-xl">6.8吨</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <button className="w-full py-2.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg text-sm font-medium transition-colors">
            保存方案
          </button>
          <button className="w-full py-2.5 bg-[#58a6ff] hover:bg-[#79b8ff] text-white rounded-lg text-sm font-medium transition-colors">
            批量排舱
          </button>
          <button className="w-full py-2.5 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] rounded-lg text-sm font-medium transition-colors">
            重置
          </button>
        </div>
      </div>
    </div>
  )
}

// Main App
function App() {
  const [currentPage, setCurrentPage] = useState<'flight' | 'ai-load'>('flight')

  return (
    <div className="h-screen flex flex-col bg-[#0d1117] text-white overflow-hidden">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {currentPage === 'flight' ? (
          <>
            <Sidebar activeNav="flight" />
            <div className="flex-1 flex flex-col overflow-hidden">
              <StatsBar />
              <FlightTable />
            </div>
          </>
        ) : (
          <>
            <CargoList />
            <Aircraft3D />
            <CargoDetail />
          </>
        )}
      </div>
    </div>
  )
}

export default App
