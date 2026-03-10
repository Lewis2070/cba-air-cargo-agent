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
  isSelected: boolean
}

interface AircraftModel {
  name: string
  code: string
  maxWeight: number
  compartments: { name: string; code: string; maxWeight: number }[]
}

// Boeing Aircraft Models
const aircraftModels: AircraftModel[] = [
  { name: 'Boeing 747-400F', code: 'B744F', maxWeight: 124, compartments: [{ name: '前货舱', code: 'A', maxWeight: 27 }, { name: '中货舱', code: 'B', maxWeight: 48 }, { name: '后货舱', code: 'C', maxWeight: 49 }] },
  { name: 'Boeing 777F', code: 'B77F', maxWeight: 102, compartments: [{ name: '前货舱', code: 'A', maxWeight: 51 }, { name: '后货舱', code: 'B', maxWeight: 51 }] },
  { name: 'Boeing 767-300F', code: 'B763F', maxWeight: 52, compartments: [{ name: '前货舱', code: 'A', maxWeight: 26 }, { name: '后货舱', code: 'B', maxWeight: 26 }] },
]

const flights: Flight[] = [
  { id: '1', flightNo: 'MU5735', route: 'PVG→LAX', departureTime: '23:55', arrivalTime: '16:30+1', aircraft: 'B77F', loadRate: 84.9, revenue: 93, weight: 85.2, capacity: 102, status: 'planned', warning: 2 },
  { id: '2', flightNo: 'MU5737', route: 'PVG→LAX', departureTime: '23:55', arrivalTime: '16:30+1', aircraft: 'B77F', loadRate: 95.3, revenue: 110, weight: 95.3, capacity: 102, status: 'warning', warning: 5 },
  { id: '3', flightNo: 'CA881', route: 'PVG→FRA', departureTime: '14:30', arrivalTime: '06:20+1', aircraft: 'B744F', loadRate: 67.3, revenue: 93, weight: 83.4, capacity: 124, status: 'loading', warning: 0 },
]

const initialCargos: Cargo[] = [
  { id: 'C001', shipper: '阿里巴巴', consignee: 'Amazon', weight: 1200, volume: 45, priority: 'high', revenue: 25000, type: '普货', isDgr: false, isTemperature: false, isOversize: false, isSelected: false },
  { id: 'C002', shipper: '京东物流', consignee: 'eBay', weight: 800, volume: 32, priority: 'high', revenue: 18000, type: '普货', isDgr: false, isTemperature: false, isOversize: false, isSelected: false },
  { id: 'C003', shipper: '顺丰速运', consignee: 'Walmart', weight: 450, volume: 18, priority: 'medium', revenue: 12000, type: '锂电池', isDgr: true, isTemperature: false, isOversize: false, isSelected: false },
  { id: 'C004', shipper: '拼多多', consignee: 'Target', weight: 2000, volume: 85, priority: 'medium', revenue: 35000, type: '普货', isDgr: false, isTemperature: false, isOversize: true, isSelected: false },
  { id: 'C005', shipper: '宁德时代', consignee: 'Tesla', weight: 3200, volume: 120, priority: 'high', revenue: 85000, type: '电池', isDgr: true, isTemperature: false, isOversize: true, isSelected: false },
  { id: 'C006', shipper: '辉瑞制药', consignee: 'CVS', weight: 200, volume: 5, priority: 'high', revenue: 45000, type: '温控货', isDgr: false, isTemperature: true, isOversize: false, isSelected: false },
]

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  planned: { label: '计划中', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  loading: { label: '装载中', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  closed: { label: '已关舱', color: 'text-gray-500', bg: 'bg-gray-500/10' },
  departed: { label: '已离港', color: 'text-green-500', bg: 'bg-green-500/10' },
  warning: { label: '预警', color: 'text-red-500', bg: 'bg-red-500/10' },
}

type Theme = 'dark' | 'light'

// Main Component
function App() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [currentPage, setCurrentPage] = useState<'flight' | 'load'>('flight')
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftModel>(aircraftModels[1])
  const [cargos, setCargos] = useState<Cargo[]>(initialCargos)

  const isDark = theme === 'dark'

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark')

  const handleLoadClick = (flight: Flight) => {
    const model = aircraftModels.find(m => m.code.includes(flight.aircraft.slice(0,4))) || aircraftModels[1]
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
    <div className={`h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#0d0d1a] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`h-16 flex items-center justify-between px-6 border-b transition-all duration-300 ${
        isDark ? 'bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-[#2a2a4a]' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            </div>
            <div>
              <h1 className="font-bold text-lg">CBA 智控</h1>
              <p className={`text-xs ${isDark ? 'text-[#8b8b9e]' : 'text-gray-500'}`}>货运智能排舱系统</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {['航班工作台', 'AI排舱', '舱位预测', '合规检查'].map((label, idx) => (
              <button key={label} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${idx === 0 ? (isDark ? 'bg-[#6366f1]/20 text-[#a5b4fc] border border-[#6366f1]/30' : 'bg-[#6366f1]/10 text-[#6366f1]') : (isDark ? 'text-[#8b8b9e] hover:text-white' : 'text-gray-600 hover:text-gray-900')}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-green-500 text-xs">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            系统正常
          </span>
          
          <button onClick={toggleTheme} className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-[#2a2a4a] text-[#8b8b9e]' : 'hover:bg-gray-100 text-gray-600'}`}>
            {isDark ? '☀️' : '🌙'}
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366f1] to-[#ec4899] flex items-center justify-center text-white font-semibold">张</div>
            <div>
              <p className="text-sm font-medium">张伟</p>
              <p className={`text-xs ${isDark ? 'text-[#8b8b9e]' : 'text-gray-500'}`}>吨控主管</p>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4">
        {[
          { label: '今日航班', value: '12', unit: '班', color: '#6366f1' },
          { label: '预警航班', value: '8', unit: '班', color: '#ef4444' },
          { label: '平均装载率', value: '81.0', unit: '%', color: '#10b981' },
          { label: '收益达成', value: '95.2', unit: '%', color: '#f59e0b' },
        ].map((stat, idx) => (
          <div key={idx} className={`relative overflow-hidden rounded-2xl p-5 transition-all ${isDark ? 'bg-[#1a1a2e] border border-[#2a2a4a]' : 'bg-white border border-gray-200'}`}>
            <p className={`text-sm mb-1 ${isDark ? 'text-[#8b8b9e]' : 'text-gray-500'}`}>{stat.label}</p>
            <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}<span className="text-sm font-normal">{stat.unit}</span></p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3 px-6 pb-4">
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-xl text-sm font-medium">
          ⚡ AI批量排舱
        </button>
        <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'bg-[#2a2a4a] text-[#a5b4fc]' : 'bg-gray-100 text-[#6366f1]'}`}>
          ⚠️ 合规预警 <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">19</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {currentPage === 'flight' ? (
          <div className={`flex-1 overflow-auto px-6 pb-4`}>
            <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-[#1a1a2e] border border-[#2a2a4a]' : 'bg-white border border-gray-200'}`}>
              <table className="w-full">
                <thead className={isDark ? 'bg-[#16213e]' : 'bg-gray-50'}>
                  <tr className={`text-left text-xs ${isDark ? 'text-[#8b8b9e]' : 'text-gray-500'}`}>
                    <th className="px-6 py-3">航班号</th>
                    <th className="px-6 py-3">航线</th>
                    <th className="px-6 py-3">时间</th>
                    <th className="px-6 py-3">机型</th>
                    <th className="px-6 py-3">装载率</th>
                    <th className="px-6 py-3">载量</th>
                    <th className="px-6 py-3">收益</th>
                    <th className="px-6 py-3">状态</th>
                    <th className="px-6 py-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {flights.map((flight) => (
                    <tr key={flight.id} className={`border-t ${isDark ? 'border-[#2a2a4a] hover:bg-[#2a2a4a]/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 font-semibold">{flight.flightNo}</td>
                      <td className="px-6 py-4">{flight.route}</td>
                      <td className="px-6 py-4 font-mono">{flight.departureTime}</td>
                      <td className="px-6 py-4">{flight.aircraft}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-24 h-2 rounded-full ${isDark ? 'bg-[#2a2a4a]' : 'bg-gray-200'}`}>
                            <div className={`h-full rounded-full ${flight.loadRate >= 90 ? 'bg-green-500' : flight.loadRate >= 70 ? 'bg-[#6366f1]' : 'bg-red-500'}`} style={{ width: `${flight.loadRate}%` }}></div>
                          </div>
                          <span className="text-sm">{flight.loadRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{flight.weight}/{flight.capacity}吨</td>
                      <td className="px-6 py-4">{flight.revenue}%</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs ${statusMap[flight.status].bg} ${statusMap[flight.status].color}`}>{statusMap[flight.status].label}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleLoadClick(flight)} className="px-4 py-2 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-lg text-sm">排舱</button>
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
            <div className={`w-80 flex flex-col border-r ${isDark ? 'bg-[#1a1a2e] border-[#2a2a4a]' : 'bg-white border-gray-200'}`}>
              <div className={`p-4 border-b ${isDark ? 'border-[#2a2a4a]' : 'border-gray-200'}`}>
                <h3 className="font-semibold mb-3">待排货物</h3>
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-[#6366f1] text-white rounded-lg text-xs">按收益</button>
                  <button className={`flex-1 px-3 py-2 rounded-lg text-xs ${isDark ? 'bg-[#2a2a4a] text-[#8b8b9e]' : 'bg-gray-100'}`}>按优先级</button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-2">
                {cargos.map((cargo) => (
                  <div key={cargo.id} onClick={() => handleCargoClick(cargo.id)} className={`mb-2 p-3 rounded-xl border cursor-pointer transition-all ${cargo.isSelected ? 'border-[#6366f1] bg-[#6366f1]/10' : (isDark ? 'bg-[#16213e] border-[#2a2a4a]' : 'bg-gray-50 border-gray-200')}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{cargo.id}</span>
                      <div className="flex gap-1">
                        {cargo.isDgr && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-500 text-xs rounded">DGR</span>}
                        {cargo.isTemperature && <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-500 text-xs rounded">温控</span>}
                        {cargo.isOversize && <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-500 text-xs rounded">超大</span>}
                        {cargo.priority === 'high' && <span className="px-1.5 py-0.5 bg-red-500/20 text-red-500 text-xs rounded">急</span>}
                      </div>
                    </div>
                    <div className={`text-xs ${isDark ? 'text-[#8b8b9e]' : 'text-gray-500'}`}>
                      <div className="flex justify-between"><span>发货人:</span><span>{cargo.shipper}</span></div>
                      <div className="flex justify-between"><span>重量:</span><span>{cargo.weight}kg</span></div>
                      <div className="flex justify-between"><span>收益:</span><span className="text-green-500">¥{cargo.revenue.toLocaleString()}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aircraft 3D */}
            <div className={`flex-1 flex flex-col ${isDark ? 'bg-[#16213e]' : 'bg-gray-50'}`}>
              <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-[#2a2a4a] bg-[#1a1a2e]' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center gap-4">
                  <h3 className="font-bold text-xl">{selectedFlight?.flightNo} {selectedFlight?.route}</h3>
                  <span className="px-2 py-1 bg-red-500/20 text-red-500 text-xs rounded-full">预警</span>
                </div>
                <div className="flex items-center gap-6">
                  <div><p className={`text-xs ${isDark ? 'text-[#8b8b9e]' : 'text-gray-400'}`}>装载率</p><p className="text-amber-500 font-bold">{selectedFlight?.loadRate}%</p></div>
                  <div><p className={`text-xs ${isDark ? 'text-[#8b8b9e]' : 'text-gray-400'}`}>收益达成</p><p className="text-green-500 font-bold">{selectedFlight?.revenue}%</p></div>
                </div>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <div className="w-[600px]">
                  {/* Aircraft Model Selector */}
                  <div className="flex justify-center gap-3 mb-6">
                    {aircraftModels.map((model) => (
                      <button key={model.code} onClick={() => setSelectedAircraft(model)} className={`px-4 py-2 rounded-lg text-sm transition-all ${selectedAircraft.code === model.code ? 'bg-[#6366f1] text-white' : (isDark ? 'bg-[#2a2a4a] text-[#8b8b9e]' : 'bg-gray-200')}`}>
                        {model.name}
                      </button>
                    ))}
                  </div>
                  
                  {/* Boeing Aircraft Visualization */}
                  <div className="relative h-40 flex items-center justify-center">
                    {/* Wings */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-28">
                      <div className={`absolute left-0 top-0 w-24 h-22 rounded-lg -rotate-12 -translate-y-4 ${isDark ? 'bg-[#1e3a5f]' : 'bg-blue-100'}`}></div>
                      <div className={`absolute right-0 top-0 w-24 h-22 rounded-lg rotate-12 -translate-y-4 ${isDark ? 'bg-[#1e3a5f]' : 'bg-blue-100'}`}></div>
                    </div>
                    {/* Fuselage */}
                    <div className={`w-[380px] h-14 rounded-full relative ${isDark ? 'bg-gradient-to-r from-[#1e3a5f] via-[#2a5a7f] to-[#1e3a5f]' : 'bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200'}`}>
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-10 h-8 rounded-l-full ${isDark ? 'bg-[#1e3a5f]' : 'bg-blue-200'}`}></div>
                    </div>
                  </div>
                  
                  {/* Compartments */}
                  <div className="flex justify-center gap-6 mt-8">
                    {selectedAircraft.compartments.map((comp, idx) => (
                      <div key={comp.code} className={`w-32 h-24 rounded-xl border-2 p-3 ${isDark ? 'bg-[#1a1a2e] border-[#2a2a4a]' : 'bg-white border-gray-200'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-xs ${isDark ? 'text-[#8b8b9e]' : 'text-gray-500'}`}>{comp.name}</span>
                          <span className="text-xs font-bold text-cyan-500">{Math.floor(Math.random() * 30 + 70)}%</span>
                        </div>
                        <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-[#2a2a4a]' : 'bg-gray-200'}`}>
                          <div className="h-full bg-cyan-500 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <div className="flex justify-between text-xs mt-2">
                          <span className={isDark ? 'text-[#8b8b9e]' : 'text-gray-500'}>{comp.code}</span>
                          <span>{comp.maxWeight}吨</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className={`w-72 flex flex-col ${isDark ? 'bg-[#1a1a2e] border-l border-[#2a2a4a]' : 'bg-white border-l border-gray-200'}`}>
              <div className={`p-4 border-b ${isDark ? 'border-[#2a2a4a]' : 'border-gray-200'}`}>
                <h3 className="font-semibold">货物详情</h3>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/20 flex items-center justify-center mx-auto mb-4 text-4xl">📦</div>
                  <p className={isDark ? 'text-[#8b8b9e]' : 'text-gray-500'}>点击货物查看详情</p>
                </div>
              </div>
              <div className={`p-4 border-t ${isDark ? 'border-[#2a2a4a]' : 'border-gray-200'}`}>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-[#16213e]' : 'bg-gray-50'}`}>
                    <p className={`text-xs ${isDark ? 'text-[#8b8b9e]' : 'text-gray-500'}`}>已选货物</p>
                    <p className="text-xl font-semibold">{selectedCount}票</p>
                  </div>
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-[#16213e]' : 'bg-gray-50'}`}>
                    <p className={`text-xs ${isDark ? 'text-[#8b8b9e]' : 'text-gray-500'}`}>已排重量</p>
                    <p className="text-xl font-semibold">{selectedWeight.toFixed(1)}吨</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <button className="w-full py-2.5 bg-[#6366f1] text-white rounded-xl text-sm font-medium">保存方案</button>
                  <button className="w-full py-2.5 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-xl text-sm font-medium">AI批量排舱</button>
                  <button className={`w-full py-2.5 rounded-xl text-sm font-medium ${isDark ? 'bg-[#2a2a4a] text-[#8b8b9e]' : 'bg-gray-100'}`}>重置</button>
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
