import { useState } from 'react'

interface Flight {
  id: string
  flightNo: string
  route: string
  departureTime: string
  aircraft: string
  loadRate: number
  revenue: number
  status: 'planned' | 'loading' | 'closed' | 'departed' | 'warning'
  warning: number
}

const flights: Flight[] = [
  { id: '1', flightNo: 'MU5735', route: 'PVG→LAX', departureTime: '23:55', aircraft: 'B777F', loadRate: 84.9, revenue: 93, status: 'planned', warning: 2 },
  { id: '2', flightNo: 'MU5737', route: 'PVG→LAX', departureTime: '23:55', aircraft: 'B777F', loadRate: 95.3, revenue: 110, status: 'warning', warning: 5 },
  { id: '3', flightNo: 'CA881', route: 'PVG→FRA', departureTime: '14:30', aircraft: 'B747F', loadRate: 67.3, revenue: 93, status: 'loading', warning: 0 },
  { id: '4', flightNo: 'MU9028', route: 'PVG→SYD', departureTime: '16:20', aircraft: 'B777F', loadRate: 88.3, revenue: 102, status: 'planned', warning: 1 },
  { id: '5', flightNo: 'CZ3085', route: 'CAN→AMS', departureTime: '01:15', aircraft: 'B747F', loadRate: 92.9, revenue: 105, status: 'closed', warning: 0 },
  { id: '6', flightNo: 'MU501', route: 'PVG→NRT', departureTime: '09:40', aircraft: 'A330F', loadRate: 82.9, revenue: 92, status: 'departed', warning: 0 },
  { id: '7', flightNo: 'CX1234', route: 'HKG→ORD', departureTime: '22:10', aircraft: 'B747F', loadRate: 63.7, revenue: 86, status: 'planned', warning: 3 },
  { id: '8', flightNo: 'MU2032', route: 'PVG→DXB', departureTime: '18:45', aircraft: 'A330F', loadRate: 93.6, revenue: 106, status: 'planned', warning: 1 },
  { id: '9', flightNo: 'CA855', route: 'PEK→LHR', departureTime: '13:50', aircraft: 'B777F', loadRate: 85.4, revenue: 99, status: 'loading', warning: 2 },
  { id: '10', flightNo: 'MU5139', route: 'PVG→CDG', departureTime: '20:20', aircraft: 'B777F', loadRate: 59.2, revenue: 64, status: 'warning', warning: 4 },
  { id: '11', flightNo: 'SQ7268', route: 'PVG→SIN', departureTime: '07:30', aircraft: 'B747F', loadRate: 81.4, revenue: 104, status: 'loading', warning: 0 },
  { id: '12', flightNo: 'MU269', route: 'PVG→JFK', departureTime: '12:00', aircraft: 'B777F', loadRate: 76.7, revenue: 88, status: 'planned', warning: 1 },
]

const statusMap: Record<string, { label: string; color: string }> = {
  planned: { label: '计划中', color: 'text-blue-400' },
  loading: { label: '装载中', color: 'text-amber-400' },
  closed: { label: '已关舱', color: 'text-gray-400' },
  departed: { label: '已离港', color: 'text-green-400' },
  warning: { label: '预警', color: 'text-red-400' },
}

function App() {
  const [activeNav, setActiveNav] = useState('flight')

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="bg-[#12121a] border-b border-[#2a2a3a] px-6 py-3">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00d9ff] to-[#8b5cf6] flex items-center justify-center">
                <span className="text-xl font-bold">C</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">CBA 智控</h1>
                <p className="text-xs text-gray-500">货运智能排舱系统 v3.2</p>
              </div>
            </div>
            
            <nav className="flex gap-1">
              {[
                { id: 'flight', label: '航班工作台', icon: '✈️' },
                { id: 'ai', label: 'AI排舱工作台', icon: '🤖' },
                { id: 'predict', label: '舱位预测', icon: '📊' },
                { id: 'compliance', label: '合规检查', icon: '✅' },
                { id: 'orders', label: '订单管理', icon: '📋' },
                { id: 'special', label: '特种货管理', icon: '⚠️' },
                { id: 'review', label: '航班复盘', icon: '📝' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    activeNav === item.id
                      ? 'bg-[#00d9ff]/20 text-[#00d9ff] border border-[#00d9ff]/30'
                      : 'text-gray-400 hover:text-white hover:bg-[#1a1a24]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-2 text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                系统正常
              </span>
              <span className="text-gray-500">GDS实时连接</span>
              <span className="text-gray-500">IATA规范 DGR59</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-light text-white">08:36:32</p>
              <p className="text-xs text-gray-500">2026/03/10 周二 | CST</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#00d9ff] flex items-center justify-center text-white font-bold">
                张
              </div>
              <div className="text-left">
                <p className="text-sm text-white">张伟</p>
                <p className="text-xs text-gray-500">吨控主管</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* AI Status Bar */}
      <div className="bg-gradient-to-r from-[#8b5cf6]/10 to-[#00d9ff]/10 border-b border-[#2a2a3a] px-6 py-2">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-[#00d9ff]">AI引擎在线</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-400 text-sm">v3.2.1 | 延迟 42ms</span>
          </div>
          <div className="flex gap-4">
            <button className="px-4 py-1.5 bg-[#00d9ff]/20 text-[#00d9ff] rounded-md text-sm hover:bg-[#00d9ff]/30 transition-colors">
              AI批量排舱
            </button>
            <button className="px-4 py-1.5 bg-[#8b5cf6]/20 text-[#8b5cf6] rounded-md text-sm hover:bg-[#8b5cf6]/30 transition-colors">
              查看合规预警
            </button>
            <button className="px-4 py-1.5 bg-[#10b981]/20 text-[#10b981] rounded-md text-sm hover:bg-[#10b981]/30 transition-colors">
              舱位预测报告
            </button>
            <button className="px-4 py-1.5 bg-[#f59e0b]/20 text-[#f59e0b] rounded-md text-sm hover:bg-[#f59e0b]/30 transition-colors">
              今日复盘
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#12121a] rounded-xl p-5 border border-[#2a2a3a]">
            <p className="text-gray-500 text-sm mb-2">今日计划航班</p>
            <p className="text-3xl font-bold text-white">12班</p>
            <p className="text-xs text-gray-500 mt-1">已离港 1 班 | 关舱 1 班</p>
          </div>
          <div className="bg-[#12121a] rounded-xl p-5 border border-[#2a2a3a]">
            <p className="text-gray-500 text-sm mb-2">预警航班</p>
            <p className="text-3xl font-bold text-red-400">8班</p>
            <p className="text-xs text-red-400 mt-1">需立即处理 2 班</p>
          </div>
          <div className="bg-[#12121a] rounded-xl p-5 border border-[#2a2a3a]">
            <p className="text-gray-500 text-sm mb-2">平均装载率</p>
            <p className="text-3xl font-bold text-[#00d9ff]">81.0%</p>
            <p className="text-xs text-green-400 mt-1">较昨日 +2.3%</p>
          </div>
          <div className="bg-[#12121a] rounded-xl p-5 border border-[#2a2a3a]">
            <p className="text-gray-500 text-sm mb-2">总收益达成</p>
            <p className="text-3xl font-bold text-[#f59e0b]">95.2%</p>
            <p className="text-xs text-gray-400 mt-1">¥142万 / 目标¥149万</p>
          </div>
        </div>

        {/* Flight Table */}
        <div className="bg-[#12121a] rounded-xl border border-[#2a2a3a] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a3a]">
            <h2 className="text-lg font-bold text-white">今日航班列表 <span className="text-gray-500 font-normal">12 班</span></h2>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm">2026-03-01 | 实时更新</span>
            </div>
          </div>
          
          <table className="w-full">
            <thead className="bg-[#1a1a24]">
              <tr className="text-left text-sm text-gray-500">
                <th className="px-5 py-3 font-medium">航班号</th>
                <th className="px-5 py-3 font-medium">航线</th>
                <th className="px-5 py-3 font-medium">起飞时间</th>
                <th className="px-5 py-3 font-medium">机型</th>
                <th className="px-5 py-3 font-medium">装载率</th>
                <th className="px-5 py-3 font-medium">收益达成</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">预警</th>
                <th className="px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {flights.map((flight) => (
                <tr key={flight.id} className="border-t border-[#2a2a3a] hover:bg-[#1a1a24]/50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-bold text-white">{flight.flightNo}</span>
                  </td>
                  <td className="px-5 py-4 text-gray-300">{flight.route}</td>
                  <td className="px-5 py-4 text-gray-300">{flight.departureTime}</td>
                  <td className="px-5 py-4 text-gray-300">{flight.aircraft}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-[#2a2a3a] rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${flight.loadRate >= 90 ? 'bg-green-400' : flight.loadRate >= 70 ? 'bg-[#00d9ff]' : 'bg-red-400'}`}
                          style={{ width: `${flight.loadRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-300">{flight.loadRate}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`${flight.revenue >= 100 ? 'text-green-400' : flight.revenue >= 90 ? 'text-[#00d9ff]' : 'text-gray-400'}`}>
                      {flight.revenue}%
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${statusMap[flight.status].color} bg-[#2a2a3a]`}>
                      {statusMap[flight.status].label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {flight.warning > 0 ? (
                      <span className="px-2 py-1 rounded text-xs text-red-400 bg-red-400/10">
                        {flight.warning}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <button className="px-3 py-1.5 bg-[#00d9ff]/20 text-[#00d9ff] rounded text-sm hover:bg-[#00d9ff]/30 transition-colors">
                      排舱
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-[#12121a] rounded-xl p-4 border border-[#2a2a3a]">
            <p className="text-gray-500 text-sm">总订单量</p>
            <p className="text-xl font-bold text-white mt-1">315 <span className="text-gray-500 text-sm font-normal">票</span></p>
          </div>
          <div className="bg-[#12121a] rounded-xl p-4 border border-[#2a2a3a]">
            <p className="text-gray-500 text-sm">总货量(已定)</p>
            <p className="text-xl font-bold text-white mt-1">973.2 <span className="text-gray-500 text-sm font-normal">吨</span></p>
          </div>
          <div className="bg-[#12121a] rounded-xl p-4 border border-[#2a2a3a]">
            <p className="text-gray-500 text-sm">DGR货物</p>
            <p className="text-xl font-bold text-amber-400 mt-1">5 <span className="text-gray-500 text-sm font-normal">票 / 8.4吨</span></p>
          </div>
          <div className="bg-[#12121a] rounded-xl p-4 border border-[#2a2a3a]">
            <p className="text-gray-500 text-sm">待处理预警</p>
            <p className="text-xl font-bold text-red-400 mt-1">19 <span className="text-gray-500 text-sm font-normal">项</span></p>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-[#12121a] rounded-xl p-4 border border-[#2a2a3a] mt-4">
          <p className="text-gray-500 text-sm mb-3">状态分布</p>
          <div className="flex gap-6">
            {[
              { label: '计划中', value: 5, color: 'bg-blue-400' },
              { label: '装载中', value: 3, color: 'bg-amber-400' },
              { label: '已关舱', value: 1, color: 'bg-gray-400' },
              { label: '已离港', value: 1, color: 'bg-green-400' },
              { label: '预警', value: 2, color: 'bg-red-400' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded ${item.color}`}></span>
                <span className="text-gray-400 text-sm">{item.label}</span>
                <span className="text-white font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
