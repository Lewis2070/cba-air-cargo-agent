import { useState } from 'react'

// Types
interface Flight {
  id: string
  flightNo: string
  route: string
  departureTime: string
  arrivalTime: string
  aircraft: string
  loadRate: number
  revenue: number
  weight: number
  capacity: number
  status: 'planned' | 'loading' | 'closed' | 'departed' | 'warning'
}

interface Cargo {
  id: string
  shipper: string
  weight: number
  revenue: number
  priority: 'high' | 'medium' | 'low'
  isDgr: boolean
  isTemperature: boolean
  isOversize: boolean
  isSelected: boolean
}

interface AircraftModel {
  name: string
  code: string
  maxWeight: number
  compartments: { name: string; code: string; maxWeight: number }[]
}

const aircraftModels: AircraftModel[] = [
  { name: 'Boeing 747-400F', code: 'B744F', maxWeight: 124, compartments: [{ name: '前货舱', code: 'A', maxWeight: 27 }, { name: '中货舱', code: 'B', maxWeight: 48 }, { name: '后货舱', code: 'C', maxWeight: 49 }] },
  { name: 'Boeing 777F', code: 'B77F', maxWeight: 102, compartments: [{ name: '前货舱', code: 'A', maxWeight: 51 }, { name: '后货舱', code: 'B', maxWeight: 51 }] },
  { name: 'Boeing 767-300F', code: 'B763F', maxWeight: 52, compartments: [{ name: '前货舱', code: 'A', maxWeight: 26 }, { name: '后货舱', code: 'B', maxWeight: 26 }] },
]

const flights: Flight[] = [
  { id: '1', flightNo: 'MU5735', route: 'PVG→LAX', departureTime: '23:55', arrivalTime: '16:30+1', aircraft: 'B77F', loadRate: 84.9, revenue: 93, weight: 85.2, capacity: 102, status: 'planned' },
  { id: '2', flightNo: 'MU5737', route: 'PVG→LAX', departureTime: '23:55', arrivalTime: '16:30+1', aircraft: 'B77F', loadRate: 95.3, revenue: 110, weight: 95.3, capacity: 102, status: 'warning' },
  { id: '3', flightNo: 'CA881', route: 'PVG→FRA', departureTime: '14:30', arrivalTime: '06:20+1', aircraft: 'B744F', loadRate: 67.3, revenue: 93, weight: 83.4, capacity: 124, status: 'loading' },
]

const initialCargos: Cargo[] = [
  { id: 'C001', shipper: '阿里巴巴', weight: 1200, priority: 'high', revenue: 25000, isDgr: false, isTemperature: false, isOversize: false, isSelected: false },
  { id: 'C002', shipper: '京东物流', weight: 800, priority: 'high', revenue: 18000, isDgr: false, isTemperature: false, isOversize: false, isSelected: false },
  { id: 'C003', shipper: '顺丰速运', weight: 450, priority: 'medium', revenue: 12000, isDgr: true, isTemperature: false, isOversize: false, isSelected: false },
  { id: 'C004', shipper: '拼多多', weight: 2000, priority: 'medium', revenue: 35000, isDgr: false, isTemperature: false, isOversize: true, isSelected: false },
  { id: 'C005', shipper: '宁德时代', weight: 3200, priority: 'high', revenue: 85000, isDgr: true, isTemperature: false, isOversize: true, isSelected: false },
  { id: 'C006', shipper: '辉瑞制药', weight: 200, priority: 'high', revenue: 45000, isDgr: false, isTemperature: true, isOversize: false, isSelected: false },
]

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  planned: { label: '计划中', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  loading: { label: '装载中', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  warning: { label: '预警', color: 'text-rose-500', bg: 'bg-rose-500/10' },
}

type Theme = 'dark' | 'light'

function App() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [currentPage, setCurrentPage] = useState<'flight' | 'load'>('flight')
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftModel>(aircraftModels[1])
  const [cargos, setCargos] = useState<Cargo[]>(initialCargos)
  const [hoveredFlight, setHoveredFlight] = useState<string | null>(null)

  const isDark = theme === 'dark'

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark')

  const handleLoadClick = (flight: Flight) => {
    const model = aircraftModels.find(m => flight.aircraft.includes(m.code.slice(0,4))) || aircraftModels[1]
    setSelectedAircraft(model)
    setSelectedFlight(flight)
    setCurrentPage('load')
  }

  const handleCargoClick = (cargoId: string) => {
    setCargos(cargos.map(c => c.id === cargoId ? { ...c, isSelected: !c.isSelected } : c))
  }

  const selectedCount = cargos.filter(c => c.isSelected).length
  const selectedWeight = cargos.filter(c => c.isSelected).reduce((sum, c) => sum + c.weight, 0) / 1000

  return (
    <div className={`h-screen flex flex-col ${isDark ? 'bg-[#0a0a0f]' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className={`h-16 flex items-center justify-between px-6 border-b transition-all duration-300 ${
        isDark ? 'bg-gradient-to-r from-slate-900 to-slate-800 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">CBA 智控</h1>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>货运智能排舱系统</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {['航班工作台', 'AI排舱', '舱位预测', '合规检查'].map((label, idx) => (
              <button key={label} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 ${
                idx === 0 
                  ? isDark ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10' 
                  : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-emerald-500 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            系统正常
          </span>
          
          <div className={`h-6 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
          
          <button onClick={toggleTheme} className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
            isDark ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-slate-100 text-slate-600'
          }`}>
            {isDark ? '☀️' : '🌙'}
          </button>
          
          <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="font-mono">18:45:00</span>
            <span>2026/03/10</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center text-white font-semibold shadow-lg">张</div>
            <div>
              <p className="text-sm font-medium">张伟</p>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>吨控主管</p>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 px-6 py-5">
        {[
          { label: '今日航班', value: '12', unit: '班', color: '#6366f1', desc: '已离港1 关舱1' },
          { label: '预警航班', value: '8', unit: '班', color: '#ef4444', desc: '需处理2班' },
          { label: '平均装载率', value: '81.0', unit: '%', color: '#10b981', desc: '较昨日+2.3%' },
          { label: '收益达成', value: '95.2', unit: '%', color: '#f59e0b', desc: '¥142万/¥149万' },
        ].map((stat, idx) => (
          <div key={idx} className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer ${
            isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-800 hover:border-indigo-500/50' : 'bg-white border border-slate-200 hover:border-indigo-300'
          }`}>
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10`} style={{ backgroundColor: stat.color }}></div>
            <div className="flex items-start justify-between mb-3">
              <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight" style={{ color: isDark ? 'white' : stat.color }}>{stat.value}</span>
              <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{stat.unit}</span>
            </div>
            <p className="text-xs mt-1.5 font-medium" style={{ color: stat.color }}>{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3 px-6 pb-5">
        <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-200">
          ⚡ AI批量排舱
        </button>
        <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
          isDark ? 'bg-slate-800 text-indigo-400 hover:bg-slate-700' : 'bg-slate-100 text-indigo-600 hover:bg-slate-200'
        }`}>
          ⚠️ 合规预警 <span className="bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">19</span>
        </button>
        <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
          isDark ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700' : 'bg-slate-100 text-emerald-600 hover:bg-slate-200'
        }`}>
          📈 舱位预测
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {currentPage === 'flight' ? (
          <div className="flex-1 overflow-auto px-6 pb-4">
            <div className={`rounded-2xl overflow-hidden shadow-xl ${
              isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'
            }`}>
              <div className={`flex items-center justify-between px-6 py-4 border-b ${
                isDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center gap-4">
                  <h2 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>今日航班列表</h2>
                  <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-medium rounded-full">10 班</span>
                </div>
                <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>2026-03-10 · 实时更新</span>
              </div>
              
              <table className="w-full">
                <thead className={isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
                  <tr className={`text-left text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <th className="px-6 py-4 font-semibold">航班号</th>
                    <th className="px-6 py-4 font-semibold">航线</th>
                    <th className="px-6 py-4 font-semibold">时间</th>
                    <th className="px-6 py-4 font-semibold">机型</th>
                    <th className="px-6 py-4 font-semibold">装载率</th>
                    <th className="px-6 py-4 font-semibold">载量</th>
                    <th className="px-6 py-4 font-semibold">收益</th>
                    <th className="px-6 py-4 font-semibold">状态</th>
                    <th className="px-6 py-4 font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {flights.map((flight) => (
                    <tr 
                      key={flight.id}
                      onMouseEnter={() => setHoveredFlight(flight.id)}
                      onMouseLeave={() => setHoveredFlight(null)}
                      className={`border-t transition-all duration-200 ${
                        isDark 
                          ? 'border-slate-800 hover:bg-slate-800/50' 
                          : 'border-slate-100 hover:bg-indigo-50/50'
                      } ${hoveredFlight === flight.id ? (isDark ? 'bg-slate-800/30' : 'bg-indigo-50') : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                            <span className="text-indigo-400 font-bold">{flight.flightNo.slice(0,2)}</span>
                          </div>
                          <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{flight.flightNo}</span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{flight.route}</td>
                      <td className={`px-6 py-4 font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{flight.departureTime}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>{flight.aircraft}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-28 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                flight.loadRate >= 90 ? 'bg-emerald-500' : flight.loadRate >= 70 ? 'bg-indigo-500' : 'bg-rose-500'
                              }`} 
                              style={{ width: `${flight.loadRate}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm font-mono ${isDark ? 'text-white' : 'text-slate-700'}`}>{flight.loadRate}%</span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{flight.weight}/{flight.capacity}吨</td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${
                          flight.revenue >= 100 ? 'text-emerald-500' : flight.revenue >= 90 ? 'text-indigo-500' : isDark ? 'text-slate-500' : 'text-slate-400'
                        }`}>{flight.revenue}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1.5 rounded-full text-xs font-medium ${statusMap[flight.status].bg} ${statusMap[flight.status].color}`}>
                          {statusMap[flight.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleLoadClick(flight)}
                          className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
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
        ) : (
          <>
            {/* Cargo List */}
            <div className={`w-80 flex flex-col border-r ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className={`p-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>待排货物</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{cargos.length}票</span>
                </div>
                <div className="flex gap-2">
                  {['按收益', '按优先级', '按重量'].map((label, idx) => (
                    <button key={label} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 ${
                      idx === 0 
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                        : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-2">
                {cargos.map((cargo) => (
                  <div 
                    key={cargo.id} 
                    onClick={() => handleCargoClick(cargo.id)}
                    className={`mb-2 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                      cargo.isSelected 
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20' 
                        : isDark ? 'bg-slate-800/50 border-slate-800 hover:border-indigo-500/30 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          cargo.isSelected ? 'bg-indigo-500 border-indigo-500' : isDark ? 'border-slate-600' : 'border-slate-300'
                        }`}>
                          {cargo.isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{cargo.id}</span>
                      </div>
                      <div className="flex gap-1.5">
                        {cargo.isDgr && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-xs rounded-md font-medium">DGR</span>}
                        {cargo.isTemperature && <span className="px-2 py-0.5 bg-sky-500/20 text-sky-500 text-xs rounded-md font-medium">温控</span>}
                        {cargo.isOversize && <span className="px-2 py-0.5 bg-violet-500/20 text-violet-500 text-xs rounded-md font-medium">超大</span>}
                        {cargo.priority === 'high' && <span className="px-2 py-0.5 bg-rose-500/20 text-rose-500 text-xs rounded-md font-medium">急</span>}
                      </div>
                    </div>
                    <div className={`text-xs space-y-1.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      <div className="flex justify-between"><span>发货人:</span><span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{cargo.shipper}</span></div>
                      <div className="flex justify-between"><span>重量:</span><span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{cargo.weight}kg</span></div>
                      <div className="flex justify-between"><span>收益:</span><span className="text-emerald-500 font-medium">¥{cargo.revenue.toLocaleString()}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aircraft View */}
            <div className={`flex-1 flex flex-col ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <div className={`p-4 border-b flex items-center justify-between transition-all duration-300 ${
                isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
              }`}>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setCurrentPage('flight')}
                    className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                      isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h3 className={`font-bold text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {selectedFlight?.flightNo} {selectedFlight?.route}
                  </h3>
                  <span className="px-2.5 py-1 bg-rose-500/20 text-rose-500 text-xs rounded-full font-medium">预警</span>
                </div>
                <div className="flex items-center gap-6">
                  <div><p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>装载率</p><p className="text-amber-500 font-bold">{selectedFlight?.loadRate}%</p></div>
                  <div><p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>收益达成</p><p className="text-emerald-500 font-bold">{selectedFlight?.revenue}%</p></div>
                </div>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <div className="w-[600px]">
                  <div className="flex justify-center gap-3 mb-6">
                    {aircraftModels.map((model) => (
                      <button 
                        key={model.code} 
                        onClick={() => setSelectedAircraft(model)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 hover:scale-105 ${
                          selectedAircraft.code === model.code 
                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                            : isDark ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {model.name}
                      </button>
                    ))}
                  </div>
                  
                  {/* Aircraft */}
                  <div className="relative h-40 flex items-center justify-center">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-28">
                      <div class-0 top-Name={`absolute left0 w-24 h-22 rounded-lg -rotate-12 -translate-y-4 ${isDark ? 'bg-slate-700' : 'bg-blue-100'}`}></div>
                      <div className={`absolute right-0 top-0 w-24 h-22 rounded-lg rotate-12 -translate-y-4 ${isDark ? 'bg-slate-700' : 'bg-blue-100'}`}></div>
                    </div>
                    <div className={`w-[380px] h-14 rounded-full relative ${isDark ? 'bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700' : 'bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200'}`}>
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-10 h-8 rounded-l-full ${isDark ? 'bg-slate-700' : 'bg-blue-200'}`}></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-6 mt-8">
                    {selectedAircraft.compartments.map((comp) => (
                      <div key={comp.code} className={`w-32 h-24 rounded-xl border-2 p-3 ${
                        isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                      }`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{comp.name}</span>
                          <span className="text-xs font-bold text-cyan-500">{Math.floor(Math.random() * 30 + 70)}%</span>
                        </div>
                        <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                          <div className="h-full bg-cyan-500 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <div className="flex justify-between text-xs mt-2">
                          <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>{comp.code}</span>
                          <span>{comp.maxWeight}吨</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className={`w-72 flex flex-col ${
              isDark ? 'bg-slate-900 border-l border-slate-800' : 'bg-white border-l border-slate-200'
            }`}>
              <div className={`p-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <h3 className="font-semibold">货物详情</h3>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-4 text-4xl">📦</div>
                  <p className={isDark ? 'text-slate-500' : 'text-slate-400'}>点击货物查看详情</p>
                </div>
              </div>
              <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>已选货物</p>
                    <p className="text-xl font-semibold">{selectedCount}票</p>
                  </div>
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>已排重量</p>
                    <p className="text-xl font-semibold">{selectedWeight.toFixed(1)}吨</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <button className="w-full py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-200">保存方案</button>
                  <button className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-200">AI批量排舱</button>
                  <button className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                    isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>重置</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App
